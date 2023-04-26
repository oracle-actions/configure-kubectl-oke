# Configure `kubectl` for Oracle Container Engine for Kubernetes

Use this GitHub Action to install and configure `kubectl` to connect to the specified [Oracle Container Engine for Kubernetes][1] (OKE) cluster.

## Prerequisites

The target OKE cluster must have a **public Kubernetes API Endpoint** in order for a standard GitHub Action workflow to successfully connect to the cluster. To access an OKE cluster with a private Kubernetes API endpoint, you must deploy a [self-hosted GitHub Runner][6] to an Oracle Cloud Infrastructure (OCI) compute instance on the same private subnet as that endpoint.

The following [OCI CLI environment variables][2] must be defined for the workflow:

* `OCI_CLI_USER`
* `OCI_CLI_TENANCY`
* `OCI_CLI_FINGERPRINT`
* `OCI_CLI_KEY_CONTENT`
* `OCI_CLI_REGION`

We recommend using GitHub Secrets to store these values. [Defining your environment variables][3] at the job or workflow level would allow multiple tasks/jobs to reduce duplication.

## Inputs

* `cluster`: (Required) The OCID of the OKE cluster to configure
* `enablePrivateEndpoint`: (Optional) set this to 'true' if you need to connect to a private Kubernetes API endpoint. Requires a self-hosted GitHub Runner deployed to an instance on the same private subnet. Default: false

## Sample workflow steps

The following sample workflow configures `kubectl` for the `OKE_CLUSTER_OCID` OKE cluster using **public** API Endpoint.

```yaml
jobs:
  install-kubectl:
    runs-on: ubuntu-latest
    name: Install Kubectl for OKE
    env:
      OCI_CLI_USER: ${{ secrets.OCI_CLI_USER }}
      OCI_CLI_TENANCY: ${{ secrets.OCI_CLI_TENANCY }}
      OCI_CLI_FINGERPRINT: ${{ secrets.OCI_CLI_FINGERPRINT }}
      OCI_CLI_KEY_CONTENT: ${{ secrets.OCI_CLI_KEY_CONTENT }}
      OCI_CLI_REGION: ${{ secrets.OCI_CLI_REGION }}

    steps:
      - name: Configure Kubectl
        uses: oracle-actions/configure-kubectl-oke@v1.3.2
        id: test-configure-kubectl-oke-action
        with:
          cluster: ${{ secrets.OKE_CLUSTER_OCID }}

      - name: Run Kubectl
        run: kubectl get nodes -A
```

The following sample workflow configures `kubectl` for the `OKE_CLUSTER_OCID` OKE cluster using **private** API Endpoint by adding `runs-on: self-hosted` to ensure this action runs on your self-hosted GitHub Runner. It also sets `enablePrivateEndpoint` to `true` to ensure the `kubeconfig` file contains the correct Kubernetes API information.

```yaml
jobs:
  install-kubectl:
    runs-on: self-hosted
    name: Install Kubectl for OKE
    env:
      OCI_CLI_USER: ${{ secrets.OCI_CLI_USER }}
      OCI_CLI_TENANCY: ${{ secrets.OCI_CLI_TENANCY }}
      OCI_CLI_FINGERPRINT: ${{ secrets.OCI_CLI_FINGERPRINT }}
      OCI_CLI_KEY_CONTENT: ${{ secrets.OCI_CLI_KEY_CONTENT }}
      OCI_CLI_REGION: ${{ secrets.OCI_CLI_REGION }}

    steps:
      - name: Configure Kubectl
        uses: oracle-actions/configure-kubectl-oke@v1.3.2
        id: test-configure-kubectl-oke-action
        with:
          cluster: ${{ secrets.OKE_CLUSTER_OCID }}
          enablePrivateEndpoint: true

      - name: Run Kubectl
        run: kubectl get nodes -A
```

## Contributing

We welcome contributions from the community. Before submitting a pull request, please [review our contribution guide][4].

## Security

Please consult the [security guide][5] for our responsible security vulnerability disclosure process.

## License

Copyright (c) 2021, 2023, Oracle and/or its affiliates.

Released under the Universal Permissive License v1.0 as shown at <https://oss.oracle.com/licenses/upl/>.

[1]: https://www.oracle.com/cloud-native/container-engine-kubernetes/
[2]: https://docs.oracle.com/en-us/iaas/Content/API/SDKDocs/clienvironmentvariables.htm
[3]: https://docs.github.com/en/actions/learn-github-actions/environment-variables
[4]:  /CONTRIBUTING.md
[5]:  ./SECURITY.md
[6]: https://docs.github.com/en/actions/hosting-your-own-runners
