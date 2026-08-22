/**
 * The virtual network.
 *
 * One public subnet holding one instance. There is deliberately no private
 * subnet: the databases are containers on that same instance, reachable only
 * over the compose network and publishing no port, so there is nothing for a
 * private subnet to protect — and a NAT gateway to give it internet access
 * would cost money for no benefit.
 *
 * Two firewalls sit between the internet and the application, and BOTH must
 * allow a port for it to work:
 *
 *   1. this security list, and
 *   2. iptables on the instance itself — Oracle's images ship with a default
 *      REJECT rule, which is the single most common reason a freshly created
 *      OCI instance appears to ignore its own open ports. cloud-init in
 *      oci-compute.tf deals with it.
 */

data "oci_identity_availability_domains" "this" {
  compartment_id = var.oci_tenancy_ocid
}

resource "oci_core_vcn" "this" {
  compartment_id = var.oci_compartment_ocid
  cidr_blocks    = ["10.20.0.0/16"]
  display_name   = "${var.project}-vcn"
  dns_label      = replace(var.project, "-", "")
}

resource "oci_core_internet_gateway" "this" {
  compartment_id = var.oci_compartment_ocid
  vcn_id         = oci_core_vcn.this.id
  display_name   = "${var.project}-igw"
  enabled        = true
}

resource "oci_core_route_table" "public" {
  compartment_id = var.oci_compartment_ocid
  vcn_id         = oci_core_vcn.this.id
  display_name   = "${var.project}-public-rt"

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.this.id
  }
}

resource "oci_core_security_list" "public" {
  compartment_id = var.oci_compartment_ocid
  vcn_id         = oci_core_vcn.this.id
  display_name   = "${var.project}-public-sl"

  # Outbound is unrestricted: the instance has to reach OCIR to pull images,
  # Let's Encrypt to renew certificates, and apt for updates.
  egress_security_rules {
    destination      = "0.0.0.0/0"
    destination_type = "CIDR_BLOCK"
    protocol         = "all"
  }

  # SSH, restricted to one address by variable validation.
  ingress_security_rules {
    protocol = "6" # TCP
    source   = var.ssh_allowed_cidr
    tcp_options {
      min = 22
      max = 22
    }
  }

  # HTTP — needed even on an HTTPS-only site, because Let's Encrypt's HTTP-01
  # challenge is served on port 80 and the reverse proxy redirects to 443.
  ingress_security_rules {
    protocol = "6"
    source   = "0.0.0.0/0"
    tcp_options {
      min = 80
      max = 80
    }
  }

  ingress_security_rules {
    protocol = "6"
    source   = "0.0.0.0/0"
    tcp_options {
      min = 443
      max = 443
    }
  }

  # Path MTU discovery. Without this, large responses can vanish into a
  # black hole on some networks instead of failing visibly.
  ingress_security_rules {
    protocol = "1" # ICMP
    source   = "0.0.0.0/0"
    icmp_options {
      type = 3
      code = 4
    }
  }
}

resource "oci_core_subnet" "public" {
  compartment_id             = var.oci_compartment_ocid
  vcn_id                     = oci_core_vcn.this.id
  cidr_block                 = "10.20.1.0/24"
  display_name               = "${var.project}-public-subnet"
  dns_label                  = "public"
  route_table_id             = oci_core_route_table.public.id
  security_list_ids          = [oci_core_security_list.public.id]
  prohibit_public_ip_on_vnic = false
}
