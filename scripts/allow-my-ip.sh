#!/usr/bin/env bash
#
# Point the SSH rule at whatever address you are on right now.
#
# Port 22 admits `ssh_allowed_cidrs` and nothing else, which is the reason this
# instance is not in a botnet — and also the reason a router that renews its
# DHCP lease locks you out of your own server. The symptom is specific: SSH
# hangs and then times out, while the site itself is perfectly fine, because
# 80 and 443 are open to everyone.
#
# This finds your current public address, rewrites that one line in
# infra/terraform.tfvars, and applies the security list.
#
#   ./scripts/allow-my-ip.sh              replace the list with this address
#   ./scripts/allow-my-ip.sh --add        keep the existing entries, add this one
#   ./scripts/allow-my-ip.sh --plan       show what would change, apply nothing
#   ./scripts/allow-my-ip.sh --yes        skip the confirmation prompt
#
# ## Why -target, which Terraform warns about
#
# The apply is limited to the security list. That is the whole change, and the
# alternative is a full plan that also diffs the instance and the generated
# passwords — at the moment you are locked out and want the shortest safe path
# back in. A plain `terraform apply` does the same thing and is fine too.
#
# ## If this cannot help you
#
# It needs to reach OCI, not the instance, so it works from anywhere. If OCI
# itself is unreachable, the console has a serial "Instance console connection"
# that needs no ingress rule at all.

set -euo pipefail

cd "$(dirname "$0")/.."

TFVARS="infra/terraform.tfvars"
TARGET="oci_core_security_list.public"

mode="replace"
plan_only=false
auto_approve=false

for arg in "$@"; do
  case "$arg" in
    --add)  mode="add" ;;
    --plan) plan_only=true ;;
    --yes)  auto_approve=true ;;
    -h|--help)
      sed -n '2,30p' "$0" | sed 's/^#\{1,2\} \{0,1\}//'
      exit 0
      ;;
    *)
      echo "error: unknown argument $arg" >&2
      exit 2
      ;;
  esac
done

command -v terraform >/dev/null || { echo "error: terraform is not on PATH" >&2; exit 1; }
[ -f "$TFVARS" ] || { echo "error: $TFVARS does not exist — copy terraform.tfvars.example first" >&2; exit 1; }

# ------------------------------------------------------------ current address --

# Three services, because any one of them can be down or rate-limiting, and a
# script that fails at "what is my IP" is a script that fails when you need it.
ip=""
for url in https://ifconfig.me https://api.ipify.org https://icanhazip.com; do
  ip=$(curl -fsS --max-time 5 "$url" 2>/dev/null | tr -d '[:space:]') || ip=""
  [ -n "$ip" ] && break
done

if ! printf '%s' "$ip" | grep -qE '^([0-9]{1,3}\.){3}[0-9]{1,3}$'; then
  echo "error: could not determine a public IPv4 address (got: '${ip:-nothing}')" >&2
  echo "       find it by hand and edit ssh_allowed_cidrs in $TFVARS" >&2
  exit 1
fi

cidr="$ip/32"
echo "current address: $cidr"

# ------------------------------------------------------------------- tfvars --

line=$(grep -n '^[[:space:]]*ssh_allowed_cidrs[[:space:]]*=' "$TFVARS" | head -1 | cut -d: -f1 || true)
if [ -z "$line" ]; then
  echo "error: no ssh_allowed_cidrs line in $TFVARS" >&2
  echo "       (renamed from ssh_allowed_cidr — it is a list now: [\"$cidr\"])" >&2
  exit 1
fi

existing=$(sed -n "${line}p" "$TFVARS" | grep -oE '[0-9a-fA-F:.]+/[0-9]+' || true)

if [ "$mode" = "add" ]; then
  # Existing entries first, this one last, no duplicates.
  entries=$(printf '%s\n%s\n' "$existing" "$cidr" | grep -v '^$' | awk '!seen[$0]++')
else
  entries="$cidr"
fi

# paste -d takes a LIST of delimiters and cycles through it, so ', ' would join
# the third entry with a space instead of a comma. Join with commas, space after.
rendered=$(printf '%s\n' "$entries" | sed 's/^/"/; s/$/"/' | paste -sd, - | sed 's/,/, /g')

if [ "$(printf '%s' "$existing" | tr '\n' ' ')" = "$(printf '%s' "$entries" | tr '\n' ' ')" ]; then
  echo "$TFVARS already lists exactly this — applying anyway, in case it was never pushed to OCI"
else
  # Preserve the file's own indentation; the alignment in a tfvars file is not
  # load-bearing but a diff full of whitespace churn is unpleasant to review.
  tmp=$(mktemp)
  awk -v n="$line" -v repl="ssh_allowed_cidrs = [$rendered]" \
    'NR == n { sub(/ssh_allowed_cidrs[[:space:]]*=.*/, repl) } { print }' "$TFVARS" > "$tmp"
  mv "$tmp" "$TFVARS"
  echo "$TFVARS: ssh_allowed_cidrs = [$rendered]"
fi

# -------------------------------------------------------------- terraform --

if [ "$plan_only" = true ]; then
  exec terraform -chdir=infra plan -target="$TARGET"
fi

if [ "$auto_approve" = true ]; then
  terraform -chdir=infra apply -auto-approve -target="$TARGET"
else
  terraform -chdir=infra apply -target="$TARGET"
fi

echo
echo "done. Try it:  $(terraform -chdir=infra output -raw ssh_command 2>/dev/null || echo 'terraform -chdir=infra output ssh_command')"
