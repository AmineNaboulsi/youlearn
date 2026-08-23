# YouLearn

A course platform: a server-rendered Next.js front end, a PHP resource-server
API, and Keycloak as the identity provider.

```
web/       Next.js 16 · App Router · SSR only, no caching · Tailwind v4
backend/   PHP 8.3 API · validates Keycloak access tokens · MySQL
keycloak/  Realm definition + a custom login theme matching the platform
```

---

## Running it

```bash
docker compose up -d --build     # Keycloak, Postgres, MySQL, the PHP API
cd web && npm install
cp .env.example .env.local       # then fill in SESSION_SECRET (see below)
npm run dev
```

| Service           | URL                                            |
| ----------------- | ---------------------------------------------- |
| Web app           | http://localhost:3100                          |
| API               | http://localhost:8000                          |
| Keycloak          | http://localhost:8080 (`admin` / `admin`)      |
| MySQL             | localhost:3307 (`youlearn` / `youlearn`)       |

> **Why port 3100 and not 3000?** Ports 3000 and 3030 were already taken on the
> machine this was built on. The port appears in three places that must agree:
> `web/package.json` scripts, `APP_URL` in `web/.env.local`, and the
> `youlearn-web` client's redirect URIs in `keycloak/realm/youlearn-realm.json`.
> Change all three together, or Keycloak will refuse the redirect.

Generate a session key before first run:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

### Seeded accounts

| Account                  | Role       | Password          |
| ------------------------ | ---------- | ----------------- |
| `admin@youlearn.local`   | admin      | `Admin#2026pass`  |
| `teacher@youlearn.local` | enseignant | `Teacher#2026pass`|
| `student@youlearn.local` | etudiant   | `Student#2026pass`|

> The `admin@` and `teacher@` passwords have since been changed through the
> Keycloak account console and no longer match the table. Reset them from the
> Keycloak admin UI (Users → Credentials) if you need them; the realm's
> `passwordHistory(3)` policy will refuse the original value.

New sign-ups get the `etudiant` role automatically. Every one of these secrets —
the three passwords, the three client secrets in the realm file, and
`RATE_LIMIT_PEPPER` — is a local-development value and must be replaced before
this runs anywhere else.

---

## How authentication works

Keycloak owns credentials, sessions and role assignment. Neither the web app nor
the API can authenticate anyone; there is no password column in the database.

```
browser ──1── Next.js ──2──► Keycloak ──3──► Next.js ──4──► PHP API
```

1. **Sign-in starts server-side.** `/api/auth/login` generates `state`, `nonce`
   and a PKCE verifier, seals them in a short-lived encrypted cookie, and
   redirects.
2. **Authorization Code + PKCE (S256)**, confidential client. The realm rejects
   an authorization request without `code_challenge_method`.
3. **The code is exchanged server-side.** The ID token's signature, issuer,
   audience and nonce are all verified before any claim is trusted. The result
   is sealed into an encrypted (A256GCM) `httpOnly` cookie.
4. **The API receives a bearer token** attached by the Next.js server. The
   browser never holds a token, so there is nothing for an XSS to steal.

The API verifies tokens locally against the realm's JWKS — RSA algorithms only,
issuer checked, and `aud`/`azp` checked so a token minted for a *different*
client in the same realm is refused. That last check is the one that is usually
missing, and without it any client in the realm becomes a skeleton key.

**Roles** come from the access token (`realm_access.roles`), which is the same
claim the API authorises against — so the UI cannot offer an action the API will
refuse.

**Token refresh** happens in `web/src/proxy.ts`, the only place in the request
lifecycle that can both read the old cookie and write a new one. A refresh that
fails — revoked session, suspended account — signs the user out cleanly.

**The session cookie is chunked** across `youlearn_session.0`, `.1`, … A sealed
session runs to roughly 4.8 KB and browsers silently *drop* a cookie over ~4 KB,
which would make sign-in appear to succeed and then not.

### Signing out

`POST /api/auth/logout` posts the refresh token to Keycloak's logout endpoint
server to server, which ends the SSO session with no browser hop at all. Clicking
"Sign out" therefore lands straight back on the home page — no confirmation
screen at the identity provider, no result page to click through.

The browser flow is the fallback, used only when that call fails, and it now
sends `client_id` alongside `id_token_hint`. That matters: Keycloak validates the
hint with its default token checks, expiry included, so an ID token older than
the five-minute access-token lifespan is discarded — and with no client resolved
Keycloak also refuses the `post_logout_redirect_uri`, stranding the user on a
terminal "You are logged out" page with no way back. Sending `client_id` means a
stale hint costs at most an extra confirmation click, never a one-way trip off
the platform.

### Sessions are visible and revocable

`/account/sessions` lists every device signed in to the account, marks the
current one, and can end any of them — individually, all-but-this-one, or all.
Revocation goes through Keycloak, so it invalidates the refresh token rather
than merely clearing a local cookie. Administrators get the same view for any
account at `/dashboard/people/[id]/sessions`, which is what you want when
somebody reports a compromised account.

Access tokens live 5 minutes precisely so that revocation takes effect quickly.

---

## Permissions

Roles are `admin`, `enseignant` (instructor) and `etudiant` (learner). What each
one may *do* is decided in the API, in `backend/src/Security/Permission.php`, so
changing the authorisation model is a code review rather than a click in an
admin console.

Two layers, deliberately:

- **Route-level.** Every endpoint in `backend/index.php` declares the permission
  it needs. An unprotected endpoint shows up as a missing `->requires(...)` in
  the route table, not as an absent `if` buried in a method body.
- **Ownership.** `course.manage` means "may manage courses", not "may manage
  *this* course". Instructors can only touch their own material; that check
  lives in the controller because no role-based rule can express it.

The front end hides actions the caller cannot perform — as a courtesy. Every one
is independently enforced server-side.

---

## Data export limits

Bulk export is the one action that turns a read permission into a portable copy
of other people's data that no later access-control change can take back. Four
independent limits apply, defined in `backend/src/Export/ExportPolicy.php`:

| Limit          | What it does                                                                   |
| -------------- | ------------------------------------------------------------------------------ |
| **Permission** | Each dataset names the permission it requires.                                  |
| **Scope**      | Non-admins are narrowed to their own rows — in SQL, not by filtering afterwards.|
| **Volume**     | A hard row ceiling. A capped file is marked truncated so a partial export is never mistaken for a complete one. |
| **Frequency**  | Per-dataset and global hourly quotas, so the row ceiling cannot be defeated by paging through it. |

Personal data is **masked by default**, even for callers allowed to export it
(`y****@example.com`). Unmasked output needs an explicit opt-in *and* the
`export.any` permission, and is recorded separately — so "exported the roster"
and "exported the roster with everyone's email address" are distinguishable
afterwards.

Every attempt is written to `export_audit`, **including refusals and throttles**.
A log that only records what succeeded cannot show you someone probing the
limits. If the audit row cannot be written, the export does not happen.

CSV cells beginning with `=`, `+`, `-` or `@` are neutralised, because a learner
who signs up as `=cmd|'/c calc'!A1` should not get code execution on the machine
of whoever opens the export.

Rate limiting is a sliding window in MySQL rather than Redis — the brief ruled
out a caching layer, and a durable counter is the better choice anyway: restarting
the API must not hand an attacker a fresh quota. Actors are stored as keyed
hashes so the table never becomes a second, unaudited log of who used the
platform and from where.

---

## No caching

Every route is `force-dynamic`, every fetch is `cache: "no-store"`, and both the
proxy and `next.config.ts` send `Cache-Control: no-store`. There is no ISR
window, no fetch cache and no Redis. Course data is cheap to fetch; serving one
signed-in user a page built from another user's response is not.

The two things deliberately held in memory are *public keys* — the realm's JWKS,
in the API and in jose. That is how every OIDC resource server works; re-fetching
a public key set on every request would make Keycloak a hard dependency of every
single API call.

---

## The look

Monochrome and light-only, by decision rather than omission. There is no dark
palette and no `prefers-color-scheme` block, so the app looks the same
everywhere — and the Keycloak login theme in `keycloak/themes/youlearn` uses the
same type scale, radii, borders and grid motif, so the hand-off to the identity
provider is invisible.

Emphasis comes from weight, size, border and space rather than hue. The one
exception is course artwork, which is shown in its own colours: a cover is how
an instructor says what a course is about before anyone reads the title, and it
was previously greyscaled, which threw that away. It still uses a plain `<img>`
rather than `next/image` — the URL comes from an instructor, and the image
optimizer would make the server fetch whatever host they typed.

A lesson you have finished is struck through in the contents, beside the tick
that already marks it. The tick is precise; the rule is what makes a
half-finished course readable at a glance.

The stats sections on the home page and dashboard are rebuilds of the
[Aceternity stats blocks](https://ui.aceternity.com/blocks/stats-sections) —
"with grid background" and "with number ticker" — in this palette, driven by
live figures.


---

## Courses, videos and watch tracking

A course is sections holding lessons. A section is a named group ("Getting
started"); a lesson is a video or a piece of writing. Instructors build this at
`/dashboard/courses/{id}/curriculum`, learners work through it at
`/learn/{courseId}/{lessonId}`.

### Files live on the backend

Uploaded covers and lesson videos are written to the filesystem at
`STORAGE_ROOT` (`/var/www/storage`), which is **outside the web root**. Apache
serves `/var/www/html`; nothing under the storage root has a URL of its own.
Every byte is handed out by `AssetController`, which checks permission first:

| Asset | Who can read it |
| ----- | --------------- |
| Course cover | Anyone — it appears in the catalogue |
| Lesson video | The instructor, an admin, anyone enrolled |
| Lesson video on a **preview** lesson | Anyone, signed in or not |
| Not yet attached to a course | Only whoever uploaded it |

A file used by *any* preview lesson is public even if another lesson also uses
it — gating the second one would protect nothing, because the identical bytes
are already downloadable through the first.

**File type is decided by content, not by filename.** The upload is sniffed with
`finfo` once every byte has arrived; a `.mp4` that is not really a video is
refused at that point. Only formats a browser can actually play are accepted
(MP4, WebM, QuickTime), because otherwise an instructor uploads half a gigabyte
and finds out it is unplayable when a learner complains.

### Uploads are chunked

The browser slices the file into 5 MiB pieces and sends them one request at a
time; the API appends each to a temp file and checks the offset the client
claims against what it has actually received, so a lost or duplicated chunk is
refused rather than silently corrupting the video.

This is what makes a 700 MB lecture recording possible at all: no single request
is large enough to hit a PHP, Apache or load-balancer limit, and an upload
interrupted at 80% resumes from 80%. Abandoned uploads are swept off disk after
a day.

### The video player

`<video controls>`, not a custom skin — that brings keyboard support, captions,
picture-in-picture and playback rate for free.

Video is fetched through `/api/media/{id}` on the Next.js server rather than
straight from the API. A `<video src>` is loaded *by the browser*, which holds
no token; the alternatives were a signed URL or a proxy. Proxying won: a signed
URL is a bearer credential in a query string that lands in history and logs and
cannot be revoked before it expires, whereas proxying re-checks enrolment on
every range request — so revoking access stops playback mid-video.

Range requests pass through in both directions, which is what makes seeking
work. `AssetController` implements them properly, including `bytes=-500` (how
players read the end of an MP4 before playing anything) and `416` for a range
past the end.

### Watch tracking

Three numbers per learner per lesson, because they answer different questions:

| Column | Answers |
| ------ | ------- |
| `last_position_seconds` | Where playback resumes |
| `furthest_seconds` | How far into the lesson they reached |
| `watched_seconds` | How much time they actually spent watching |

The player measures elapsed time from a wall clock **while playing**, not from
`currentTime`, and reports a small delta every ten seconds. So dragging the
scrubber to the end marks the lesson reached but not watched. The server clamps
each delta to 120 seconds and clamps position against the lesson's real
duration, so a client cannot inflate its own numbers. Completion is sticky at
90% — re-watching from the start does not un-complete a lesson.

Reports are flushed on pause, on ending, and on `pagehide` via `sendBeacon`,
which is the only thing that survives a closing tab.

### Live engagement

`/dashboard/courses/{id}/analytics` shows, per lesson: viewers, completions,
average watch time, and **how far through the average viewer got** — the last
one is where you see people giving up.

Every figure is a fresh query; nothing is cached at any layer. The page
re-renders itself every 15 seconds and pauses while the tab is hidden, so
"watching now" genuinely means people whose playback moved in the last five
minutes.


---

## Pushing to Oracle Cloud

Two images go to OCIR: `youlearn/keycloak` (theme and realm baked in) and
`youlearn/api` (PHP source and vendor baked in). The Next.js app is deployed
separately — it is not one of these images.

### One command

```bash
cp .env.deploy.example .env.deploy    # registry, namespace, user, auth token
./scripts/push-oci.sh --web-origin https://learn.example.com
```

That sanitises the realm, builds both images for the target architecture, and
pushes them. `--no-push` builds locally without touching the registry.

### What you need first

| Value | Where it comes from |
| ----- | ------------------- |
| Registry | `ocir.<region>.oci.oraclecloud.com`, e.g. `ocir.eu-frankfurt-1.oci.oraclecloud.com`. The older `fra.ocir.io` form still works. |
| Namespace | The **object storage namespace**, not the tenancy name. Console → Profile → Tenancy, or `oci os ns get`. |
| Username | `jdoe@example.com`, or `oracleidentitycloudservice/jdoe@example.com` for a federated user. The script prefixes the namespace itself. |
| Password | An **auth token**, not your console password. Profile → My profile → Tokens and keys → Auth tokens → Generate. Shown once. |

### Architecture matters

Oracle's Always Free compute (`VM.Standard.A1.Flex`) is Ampere — **arm64**. An
image built on an amd64 laptop pulls fine and then dies with `exec format
error`. `PLATFORM` defaults to `linux/arm64` for that reason; set it to
`linux/amd64` for an E-series shape, or to both for a multi-architecture
manifest.

Cross-building runs under emulation and is slow. Building on the instance
itself is often faster.

### Secrets are deliberately not in the images

`scripts/make-prod-realm.mjs` strips the three seeded accounts and every client
secret before the realm is baked in, and the Keycloak build **fails** if any
survive. Keycloak then generates a random secret per client on first import.

Native realm import does not reliably substitute environment variables
([keycloak#12069](https://github.com/keycloak/keycloak/issues/12069),
[#20199](https://github.com/keycloak/keycloak/issues/20199)), so templating them
out was not an option — and `docker history` would expose them even if a later
layer deleted the file.

Read the generated secrets back after the first start:

```bash
KC_URL=https://auth.example.com ./scripts/read-client-secrets.sh
```

### Running them

```bash
cp .env.prod.example .env             # on the server
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

Two things that will bite otherwise:

- **Mount a volume at `/var/www/storage`.** Every uploaded video lives there.
  The compose file does it; a bare `docker run` must too, or a redeploy loses
  every video on the platform.
- **Set `TRUSTED_PROXIES`** to your load balancer's address. Without it
  `X-Forwarded-For` is ignored and every rate-limit bucket and audit row records
  the proxy instead of the caller.

TLS is assumed to terminate in front of the stack; neither service publishes a
port directly.

---

## What changed from the previous version

The old stack was a Vite SPA with a hand-rolled PHP JWT API. Beyond the rewrite,
these were bugs fixed along the way:

- **SQL injection in `LIMIT`/`OFFSET`.** They were interpolated into the query
  string. Everything is a bound parameter now, and `ATTR_EMULATE_PREPARES` is
  off so integers really are sent as integers.
- **No ownership checks.** Any instructor could edit or delete any other
  instructor's course.
- **CORS headers were never sent.** `header('Access-Control-Allow-Origin : *')`
  — the space before the colon makes it not a header. Preflight was unhandled.
  Origins are now an exact allowlist.
- **`if ($id = -1)`** — an assignment in a condition, so a statistics query
  always took the same branch.
- **A hardcoded `instructor = 8`** inside the enrolment reporting query.
- **N+1 tag queries** that reused the same statement variable inside the loop
  they were iterating.
- Unbounded request bodies, no rate limiting, stack traces in responses, and
  `password` stored alongside application data.

The Vite SPA that used to live in `client/` has been removed — `web/` replaces
it entirely.
