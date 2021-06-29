# Configure `kubectl` for Oracle Container Engine for Kubernetes

Use this GitHub Action to install and configure `kubectl` to connect to
the specified [Oracle Container Engine for Kubernetes][OKE] (OKE) cluster.

## Prerequisites

* The target OKE cluster must have a **public Kubernetes API Endpoint** in
  order for the GitHub Action to connection to the cluster.

* The **[configure OCI credentials][CC]** action must be used in a preceeding step
  of the current workflow job.

## Inputs

* `cluster`: (Required) The OCID of the OKE cluster to configure

## Sample workflow steps

```yaml
steps:
  - name: Configure OCI Credentials
    uses: oracle-actions/configure-oci-credentials@v1
    with:
      user: ${{ secrets.OCI_USER }}
      fingerprint: ${{ secrets.OCI_FINGERPRINT }}
      private_key: ${{ secrets.OCI_PRIVATE_KEY }}
      tenancy: ${{ secrets.OCI_TENANCY }}
      region: 'us-ashburn-1'

  - name: Configure Kubectl
    uses: oracle-actions/configure-kubectl-oke@v1
    id: test-configure-kubectl-oke-action
    with:
      cluster: ${{ secrets.OKE_CLUSTER }}

  - name: Run Kubectl
    run: kubectl get nodes -A
```

## Security recommendations

The **[Oracle Cloud Infrastructure Security Guide][OSG]** details our recommended
**[best practices for securing user authentication][BP]** which include:

* creating **a dedicated service user account** specifically for GitHub Actions;
* assigning that service account a **unique** and **complex** password;
* **rotating the API signing key pair** used by the service account every 90 days; and
* using **[GitHub encrypted secrets][GHS]** to store credentials.

> **Tip:** if you [create these secrets in your organization][SO], you can limited
> which repositories have access to these secrets while also avoiding duplicating
> the credentials in multiple repositories.

## Contributing

We welcome contributions from the community. Please review our [contribution guide][CG],
then [start a discussion][SD] or [open an issue][OI] and let us know what you'd
like to contribute.

## Security

Please consult the [security guide][SG] for our responsible security
vulnerability disclosure process.

## License

Copyright (c) 2021 Oracle and/or its affiliates.

Released under the Universal Permissive License v1.0 as shown at
<https://oss.oracle.com/licenses/upl/>.

[OKE]: https://www.oracle.com/cloud-native/container-engine-kubernetes/
[CC]:  http://github.com/oracle-actions/configure-oci-credentials
[OSG]: https://docs.oracle.com/en-us/iaas/Content/Security/Concepts/security_guide.htm
[BP]:  https://docs.oracle.com/en-us/iaas/Content/Security/Reference/iam_security.htm
[GHS]: https://docs.github.com/en/actions/reference/encrypted-secrets
[SO]:  https://docs.github.com/en/actions/reference/encrypted-secrets#creating-encrypted-secrets-for-an-organization
[CG]:  /CONTRIBUTING.md
[SD]:  https://github.com/oracle-actions/configure-kubectl-oke/discussions
[OI]:  https://github.com/oracle-actions/configure-kubectl-oke/issues
[SG]:  ./SECURITY.md
