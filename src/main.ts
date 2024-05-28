/* Copyright (c) 2021, 2024, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import * as fs from "fs"
import * as os from "os"
import * as path from "path"
import { Readable } from "stream"
import { ReadableStream } from "stream/web"

import * as core from "@actions/core"
import * as exec from "@actions/exec"
import * as tc from "@actions/tool-cache"

import * as ce from "oci-containerengine"
import { Region, SimpleAuthenticationDetailsProvider, getStringFromResponseBody } from "oci-common"

const mapArch = (arch: string): string => {
  const mappings = {
    x32: "386",
    x64: "amd64",
    arm: "arm64",
    arm64: "arm64"
  }
  return mappings[arch as keyof typeof mappings]
}

const mapOS = (osPlatform: string): string => {
  const mappings = {
    darwin: "darwin",
    win32: "windows",
    linux: "linux"
  }
  return mappings[osPlatform as keyof typeof mappings]
}

const getArch = (): string => {
  return mapArch(os.arch())
}

const getPlatform = (): string => {
  return mapOS(os.platform())
}

const getDownloadURL = (version: string): string => {
  const arch = getArch()
  const platform = getPlatform()
  const fileSuffix = platform === "windows" ? ".exe" : ""
  return `https://dl.k8s.io/release/${version}/bin/${platform}/${arch}/kubectl${fileSuffix}`
}

/**
 * This function checks the local tools-cache before installing
 * kubectl from upstream.
 *
 * @param version required version of kubectl
 * @returns path to kubectl
 */
async function getKubectl(version: string): Promise<string> {
  let cachedKubectl = tc.find("kubectl", version)

  if (!cachedKubectl) {
    const kubectl = await tc.downloadTool(getDownloadURL(version))
    cachedKubectl = await tc.cacheFile(kubectl, "kubectl", "kubectl", version)
  }

  fs.chmodSync(path.join(cachedKubectl, "kubectl"), 0o755)
  return cachedKubectl
}

/**
 * Install and configure kubectl
 *
 */
export async function configureKubectl(): Promise<void> {
  try {
    if (!fs.existsSync(path.join(os.homedir(), ".oci-cli-installed"))) {
      core.startGroup("Installing Oracle Cloud Infrastructure CLI")
      await exec.exec("python -m pip install oci-cli")
      fs.writeFileSync(path.join(os.homedir(), ".oci-cli-installed"), "success")
      core.endGroup()
    }

    // Required environment variables
    const tenancy = process.env.OCI_CLI_TENANCY || ""
    const user = process.env.OCI_CLI_USER || ""
    const fingerprint = process.env.OCI_CLI_FINGERPRINT || ""
    const privateKey = process.env.OCI_CLI_KEY_CONTENT || ""
    const region = Region.fromRegionId(process.env.OCI_CLI_REGION || "")

    // Inputs
    const clusterOCID = core.getInput("cluster", { required: true })
    const enablePrivateEndpoint = core.getInput("enablePrivateEndpoint").toLowerCase() === "true"

    const authProvider = new SimpleAuthenticationDetailsProvider(tenancy, user, fingerprint, privateKey, null, region)

    const ceClient = new ce.ContainerEngineClient({
      authenticationDetailsProvider: authProvider
    })

    const oke = (
      await ceClient.getCluster({
        clusterId: clusterOCID
      })
    ).cluster

    if (oke && oke.id && oke.kubernetesVersion && (oke.endpointConfig?.isPublicIpEnabled || enablePrivateEndpoint)) {
      const kubectlPath = await getKubectl(oke.kubernetesVersion)
      core.addPath(kubectlPath)

      const clusterEndpoint = ce.models.CreateClusterKubeconfigContentDetails.Endpoint

      const kubeconfig = await getStringFromResponseBody(
        Readable.fromWeb(
          (
            await ceClient.createKubeconfig({
              clusterId: oke.id,
              createClusterKubeconfigContentDetails: {
                tokenVersion: "2.0.0",
                endpoint: enablePrivateEndpoint ? clusterEndpoint.PrivateEndpoint : clusterEndpoint.PublicEndpoint
              }
            })
          ).value as ReadableStream
        )
      )

      const kubeconfigPath = path.join(os.homedir(), ".kube")
      const kubeconfigFile = path.join(kubeconfigPath, "config")

      if (!fs.existsSync(kubeconfigPath)) {
        fs.mkdirSync(kubeconfigPath)
      }

      fs.writeFileSync(kubeconfigFile, kubeconfig, {
        mode: 0o600,
        encoding: "utf-8"
      })
    } else {
      core.setFailed("Error: Unable to connect to Oracle Container Engine for Kubenetes.")
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}
