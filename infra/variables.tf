/* -----------------------------------------------------------------------------
 * Oracle Cloud
 * -------------------------------------------------------------------------- */

variable "oci_region" {
  description = "OCI region identifier, e.g. af-casablanca-1."
  type        = string
  default     = "af-casablanca-1"
}

variable "oci_compartment_ocid" {
  description = <<-EOT
    Compartment the network and instance are created in. For the root
    compartment this is the tenancy OCID. Console: Identity → Compartments.
  EOT
  type        = string

  validation {
    condition = (
      (startswith(var.oci_compartment_ocid, "ocid1.tenancy.") || startswith(var.oci_compartment_ocid, "ocid1.compartment."))
      && length(var.oci_compartment_ocid) > 40
      && !strcontains(var.oci_compartment_ocid, "xxxxx")
    )
    error_message = "Must be a real tenancy or compartment OCID — not the ocid1.tenancy.oc1..xxxxx placeholder from the example file, and not a repository or instance OCID. A wrong one here returns no results rather than an error."
  }
}

variable "oci_tenancy_ocid" {
  description = <<-EOT
    Tenancy OCID — used to list availability domains. Console: Profile →
    Tenancy. It always begins ocid1.tenancy.
  EOT
  type        = string

  validation {
    condition = (
      startswith(var.oci_tenancy_ocid, "ocid1.tenancy.")
      && length(var.oci_tenancy_ocid) > 40
      && !strcontains(var.oci_tenancy_ocid, "xxxxx")
    )
    error_message = "Must be a real TENANCY ocid (ocid1.tenancy...), not the placeholder from the example file. Find it under Profile → Tenancy. A wrong value makes the availability-domain lookup silently return nothing."
  }
}

variable "ssh_public_key" {
  description = <<-EOT
    Public key placed on the instance for SSH. Generate with:
      ssh-keygen -t ed25519 -C youlearn -f ~/.ssh/youlearn
    then paste the contents of ~/.ssh/youlearn.pub.
  EOT
  type        = string

  validation {
    condition     = can(regex("^(ssh-ed25519|ssh-rsa|ecdsa-)", trimspace(var.ssh_public_key)))
    error_message = "That does not look like an SSH public key — paste the .pub file, not the private key."
  }
}

variable "availability_domain" {
  description = <<-EOT
    Availability domain name, e.g. "kUxD:AF-CASABLANCA-1-AD-1".

    Leave null to look it up. Set it explicitly when the lookup returns nothing —
    which happens if the tenancy OCID is wrong, or the provider cannot
    authenticate. List them with:
      oci iam availability-domain list --query 'data[*].name'
  EOT
  type        = string
  default     = null
}

variable "instance_image_ocid" {
  description = <<-EOT
    Image to boot, e.g. "ocid1.image.oc1.af-casablanca-1.aaaa...".

    Leave null to pick the newest Ubuntu 22.04 aarch64 image automatically.
    Image lookups are region-specific and occasionally return nothing, so this
    escape hatch exists. Find one with:
      oci compute image list --compartment-id <tenancy-ocid>         --operating-system "Canonical Ubuntu" --shape VM.Standard.A1.Flex         --query 'data[0]."id"'
  EOT
  type        = string
  default     = null
}

variable "instance_ocpus" {
  description = <<-EOT
    Ampere cores.

    Always Free is metered in OCPU-hours: 1,500 per month, which is exactly
    2 OCPUs running continuously. The default uses the whole allowance on one
    instance — raising it means the instance is only free part of the month.
  EOT
  type        = number
  default     = 2

  validation {
    condition     = var.instance_ocpus >= 1 && var.instance_ocpus <= 4
    error_message = "A1 accepts 1–4 OCPUs. Above 2 exceeds the Always Free allowance if the instance runs all month."
  }
}

variable "instance_memory_gb" {
  description = <<-EOT
    RAM. Always Free is 9,000 GB-hours per month — 12 GB running continuously.
    A1 requires between 1 and 64 GB per OCPU.
  EOT
  type        = number
  default     = 12

  validation {
    condition     = var.instance_memory_gb >= 6 && var.instance_memory_gb <= 24
    error_message = "Keep this between 6 and 24 GB. 12 GB is the whole Always Free allowance."
  }
}

variable "ssh_allowed_cidr" {
  description = <<-EOT
    Who may reach port 22. Defaulting this to 0.0.0.0/0 would expose SSH to
    every scanner on the internet from the moment the instance boots, so it has
    no default — set it to your own address, e.g. "203.0.113.7/32".
    Find it with: curl -s ifconfig.me
  EOT
  type        = string

  validation {
    condition     = var.ssh_allowed_cidr != "0.0.0.0/0"
    error_message = "Refusing to open SSH to the whole internet. Use your own address with /32."
  }
}

/* -----------------------------------------------------------------------------
 * Application
 * -------------------------------------------------------------------------- */

variable "app_domain" {
  description = <<-EOT
    Where the web app is served, e.g. learn.naboulsiamine.com. No scheme.
    Optional: it only shapes the outputs, so the infrastructure can be created
    before you have decided. Set it later and re-run apply.
  EOT
  type        = string
  default     = null
}

variable "auth_domain" {
  description = "Where Keycloak is served, e.g. auth.naboulsiamine.com. No scheme."
  type        = string
  default     = null
}

variable "project" {
  description = "Prefix for resource names, so several environments can coexist."
  type        = string
  default     = "youlearn"
}
