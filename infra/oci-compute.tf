/**
 * The instance.
 *
 * One Ampere A1 running the whole platform: Keycloak, the API, their two
 * databases, and a reverse proxy. A *reserved* public IP rather than an
 * ephemeral one, because that address goes into DNS — and an ephemeral IP
 * changes when the instance is stopped, which would silently break both
 * hostnames and every certificate renewal.
 */

# No `shape` filter here on purpose: combining it with the operating-system
# filters makes this return an empty list in several regions. The ARM images are
# picked out below by name instead, which is reliable everywhere.
data "oci_core_images" "ubuntu" {
  compartment_id           = var.oci_compartment_ocid
  operating_system         = "Canonical Ubuntu"
  operating_system_version = "22.04"
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"
}

locals {
  # Ubuntu ARM images are published as "Canonical-Ubuntu-22.04-aarch64-<date>".
  # Without this filter the newest image is an x86 one, which an A1 shape
  # rejects at launch with an error that does not mention architecture.
  arm_images = [
    for image in try(data.oci_core_images.ubuntu.images, []) :
    image if can(regex("aarch64", image.display_name))
  ]

  # An explicit variable always wins; the lookup is a convenience, not a
  # dependency. Either may be null, which the preconditions below report.
  resolved_image = coalesce(
    var.instance_image_ocid,
    try(local.arm_images[0].id, "")
  )

  resolved_ad = coalesce(
    var.availability_domain,
    try(data.oci_identity_availability_domains.this.availability_domains[0].name, "")
  )
}

resource "oci_core_instance" "app" {
  compartment_id      = var.oci_compartment_ocid
  availability_domain = local.resolved_ad
  display_name        = "${var.project}-app"
  shape               = "VM.Standard.A1.Flex"

  shape_config {
    ocpus         = var.instance_ocpus
    memory_in_gbs = var.instance_memory_gb
  }

  source_details {
    source_type             = "image"
    source_id               = local.resolved_image
    boot_volume_size_in_gbs = 50
  }

  create_vnic_details {
    subnet_id = oci_core_subnet.public.id
    # False: a reserved IP is attached separately below. Letting OCI assign an
    # ephemeral one here would conflict with it.
    assign_public_ip = false
    hostname_label   = var.project
  }

  metadata = {
    ssh_authorized_keys = var.ssh_public_key
    user_data           = base64encode(local.cloud_init)
  }

  # The image data source returns the newest Ubuntu build, so a later apply
  # would otherwise want to rebuild the instance every time Canonical publishes
  # one. Upgrades are a deliberate act, not a side effect of running plan.
  lifecycle {
    ignore_changes = [source_details[0].source_id]

    # An empty lookup means the provider could not read from OCI — almost always
    # authentication or a wrong OCID, not a missing resource. Say so here rather
    # than letting it surface as "attempt to index null value".
    precondition {
      condition     = local.resolved_ad != ""
      error_message = <<-EOT
        No availability domain found.

        The lookup uses oci_tenancy_ocid, which must be the TENANCY ocid
        (ocid1.tenancy.oc1..) — not a compartment. A null result usually means
        that value is wrong, or the provider cannot authenticate against
        ~/.oci/config.

        Check with:  oci iam availability-domain list --query 'data[*].name'
        Or set availability_domain in terraform.tfvars to skip the lookup.
      EOT
    }

    precondition {
      condition     = local.resolved_image != ""
      error_message = <<-EOT
        No Ubuntu 22.04 aarch64 image found in this region.

        Set instance_image_ocid in terraform.tfvars to pin one explicitly:
          oci compute image list --compartment-id <tenancy-ocid>             --operating-system "Canonical Ubuntu"             --shape VM.Standard.A1.Flex --query 'data[0]."id"'
      EOT
    }
  }
}

/* -------------------------------------------------------------------------- */

data "oci_core_vnic_attachments" "app" {
  compartment_id      = var.oci_compartment_ocid
  instance_id         = oci_core_instance.app.id
  availability_domain = oci_core_instance.app.availability_domain
}

data "oci_core_private_ips" "app" {
  vnic_id = data.oci_core_vnic_attachments.app.vnic_attachments[0].vnic_id
}

resource "oci_core_public_ip" "app" {
  compartment_id = var.oci_compartment_ocid
  display_name   = "${var.project}-ip"

  # RESERVED, not EPHEMERAL. This address is pinned in your DNS records; it
  # must survive a stop/start.
  lifetime      = "RESERVED"
  private_ip_id = data.oci_core_private_ips.app.private_ips[0].id
}

/* -----------------------------------------------------------------------------
 * First boot
 * -------------------------------------------------------------------------- */

locals {
  cloud_init = <<-EOT
    #cloud-config
    package_update: true
    package_upgrade: false

    packages:
      - ca-certificates
      - curl
      - gnupg
      - iptables-persistent

    runcmd:
      # --- Docker -------------------------------------------------------------
      - install -m 0755 -d /etc/apt/keyrings
      - curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
      - chmod a+r /etc/apt/keyrings/docker.asc
      - echo "deb [arch=arm64 signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu jammy stable" > /etc/apt/sources.list.d/docker.list
      - apt-get update
      - apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

      # The default user runs docker without sudo. Skipping this is what leads
      # to `sudo docker` reading root's config and pushing anonymously.
      - usermod -aG docker ubuntu
      - systemctl enable --now docker

      # --- the firewall nobody expects ---------------------------------------
      # Oracle's Ubuntu image ships an iptables REJECT covering everything above
      # port 22. Opening 80/443 in the security list alone is not enough; the
      # packets arrive and are dropped by the instance itself.
      - iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
      - iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
      - netfilter-persistent save

      # --- where the app lives ------------------------------------------------
      - mkdir -p /opt/youlearn
      - chown ubuntu:ubuntu /opt/youlearn

    final_message: "youlearn host ready after $UPTIME seconds"
  EOT
}
