/* Copyright (c) 2021, 2022, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as tc from '@actions/tool-cache';

import * as ce from 'oci-containerengine';
import { Region, SimpleAuthenticationDetailsProvider, getStringFromResponseBody } from 'oci-common';

/**
 * This function checks the local tools-cache before installing
 * kubectl from upstream.
 *
 * @param version required version of kubectl
 * @returns path to kubectl
 */
async function getKubectl(version: string): Promise<string> {
  let cachedKubectl = tc.find('kubectl', version);

  if (!cachedKubectl) {
    const kubectl = await tc.downloadTool(
      `https://storage.googleapis.com/kubernetes-release/release/${version}/bin/linux/amd64/kubectl`
    );
    cachedKubectl = await tc.cacheFile(kubectl, 'kubectl', 'kubectl', version);
  }

  fs.chmodSync(path.join(cachedKubectl, 'kubectl'), 0o644);
  return cachedKubectl;
}

/**
 * Install and configure kubectl
 *
 */
async function configureKubectl(): Promise<void> {
  if (!fs.existsSync(path.join(os.homedir(), '.oci-cli-installed'))) {
    core.startGroup('Installing Oracle Cloud Infrastructure CLI');
    await exec.exec('python -m pip install oci-cli');
    fs.writeFileSync(path.join(os.homedir(), '.oci-cli-installed'), 'success');
    core.endGroup();
  }

  // Required environment variables
  const tenancy = process.env.OCI_CLI_TENANCY || '';
  const user = process.env.OCI_CLI_USER || '';
  const fingerprint = process.env.OCI_CLI_FINGERPRINT || '';
  const privateKey = process.env.OCI_CLI_KEY_CONTENT || '';
  const region = Region.fromRegionId(process.env.OCI_CLI_REGION || '');

  // Inputs
  const clusterOCID = core.getInput('cluster', {required: true});
  const enablePrivateEndpoint = core.getInput('enablePrivateEndpoint').toLowerCase() === 'true';

  const authProvider = new SimpleAuthenticationDetailsProvider(
    tenancy,
    user,
    fingerprint,
    privateKey,
    null,
    region
  );

  const ceClient = new ce.ContainerEngineClient({
    authenticationDetailsProvider: authProvider
  });

  const oke = (
    await ceClient.getCluster({
      clusterId: clusterOCID
    })
  ).cluster;

  if (
    oke &&
    oke.id &&
    oke.kubernetesVersion &&
    (oke.endpointConfig?.isPublicIpEnabled || enablePrivateEndpoint)
  ) {
    const kubectlPath = await getKubectl(oke.kubernetesVersion);
    core.addPath(kubectlPath);

    const clusterEndpoint = ce.models.CreateClusterKubeconfigContentDetails.Endpoint;

    const kubeconfig = await getStringFromResponseBody(
      (
        await ceClient.createKubeconfig({
          clusterId: oke.id,
          createClusterKubeconfigContentDetails: {
            tokenVersion: '2.0.0',
            endpoint: enablePrivateEndpoint ? clusterEndpoint.PrivateEndpoint : clusterEndpoint.PublicEndpoint
          }
        })
      ).value
    );

    const kubeconfigPath = path.join(os.homedir(), '.kube');
    const kubeconfigFile = path.join(kubeconfigPath, 'config');

    if (!fs.existsSync(kubeconfigPath)) {
      fs.mkdirSync(kubeconfigPath);
    }

    fs.writeFileSync(kubeconfigFile, kubeconfig, {
      mode: 0o600,
      encoding: 'utf-8'
    });
  } else {
    core.setFailed('Error: Unable to connect to Oracle Container Engine for Kubenetes.');
  }
}

configureKubectl().catch(e => {
  if (e instanceof Error) core.setFailed(e.message);
});
