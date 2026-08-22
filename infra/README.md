# Infrastructure

Everything on Oracle Cloud, in one Terraform plan.

```
OCI  af-casablanca-1
├── VCN + public subnet
├── Internet gateway + route table
├── Security list  (22 from your IP, 80/443 from anywhere)
└── Ampere A1 instance + reserved public IP
        └── docker compose: caddy · keycloak · api · mysql · postgres
```

One instance runs the lot. The two databases are containers on it, publishing
no ports — nothing outside the host can reach them, and every query is a
loopback rather than a network round trip. It also stays entirely inside Always
Free: OCI's managed MySQL and PostgreSQL services both bill monthly.

---

## Before you start

```bash
oci setup config          # writes ~/.oci/config
ssh-keygen -t ed25519 -C youlearn -f ~/.ssh/youlearn
```

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars   # then fill it in
terraform init
terraform plan            # read this properly before applying
terraform apply
```

You need five values in `terraform.tfvars`: the tenancy and compartment OCIDs
(both are the tenancy OCID if you use the root compartment), your SSH public
key, your own IP for `ssh_allowed_cidr`, and your two hostnames.

`terraform.tfvars` and the state file both hold generated database passwords in
clear text. Both are git-ignored.

---

## After apply

### 1. DNS

```bash
terraform output dns_records
```

Create both A records. **Do this first** — Let's Encrypt cannot issue a
certificate until the names resolve, and Caddy will retry and fail until they
do.

### 2. Configure

```bash
terraform output -raw env_file > .env
```

Two values are marked `TODO`: the Keycloak bootstrap admin password, and your
OCIR namespace. Everything else — database passwords, the rate-limit pepper —
is generated.

### 3. Deploy

```bash
IP=$(terraform output -raw instance_public_ip)

scp -i ~/.ssh/youlearn .env ../docker-compose.prod.yml ubuntu@$IP:/opt/youlearn/
scp -i ~/.ssh/youlearn -r ../deploy ../scripts ubuntu@$IP:/opt/youlearn/

# backend/Database must keep that exact path — compose mounts
# ./backend/Database/schema.sql, and Docker silently creates an empty DIRECTORY
# there if the file is missing, which makes MySQL skip the schema without error.
ssh -i ~/.ssh/youlearn ubuntu@$IP 'mkdir -p /opt/youlearn/backend'
scp -i ~/.ssh/youlearn -r ../backend/Database ubuntu@$IP:/opt/youlearn/backend/

ssh -i ~/.ssh/youlearn ubuntu@$IP
```

On the instance:

```bash
cd /opt/youlearn
docker login ocir.af-casablanca-1.oci.oraclecloud.com
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

The schema creates itself: `docker-compose.prod.yml` mounts `schema.sql` into
the MySQL container's `docker-entrypoint-initdb.d`, which runs once on an empty
data directory. Keycloak's Postgres schema is created and migrated by Keycloak
itself.

Apply later migrations by hand as they appear:

```bash
docker compose -f docker-compose.prod.yml exec -T mysql \
  mysql -uroot -p"$MYSQL_ROOT_PASSWORD" youlearn < Database/migrations/002-curriculum-and-assets.sql
```

Do **not** load `seed.sql` — it inserts demo courses and three accounts whose
Keycloak IDs only exist in the development realm.

### 4. Read back the client secrets

The realm ships without them on purpose, so Keycloak generates a random secret
per client on first import:

```bash
KC_URL=https://<auth_domain> ../scripts/read-client-secrets.sh
```

Put `KEYCLOAK_ADMIN_CLIENT_SECRET` into `.env` and restart the api service.

---

## Things that will bite

**The lockfile must be resolved on Linux.** `npm ci` refuses to run when
`package-lock.json` and `package.json` disagree, and npm does not record the
optional platform dependencies of packages it will never install locally — so a
lockfile written on Windows is missing entries the Alpine build needs
(`@emnapi/core`, `@emnapi/runtime`, pulled in by Tailwind's oxide-wasm32 and
sharp). `npm install --package-lock-only` on the dev machine does not fix it,
with or without `--os/--cpu/--libc`. Resolve it on the target platform instead:

```bash
mkdir -p /tmp/relock && cp web/package.json web/package-lock.json /tmp/relock/
docker run --rm --platform linux/arm64 -v /tmp/relock:/w -w /w node:22-alpine   npm install --package-lock-only --no-audit --no-fund
cp /tmp/relock/package-lock.json web/
```

Seeding it with the existing lockfile keeps resolved versions put; a bare
`package.json` would let every caret range float.

**A missing bind-mount source is not an error.** If `./backend/Database/schema.sql`
does not exist next to `docker-compose.prod.yml`, Docker creates an empty
directory at that path and mounts it. MySQL then initialises an empty database
and reports nothing wrong; the failure only shows up later as
`ERROR 1824: Failed to open the referenced table 'users'` when a migration runs.
Confirm the file is a file before the first `up`.

**Two firewalls, not one.** OCI images ship an iptables `REJECT` covering
everything above port 22. Opening 80/443 in the security list is not enough —
the packets arrive and the instance drops them. `cloud-init` handles this on
first boot; if you ever rebuild the instance by hand, remember it.

**Capacity errors on A1.** Ampere is popular and free, so `terraform apply` can
fail with `Out of host capacity`. That is not a configuration problem — retry,
or try another availability domain.

**Back up the volumes.** All persistent state lives in Docker volumes on this
one instance: both databases and every uploaded video. Nothing is replicated.
Take boot-volume backups in the console, or sync `storage-data` to Object
Storage.

**Always Free limits, and what this config uses.**

| Allowance | Limit | Used here |
| --------- | ----- | --------- |
| Ampere A1 | 1,500 OCPU-hours + 9,000 GB-hours per month — 2 OCPUs / 12 GB run continuously | 2 OCPUs / 12 GB — the whole allowance |
| Block storage | 200 GB across all volumes | 50 GB boot volume |
| VCNs | 2 | 1 |

The A1 allowance is fully consumed by this one instance, so a second A1
instance would start billing. Everything else has room.

**After the 30-day trial.** The trial gives credits and lets you exceed Always
Free; when it ends, anything above the Always Free allowance is terminated. This
configuration sits inside it, so it keeps running without an upgrade — but only
because nothing here exceeds the table above.

**Idle instances can be reclaimed.** Oracle may reclaim Always Free compute that
looks idle over a long period. A low-traffic platform can qualify. Upgrading to
Pay As You Go removes that risk (and keeps the Always Free resources free).

---

## Still missing

The Next.js app has no image yet, so the `web:3000` upstream in
`deploy/Caddyfile` has nothing behind it. Either add a `web` service built from
a Dockerfile in `web/`, or run it on the host and repoint that upstream.
