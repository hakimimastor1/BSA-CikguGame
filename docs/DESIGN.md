# Cikgu Sehari — Design (v0.1)

> Status: **for sign-off**, together with [REQUIREMENTS.md](REQUIREMENTS.md).

## 1. Look and feel

**Style: playful "clay"**: chunky rounded cards, thick navy outlines, soft shadows, and big buttons that
squash when pressed. It feels like a toy or a game, but stays clean enough for parents and graduates.
This is what the ui-ux-pro-max skill recommends for educational games, recoloured to BSA's brand.

### Colours

| Token | Hex | Used for |
|---|---|---|
| `--bsa-yellow` | `#F9C414` | Brand highlight, XP, stars, main call-to-action buttons |
| `--bsa-navy` | `#023E86` | Text, outlines, secondary buttons |
| `--navy-deep` | `#012A5C` | TV screen background |
| `--cream` | `#FFF8E1` | Page background on phones |
| `--white` | `#FFFFFF` | Cards |
| `--sky` | `#DCEBFF` | Secondary surfaces, selected options |
| `--ink-muted` | `#4A5878` | Helper text |
| `--correct` | `#16804A` | Right answers |
| `--wrong` | `#C0362C` | Wrong answers |

All text pairs pass WCAG AA contrast (4.5:1). For example, navy on yellow is 6.3:1, navy on cream is
9.7:1, and white on navy is 10.3:1. Right and wrong are never shown by colour alone; they also get ✓ / ✗
icons.

### Type

- **Baloo 2** (bold, rounded) for headings, numbers, XP and buttons: playful, and reads well in BM.
- **Lato** for body text: the same family as the BSA wordmark.
- Body text at least 16px; buttons at least 48px tall.

### Brand assets

In `assets/brand/`: `bsa-mark.png` and `bsa-wordmark.png` (transparent, for light backgrounds),
`-on-navy` versions (white instead of navy, for the TV and dark cards), and the originals.

### Mascot

**"Cik Mentol"**, the bulb from the BSA logo with a friendly face, is the narrator. It speaks in short
speech bubbles, reacts to choices (happy, thinking, surprised), and lights up brighter as XP grows.

### Motion and sound

Short (150–250 ms) presses and slides, an XP counter that ticks up, and confetti on the result screen.
Everything is reduced or turned off when the phone asks for reduced motion. Sound effects come after
PESKON.

## 2. Screens

### Phone (visitor)

| # | Screen | What's on it |
|---|---|---|
| 1 | **Welcome** | BSA logo, Cik Mentol, headline *"Jadi Cikgu Sehari!"*, "PESKON UPSI 2026" tag, big **Mula / Start** button, BM/EN toggle (top right, on every screen) |
| 2 | **Saya…** | Three big cards: *Pelajar*, *Ibu bapa*, *Nak jadi cikgu* |
| 3 | **Level** | Std 1–3, Std 4–6, Form 1–3, Form 4–5. Future tutors also pick up to 3 subjects they'd teach |
| 4 | **Nickname** | Text box plus a "suggest" button with a dice icon (e.g. *Cikgu Ceria 27*). Rude words are blocked |
| 5 | **Story ×5** | Scene card (title, short situation, Cik Mentol), 3 choice buttons, then a reaction with XP gained and a one-line "Tip cikgu" |
| 6 | **Semak Kerja** | A pupil's exercise book: question and the pupil's answer, big ✓ and ✗ buttons, 45-second timer, streak counter, 8 items |
| 7 | **Result** | Personality card (name, picture, one-line description), XP and today's rank, *Strongest subject* and *Subjects to level up*, **Share** button, and the main button *"Tuntut trial percuma / Claim your free trial"* (tutors: *"Jom jadi cikgu BSA"*) |
| 8 | **Sign-up** | Fields for the role (see requirements R2–R4), 3 trial subjects pre-selected, PDPA consent |
| 9 | **Offer** | Code `PESKON UPSI 2026` (large, with copy button), "3 subjects free trial, valid until 2 Dec 2026", reference number (e.g. `PK-0123`), **Claim on WhatsApp** button. Tutors: pay range, **Apply now** (website `/register`) and a WhatsApp button |

The share card is a 1080×1920 image (story size) with the personality, XP, logo and *"Main di booth BSA,
PESKON UPSI 2026"*. It is shared with the phone's own share sheet, or downloaded if sharing isn't
supported.

### TV (booth)

Navy background. On the left: a large QR code and *"Imbas & main! / Scan & play!"*. On the right: **Today's
top 10** (nickname, personality, XP), with the top 3 highlighted in yellow. Along the bottom: a ticker of
the latest results (*"Cikgu Ceria 27 is a Cikgu Kreatif!"*) and the number of players today. Refreshes
every 5 seconds by itself.

### Admin (staff phone or laptop)

- **Login** (email and password).
- **Sign-ups**: a list with filters (role, level, subject, day, status). Each row: name, role, level,
  subjects, reference, time, status, and a **WhatsApp** button with a pre-filled message.
- **Export CSV** (admin only).
- **Leaderboard** view, the same as the TV, for checking top scorers.

## 3. The game

There are two games in one system (added 21 Nov 2026). **Game A, Cikgu Sehari**, is described below.
**Game B, Misi Pelajar Bijak**, is for school students (and families who pick it): five study-life situations
(`src/content/storyB.ts`) give a learner type (Visual, Pendengar, Aktif, Pemikir, Sosial), then *Kuiz Kilat*
uses the same question bank but the player answers for themselves, with one *Tanya Cikgu BSA* hint. A right
answer with the hint scores a flat 10 XP. Each play stores its `game`; the server checks that story choices
belong to that game, ranks within that game, and `leaderboard` returns `boards.cikgu` and `boards.pelajar`
for the projector's two top-5 boards.

### Story: *"Hari pertama di BSA"* (First day at BSA)

Five situations, the same for everyone. The intro changes with the role (students and parents: *"Imagine
you're the cikgu today…"*; future tutors: *"It's your first day as a BSA tutor…"*).

| # | Situation | Example choices (each leans to a personality) |
|---|---|---|
| 1 | **First online class.** Aiman's camera is off and he isn't answering. | Ask him a fun icebreaker by name (*Penyayang*) · Start a whiteboard drawing game (*Kreatif*) · Carry on and check in at the end |
| 2 | **"Cikgu, why do we need to learn this?"** | Show where it's used in real life (*Inspirasi*) · Turn it into a quick challenge (*Kreatif*) · Explain how it comes up in the exam (*Strategik*) |
| 3 | **A parent messages:** *"Why did my child's marks drop?"* | Share a short plan with weekly goals (*Strategik*) · Listen first and ask how the child feels (*Penyayang*) · Reply "Will try harder" |
| 4 | **Home visit, the pupil is tired and bored.** | Take a 2-minute brain break game (*Kreatif*) · Tell a story about someone who loved this subject (*Inspirasi*) · Push on to finish the chapter |
| 5 | **After class.** What do you do before the next lesson? | Send a short praise note to the pupil (*Penyayang*) · Plan the next lesson from today's mistakes (*Strategik*) · Find a cool video to open the next class (*Inspirasi*) |

Good choices give 30 XP, okay ones 10 XP. Each scene's reaction shows a one-line *Tip cikgu*, so even the
"okay" choice teaches something. Full BM and English text will be drafted in the build and checked by BSA.

### Personalities

The personality is the trait the player picked most (ties go to the order below). Cikgu Disiplin was added on
21 Nov with a firm choice in situations 1, 3, 4 and 5.

| Personality | One-liner |
|---|---|
| **Cikgu Kreatif** | Turns any lesson into a game. |
| **Cikgu Penyayang** | Every pupil feels seen and safe to ask. |
| **Cikgu Strategik** | Clear goals, clear plan, clear results. |
| **Cikgu Inspirasi** | Makes pupils curious about the world. |
| **Cikgu Disiplin** | *Garang sikit, tapi adil*: clear rules, homework always done. |

### Semak Kerja (mark the work)

- 8 items from the player's level: 2 each from 4 subjects. A pupil's answer is shown; the player taps ✓
  (correct) or ✗ (wrong). About half the pupil answers are wrong.
- Each right mark gives 20 XP, plus up to 10 XP for speed and a streak bonus. The timer is 45 seconds.
- **Subjects by level for PESKON:** Std 1–3, Std 4–6 and Form 1–3 use BM, BI, Matematik and Sains.
  Form 4–5 uses BI, Matematik, plus 2 of Fizik, Kimia and Biologi. Future tutors get items from the
  subjects they picked.
- Questions show in the chosen language (Matematik and Sains have BM and English versions; BM and BI items
  stay in their own language).
- *Strongest subject* = most right marks; *Subjects to level up* = subjects with mistakes. These pre-fill
  the 3 trial subjects on the sign-up form.
- **Question bank for PESKON:** about 8 items per subject per level, roughly 140 in all. I draft them
  from the KSSR/KSSM syllabus, and BSA tutors check them.

### Scoring and leaderboard

- Total XP is up to about 400 (150 from the story and up to 240 from Semak Kerja).
- The leaderboard is **per day** (today's top 10) and shows a nickname's best score.
- The phone only sends the player's answers and timings. The server works out the XP, so scores can't be
  inflated.

## 4. How it's built

### Parts

```
 Visitor phone ──► Web app (Netlify) ──► Supabase
 TV browser ─────►   /, /tv, /admin       ├─ Postgres database (+ row-level security)
 Staff phone ────►                        ├─ Auth (3 staff logins)
```

- **Web app**: React + TypeScript (Vite), Tailwind CSS. One site with three parts: the game (`/`, with the
  event in the QR link, e.g. `/?e=peskon26`), the TV screen (`/tv/peskon26`) and the admin pages (`/admin`).
  Static files on Netlify's CDN, so it loads fast on mobile data.
- **Supabase** (project `bsa-cikgu-game`): database, server functions and staff logins. Tables are in a
  private `cs` schema; the app only calls functions. The TV page asks for the leaderboard every 5 seconds.

### Data

| Table | Holds |
|---|---|
| `events` | Name, slug, dates, offer code and text (BM/EN), offer expiry, WhatsApp number |
| `questions` | Level band, subject, language, question, pupil's answer, whether it is correct |
| `plays` | Event, nickname, role, level, language, answers, XP, personality, subject results, time |
| `signups` | Play, event, reference no., role, name, WhatsApp, parent WhatsApp, school, level, subjects, tutor fields, consents, follow-up status, notes, time. One per WhatsApp number per event |
| `staff` | Staff login and role (admin or booth) |

### Security and privacy

- Visitors never log in and **can't read any personal data**. They can only start a play, submit answers
  and submit a sign-up, through server functions that check the input.
- The leaderboard only exposes nickname, personality and XP.
- Sign-ups are visible only to logged-in staff (row-level security). Only the admin can export.
- The round's answer keys are sent to the phone when the round starts, so right/wrong feedback is instant even
  on weak signal. The score is still worked out on the server from the answers and their timings, so someone
  reading the keys can't score more than a perfect, honest round. Taps under 250 ms score 0, and rounds finished
  in under 20 seconds are kept off the leaderboard.
- PDPA notice and consent on the sign-up form, with a link to the full notice.

### WhatsApp

Buttons open `https://wa.me/601175234588?text=…` with a pre-filled message, for example:

> Hi BSA! Saya nak tuntut **trial percuma 3 subjek** dengan kod **PESKON UPSI 2026**.
> Nama: Aisyah · Tahap: Form 2 · Subjek: Matematik, Sains, BI · Rujukan: PK-0123

In the admin page, the button opens a chat with the visitor's number instead, with a follow-up message.

## 5. Decisions for BSA to confirm

1. The "clay" look in BSA yellow and navy, with Baloo 2 and Lato fonts.
2. Cik Mentol (the logo bulb with a face) as the mascot.
3. The 5 situations and 4 personalities above (the full wording comes during the build).
4. Semak Kerja subjects per level, as listed above.
5. A per-day leaderboard, so every day of PESKON has fresh winners.
