# Course seeds

Two seeds, both real published curricula shaped to fit
`courses` → `course_sections` → `lessons`.

| File | Language | Courses | Lessons |
|---|---|---:|---:|
| `002-open-courseware.sql` | English | 5 | 112 |
| `003-morocco-bac-arabic.sql` | العربية | 4 | 196 |

They are independent — apply either, or both.

---

## 003 — المنهاج المغربي، الثانية باكالوريا

The Moroccan national programme for 2 Bac, in Arabic, which is the language the
platform defaults to.

| Course | Category | Sections | Lessons |
|---|---|---:|---:|
| الفيزياء والكيمياء — الثانية باكالوريا علوم فيزيائية | Physics | 21 | 130 |
| الرياضيات — الثانية باكالوريا علوم فيزيائية | Mathematics | 16 | 45 |
| علوم الحياة والأرض — الثانية باكالوريا علوم فيزيائية | Life & Earth Sciences | 5 | 13 |
| الفلسفة — الثانية باكالوريا | Philosophy | 4 | 8 |

**4 courses · 46 sections · 196 lessons.**

Structure and lesson titles were read off [AlloSchool](https://www.alloschool.com/)'s
course pages, which follow the Ministry's official programme. The programme
itself is public curriculum — what is stored is the outline plus a link back.
No lesson text, exercise or exam paper is copied.

Philosophy is the four مجزوءات with their eight concepts — الشخص، الغير،
النظرية والتجربة، الحقيقة، الدولة، الحق والعدالة، الواجب، الحرية — exactly the
national exam's scope.

> **AlloSchool's written material is free; its video lessons need a Premium
> subscription.** Lessons therefore link to the course page rather than promise
> a free video. Their [free YouTube channel](https://www.youtube.com/channel/UCikh5nvI5z5AHmtsYq2XwBQ)
> is linked as well.

Adds one category, **Life & Earth Sciences**; the other three already exist
from 002. Tags are in Arabic (`الثانية باكالوريا`, `المنهاج المغربي`).

Apply it:

```sh
docker exec -i youlearn-mysql mysql -uroot -proot   < backend/Database/seeds/003-morocco-bac-arabic.sql
```

Verified the same way as 002 — run twice against a scratch database, identical
row counts, and Arabic checked for a clean round-trip through utf8mb4.

---

## 002 — Open courseware (English)

Real university course material — mathematics, physics and philosophy — shaped
to fit `courses` → `course_sections` → `lessons`.

| Course | Category | Sections | Lessons | Source |
|---|---|---:|---:|---|
| Linear Algebra (MIT 18.06) | Mathematics | 7 | 35 | [MIT OCW 18.06, Spring 2010](https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/) |
| Single Variable Calculus (MIT 18.01) | Mathematics | 5 | 13 | [MIT OCW 18.01SC, Fall 2010](https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/) |
| Classical Mechanics (MIT 8.01) | Physics | 4 | 12 | [MIT OCW 8.01SC, Fall 2016](https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/) |
| Death (Yale PHIL 176) | Philosophy | 4 | 26 | [Open Yale Courses](https://oyc.yale.edu/death/phil-176) |
| Philosophy and the Science of Human Nature (Yale PHIL 181) | Philosophy | 3 | 26 | [Open Yale Courses](https://oyc.yale.edu/philosophy/phil-181) |

**5 courses · 23 sections · 112 lessons.**

## Applying it

```sh
docker exec -i youlearn-mysql mysql -uroot -proot \
  < backend/Database/seeds/002-open-courseware.sql
```

Re-runnable. Every insert is keyed on a unique slug or email and guarded by a
`NOT EXISTS`, so a second run inserts nothing. Verified by running it twice
against a scratch database and comparing row counts.

It does not touch `seed.sql`'s demo data — the two sit side by side.

## Where the content actually lives

Nothing here reproduces a lecture. Each lesson row carries the real lecture
title, the source attribution, and a link out to the publisher, who keeps
hosting the video. That is the only arrangement the licences allow, and it also
means the material cannot go stale in your database.

Links were checked: all five course pages, all three YouTube playlists, and a
sample of the per-lecture URLs return 200.

- **Open Yale Courses** lessons link to the exact lecture
  (`oyc.yale.edu/philosophy/phil-176/lecture-14`).
- **MIT OpenCourseWare** lessons link to the course's YouTube playlist and name
  the lecture or week number. MIT's per-lecture URLs embed a slug of the
  lecture title, and titles like `Solving Ax = 0: pivot variables` do not
  produce a guessable slug — a link that 404s is worse than one that lands on
  the playlist.

## Licences — read this before charging for anything

| Publisher | Licence |
|---|---|
| MIT OpenCourseWare | [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) |
| Open Yale Courses | [CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/) |

Both are **NonCommercial**. Every course is seeded at `price = 0.00` and must
stay free for the seed to remain within its licence. Putting these behind a
paywall would breach it.

Attribution (**BY**) is carried in each course's `content` field and repeated on
every lesson, which is what the licence asks for.

## Two deliberate choices

**Courses are owned by a curator account,** `library@youlearn.local`
("YouLearn Open Library", role `enseignant`) — not by accounts named after the
real lecturers. Creating a login called "Gilbert Strang" would put words in a
real person's mouth and imply he publishes here. The real lecturer is credited
in the course body instead.

**Lessons are `kind = 'text'`, not `'video'`.** `lessons.video_asset_id` is a
foreign key into `assets`, which only holds files uploaded to this platform —
the schema has nowhere to put a third-party video URL. So each lesson is a text
lesson whose body is the note plus the link.

If you would rather have real video lessons that play an external URL inline,
that needs one column:

```sql
ALTER TABLE lessons ADD COLUMN video_url VARCHAR(2048) NULL AFTER video_asset_id;
```

…plus handling in `LessonRepository` and the player, which reads
`/api/media/{public_id}` today and would need to pass an external URL straight
through. That is a real change to how the player treats untrusted origins —
worth doing deliberately, not as part of a seed.

## Durations are zero

`duration_seconds` is `0` on every lesson because the real runtimes were not
published in a form worth trusting. The UI already hides a duration of zero
(`duration_seconds > 0`), so nothing displays a wrong number. Fill them in if
you scrape them later.
