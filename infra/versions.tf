/**
 * YouLearn infrastructure.
 *
 * Everything on Oracle Cloud: one VCN, one Ampere instance, and the four
 * containers that make up the platform — Keycloak, the API, and their two
 * databases. No second cloud and no managed database service, so it stays
 * inside Always Free and every query is a loopback rather than a round trip
 * across the internet.
 *
 * Nothing here is applied automatically. `terraform plan` first, every time.
 */

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    oci = {
      source  = "oracle/oci"
      version = "~> 6.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # State holds the generated database passwords in clear text. Local state is
  # fine for one operator on one laptop; the moment a second person touches
  # this, move it to a remote backend with encryption and locking — OCI Object
  # Storage works via the s3-compatible backend.
}

provider "oci" {
  # Reads ~/.oci/config by default. Run `oci setup config` once, or set
  # TF_VAR_* / OCI_* environment variables instead.
  region = var.oci_region
}
