# Configure `kubectl` for Oracle Container Engine for Kubernetes

Use this GitHub Action to install and configure `kubectl` to connect to the specified [Oracle Container Engine for Kubernetes][1] (OKE) cluster.

## Prerequisites

The target OKE cluster must have a **public Kubernetes API Endpoint** in order for the GitHub Action to successfully connect to the cluster.

The following [OCI CLI environment variables][2] must be defined for the workflow:

* `OCI_CLI_USER`
* `OCI_CLI_TENANCY`
* `OCI_CLI_FINGERPRINT`
* `OCI_CLI_KEY_CONTENT`
* `OCI_CLI_REGION`

We recommend using GitHub Secrets to store these values. [Defining your environment variables][3] at the job or workflow level would allow multiple tasks/jobs to reduce duplication.

## Inputs

* `cluster`: (Required) The OCID of the OKE cluster to configure

## Sample workflow steps

The following sample workflow configures `kubectl` for the `OKE_CLUSTER_OCID` OKE cluster.

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
        uses: oracle-actions/configure-kubectl-oke@v1.1
        id: test-configure-kubectl-oke-action
        with:
          cluster: ${{ secrets.OKE_CLUSTER_OCID }}

      - name: Run Kubectl
        run: kubectl get nodes -A
```

## Contributing

We welcome contributions from the community. Before submitting a pull request, please [review our contribution guide][4].

## Security

Please consult the [security guide][5] for our responsible security vulnerability disclosure process.

## License

Copyright (c) 2021, 2022, Oracle and/or its affiliates.

Released under the Universal Permissive License v1.0 as shown at <https://oss.oracle.com/licenses/upl/>.

[1]: https://www.oracle.com/cloud-native/container-engine-kubernetes/
[2]: https://docs.oracle.com/en-us/iaas/Content/API/SDKDocs/clienvironmentvariables.htm
[3]: https://docs.github.com/en/actions/learn-github-actions/environment-variables
[4]:  /CONTRIBUTING.md
[5]:  ./SECURITY.md
