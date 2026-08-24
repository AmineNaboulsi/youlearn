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
key, your own address in `ssh_allowed_cidrs`, and your two hostnames.

`terraform.tfvars` and the state file both hold generated database passwords in
clear text. Both are git-ignored.

### SSH is pinned to your address

`ssh_allowed_cidrs` is a list, and each entry becomes its own ingress rule —
home, office and a phone hotspot can each be a `/32` rather than sharing one
range wide enough to cover them all. Everything else about port 22 is closed.

Home connections are handed a new address every few days, and when yours
changes the symptom is unmistakable: **SSH hangs and times out while the site
itself is perfectly fine.** 80 and 443 are open to the world; only 22 is not.

```bash
./scripts/allow-my-ip.sh          # replace the list with wherever you are now
./scripts/allow-my-ip.sh --add    # keep the old entries, add this one
./scripts/allow-my-ip.sh --plan   # show the change, apply nothing
```

Make it the way you always connect, and the address is never wrong:

```bash
alias youlearn-ssh='./scripts/allow-my-ip.sh --yes && eval "$(terraform -chdir=infra output -raw ssh_command)"'
```

It finds your public address, rewrites that one line in `terraform.tfvars`, and
applies **only** the security list:

```bash
terraform -chdir=infra apply -target=oci_core_security_list.public
```

`-target` is not for routine use and Terraform says so every time. It earns its
place here: the security list is the entire change, and the moment you are
locked out is the wrong moment to read a full plan that also diffs the instance
and the generated passwords. A plain `terraform apply` does the same thing.

By hand, if you would rather not run the script:

```bash
curl -s ifconfig.me                          # your address
# edit infra/terraform.tfvars:
#   ssh_allowed_cidrs = ["203.0.113.7/32"]
cd infra
terraform plan     # expect: 1 to change, 0 to add, 0 to destroy
terraform apply
```

**What a correct plan looks like.** One resource changed —
`oci_core_security_list.public` — and nothing else. The instance is *not*
touched, nothing restarts, and the rule is live within seconds of apply
returning. If the plan wants to destroy or replace the instance, stop: that is
a different change that has crept in, not this one.

**If you are locked out and the script cannot help.** It talks to OCI, not to
the instance, so it works from any network. If you cannot reach OCI either, the
console offers an "Instance console connection" — a serial console that needs
no ingress rule at all.

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

## Continuous deployment

`.github/workflows/ci.yml` runs on every pull request: types, lint and a
production build of the web app, PHP syntax and a dependency audit, an arm64
image build of each Dockerfile, compose and Terraform validation, and a secret
scan over the commits the PR introduces. Nothing in it touches the server.

`.github/workflows/deploy.yml` runs on push to `main` — with pull requests as
the way changes arrive, that means on every merge. It builds all three images on
a native arm64 runner and pushes them to OCIR as both `latest` and the short
commit SHA.

**It never connects to the instance.** Port 22 is open only to
`ssh_allowed_cidrs`, and letting a GitHub runner through would mean opening sshd
to the internet or putting a VPN in the deploy path. Instead the instance polls:
a systemd timer runs `deploy/update.sh` every two minutes, which pulls this
repository for configuration and OCIR for images, then runs `docker compose up
-d`. That is idempotent — it recreates only containers whose image digest or
configuration actually changed — so a tick that finds nothing new does nothing.

The consequence worth knowing: the workflow holds no SSH key and no host
address. The worst a stolen token there can do is push an image, not run a
command.

### One-time setup on the instance

```bash
scp -i ~/.ssh/youlearn deploy/install-updater.sh ubuntu@<ip>:/tmp/
ssh -i ~/.ssh/youlearn ubuntu@<ip> 'sudo bash /tmp/install-updater.sh'
```

It refuses to run if `/opt/youlearn/.env` is missing, since that file holds
generated secrets and is not in the repository.

### Actions configuration

| Kind | Name | Value |
| ---- | ---- | ----- |
| Secret | `OCI_USERNAME` | `<namespace>/Default/<email>` |
| Secret | `OCI_AUTH_TOKEN` | an OCI auth token, not your console password |
| Secret | `OCI_NAMESPACE` | the tenancy's object-storage namespace |
| Variable | `OCI_REGISTRY` | `ocir.<region>.oci.oraclecloud.com` |
| Variable | `APP_URL` | `https://<app_domain>` |

### Watching a deploy

`/api/health` reports the commit its image was built from, and the workflow's
`verify` job polls it until that matches what it just built. Green therefore
means the change is live, not merely that the upload succeeded.

```bash
journalctl -u youlearn-update -f          # the deploy log
sudo systemctl start youlearn-update      # force a tick
sudo systemctl stop youlearn-update.timer # pause deploys
cat /opt/youlearn/.deployed               # what is live
```

Migrations are copied to the instance but **never applied automatically** — a
schema change that runs itself during an unattended restart is how a bad
migration takes the database with it. Apply them by hand, as above.

**Rolling back** is retagging; the instance picks it up on its next tick.

```bash
docker pull  $REG/$NS/youlearnweb:<good-sha>
docker tag   $REG/$NS/youlearnweb:<good-sha> $REG/$NS/youlearnweb:latest
docker push  $REG/$NS/youlearnweb:latest
```

---

## Reading the logs

Every container writes to stdout, and docker keeps three 10 MB files per
container — enough to read a crash that just happened, and nothing more. The
update timer recreates containers on every release, and a recreated container
takes its log with it, so "what did the scanner refuse last month" was not a
question this stack could answer.

Two services in `docker-compose.prod.yml` fix that. `logs-collector` (Vector)
reads what docker already collected and forwards it to `logs` (VictoriaLogs),
which keeps it on its own volume for `LOGS_RETENTION` — 90 days by default.

### The interface

VictoriaLogs ships a web UI, **vmui**. It is bound to `127.0.0.1` on purpose:
it has no login of its own, and publishing it would hand anyone who finds the
port every log this platform produces. Port 22 already admits only the
operator's address, so the way in is a tunnel:

```bash
ssh -L 9428:127.0.0.1:9428 ubuntu@<instance>
# then open http://127.0.0.1:9428/select/vmui
```

A query box, a time-range picker, and results as a table or as JSON. The
queries are [LogsQL](https://docs.victoriametrics.com/victorialogs/logsql/):

```logsql
malware_rejected                              # every refused upload, ever
_time:7d malware_rejected                     # …in the last week
_time:[2026-07-01, 2026-08-01] scan_unavailable
_time:1d container_name:youlearn-clamav-1 FOUND
_time:30d malware_rejected | stats count()
```

`_time` is optional in the UI, which has its own picker; it matters when
scripting against the HTTP API, which needs no browser at all:

```bash
curl -s http://127.0.0.1:9428/select/logsql/query   --data-urlencode 'query=malware_rejected'   --data-urlencode 'start=2026-07-01'   --data-urlencode 'end=2026-08-01'
```

If you would rather have it in a browser without a tunnel, give it a hostname
in `deploy/Caddyfile` behind `basic_auth` — do not set `LOGS_BIND=0.0.0.0`.

### Portainer — the interface for the stack itself

Caddy has no UI, and never has: its admin API is JSON on 2019 and there is no
page behind it. Routing lives in `deploy/Caddyfile`, in git, because anything
changed through an API is overwritten by the next deploy anyway. What a browser
*is* better at is looking at the containers — and that is Portainer.

```bash
ssh -L 9000:127.0.0.1:9000 ubuntu@<instance>
# then open http://127.0.0.1:9000
```

**Set the admin password within five minutes of the container's first start.**
Portainer disables initialisation after that, and the only way back is
`docker restart youlearn-portainer-1` to open a fresh window. After that first
setup it has its own login, which is one more than vmui and the admin API have
between them.

It holds the docker socket, so it can start, stop, restart and shell into every
container on the host — that is what it is for, and why it is on loopback
behind a tunnel rather than on a hostname with an address allow-list. An
allow-list would need editing every time the ISP hands you a new address, which
is the failure mode that already cost an evening on port 22. A tunnel follows
you to whatever network you are on.

One tunnel carries all three, and `scripts/tunnel.sh` is that command with the
address looked up from Terraform state and the SSH allow-list refreshed first —
because the two failures arrive together often enough to be worth handling in
one step: the site is down for its own reasons, and SSH hangs because the ISP
renewed a lease and port 22 no longer admits you.

```bash
./scripts/tunnel.sh              # allow this address, then open all three
./scripts/tunnel.sh --diagnose   # read the stack's state instead, and exit
```

By hand, if you would rather:

```bash
ssh -L 9000:127.0.0.1:9000 -L 9428:127.0.0.1:9428 -L 2019:127.0.0.1:2019 ubuntu@<instance>
```

| Port | What |
| ---- | ---- |
| 9000 | Portainer — containers, logs, shells, volumes |
| 9428 | VictoriaLogs vmui — every log, searchable by date |
| 2019 | Caddy's admin API — JSON only, needs an `Origin` header |

The proxy's admin API is reached the same way, on 2019:

```bash
ssh -L 2019:127.0.0.1:2019 ubuntu@<instance>
curl -s http://127.0.0.1:2019/config/ | head -c 400
```

It is a JSON API with no UI and no authentication — `GET /config/` returns what
Caddy is running — so it is published on the host's loopback only. Anything
that can reach it can repoint both hostnames, which is why it is not on a port
of its own with an allow-list in front.

### What a refused upload looks like

Three containers describe the same event, and searching for either marker finds
all of it:

| Where | Line |
| ----- | ---- |
| `youlearn-clamav-1` | `…/tmp/{upload-id}.part: YouLearn.SelfTest.Marker FOUND` |
| `youlearn-api-1` | `[youlearn] malware_rejected signature=… size_bytes=… path=…` |
| `youlearn-api-1` | `[youlearn] scan_unavailable reason=… host=clamav:3310 …` when clamd could not be reached at all |

The path ends in the upload id, which is the join back to the `upload_sessions`
row and therefore to the account that sent it. That indirection is the current
limit of this: the logs say *what* was refused, and the database says *who*.
Recording the two together — a `security_events` table alongside `export_audit`,
with a date-ranged page in the dashboard — is the next step, and the one that
makes this queryable without an SSH client.

`docs/malicious-upload-lifecycle.svg` traces the whole path, hop by hop, with
what each one logs.

### When the pipeline itself is the problem

The local files are still there, and `docker compose logs` still works:

```bash
docker compose logs -f logs-collector   # is it shipping?
docker compose logs --since 30m api     # the last half hour, no tunnel needed
curl -s http://127.0.0.1:9428/health    # on the instance
```

The collector needs `/var/run/docker.sock`, which is root on this host. That is
the price of reading container logs — Promtail, Alloy and Dozzle all charge it
— and nothing else in this stack gets the socket. Put
`tecnativa/docker-socket-proxy` in front of it, allowing `GET` only, if that
trade stops being acceptable.

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

**Docker Hub is not reliably reachable from this region.** Pulls from
af-casablanca-1 fail with `TLS handshake timeout` contacting `auth.docker.io`
often enough to break a deploy — it has done so on mysql, postgres, caddy and
clamav. OCIR, in the same region, serves all three application images in about
a second.

Run the **Mirror base images** workflow once, then set `CADDY_IMAGE`,
`POSTGRES_IMAGE`, `MYSQL_IMAGE`, `VICTORIALOGS_IMAGE`, `VECTOR_IMAGE` and
`CLAMAV_IMAGE` in the instance's `.env` to the OCIR copies it prints. That takes Docker Hub out of the runtime path
entirely. Until then, a base image that is not already on the host will
intermittently fail to arrive, and `docker compose up -d` fails with it.

To load one by hand in the meantime:

```bash
docker pull --platform linux/arm64 <image>
docker save --platform linux/arm64 <image> | gzip | ssh ubuntu@<ip> 'gunzip | docker load'
```

**Proving uploads are actually scanned.** A scanner that is switched off looks
exactly like one that finds nothing, so a successful upload is not evidence
either way. Generate a file the scanner must reject:

```bash
./scripts/make-scanner-test-file.sh
# then upload scanner-test.jpg as a course cover
```

Expected: refused, with "Malware scan failed." and `{"error":"infected_file"}`.
If it uploads cleanly, uploads are not being scanned.

EICAR cannot test this path, and it is worth knowing why before reaching for
it. ClamAV detects EICAR only when the file *is* the EICAR file — embedding the
string in a JPEG triggers nothing, by the standard's design — and a bare EICAR
file is `text/plain`, which the content sniffer refuses as an unsupported type
before the scanner is ever consulted. A rejection would prove only that type
checking works. The clamav image therefore carries a signature for a marker of
its own (`docker/clamav/youlearn-selftest.ndb`), which is what makes a
detectable *image* possible at all.

To exercise the scanner without going through the UI, against a file clamd is
known to detect:

```bash
docker exec youlearn-clamav-1 bash -c 'exec 3<>/dev/tcp/127.0.0.1/3310; printf "zPING\0" >&3; head -c 4 <&3'
```

**ClamAV needs the same path the API uses.** clamd is handed an absolute path
and resolves it in its own filesystem, so the storage volume is mounted into the
clamav container read-only at the identical mount point. Get that wrong and
every upload fails with "could not be scanned" rather than silently passing —
an unreachable or misconfigured scanner refuses uploads by design, because an
unavailable scanner is exactly when malware gets through. First start downloads
roughly 250 MB of signatures before the container reports healthy.

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

**A bind-mount source that does not exist becomes a directory.** Docker creates
one, root-owned, rather than failing — the same trap as `schema.sql` above, and
it caught `deploy/vector.yaml` on the tick that introduced it. The symptom is a
container restarting with a configuration error (vector exits 78) and every
later deploy failing, because `install` cannot replace a directory with a file.
`update.sh` now clears such a directory before installing, and re-executes
itself when a release changes it, so a new config file is installed by the tick
that ships it. To repair one by hand:

```bash
sudo rm -rf /opt/youlearn/deploy/<file>
sudo systemctl start youlearn-update
```

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
