# Cikgu Sehari — Requirements (draft v0.1)

> Status: **draft for review**. Items marked ❓ need an answer from BSA (see section 10).

## 1. Goal

BSA is a tuition centre. At events (education fairs, school visits, roadshows, open days) BSA wants a
**fun game that visitors play on their own phones** which:

1. makes people feel *"I could be a cikgu"* and recruits **tutors** for BSA, and
2. turns students (and their parents) into **BSA students**,

while collecting contact details for follow-up on WhatsApp, giving out rewards, getting results
shared on social media, and building BSA's brand.

The core idea is **"Cikgu Sehari" (Teacher for a Day)**: a ~3-minute story game in which the visitor
plays a teacher for one day at BSA, makes choices in classroom situations, and ends up with a
*Cikgu personality* card, a score, and a reward.

## 2. Who uses it

| User | Who they are | What they want | What BSA wants from them |
|---|---|---|---|
| **Pelajar** (student) | Primary (Std 1–6) and secondary (Form 1–5) students | Fun, a prize, something to share | Enrol in a BSA class (trial class first) |
| **Ibu bapa** (parent) | Parents of primary/secondary students | Know if BSA suits their child; a good deal | Book a trial class / enrol their child |
| **Bakal cikgu** (future tutor) | Graduates, job-seekers, career-switchers | See what tutoring at BSA is like | Apply to become a BSA tutor |
| **Booth staff** | BSA staff at the event | Run the booth smoothly, hand out gifts fairly | — |
| **Admin / marketing** | BSA office team | Manage events and offers, follow up sign-ups | — |

## 3. Event setup

- Visitors scan a **QR code** (on a banner, bunting or table stand) and play on **their own phone**.
  No app install.
- A **TV or projector** at the booth shows the live leaderboard and the latest results.
- Booth staff use **their own phone** to confirm instant gifts.
- Visitors use their own mobile data; the booth does not need wifi for visitors.

## 4. Visitor journey

1. **Scan QR**. Each event has its own QR code, so every play and sign-up is tagged with the event.
2. **Choose a language**: Bahasa Melayu or English (can switch at any time).
3. **"Saya…"**: choose *pelajar*, *ibu bapa* or *nak jadi cikgu*.
   - Pelajar: pick their level (Std 1–6 / Form 1–3 / Form 4–5).
   - Ibu bapa: pick their child's level.
4. **Pick a nickname** for the leaderboard (shown on the TV, so it is filtered for rude words).
5. **Play Cikgu Sehari** (~3 minutes): a short series of classroom situations, each with a few choices,
   plus one or two quick timed mini-challenges. Choices shape the *Cikgu personality*; good choices and
   speed earn **Cikgu XP** (the score).
6. **Result**: the visitor's *Cikgu personality* (e.g. *Cikgu Kreatif*, *Cikgu Penyayang*), their XP and
   leaderboard rank, and a **shareable result card** (save image / share to WhatsApp, Instagram, TikTok).
7. **Unlock the reward**: a short sign-up form (fields depend on the role, see 5.2) with PDPA consent.
8. **Reward screen**, depending on the role:
   - Pelajar / ibu bapa: **free trial class** voucher, **fee discount** code, and **instant gift** at the booth.
   - Bakal cikgu: **"Jom jadi cikgu BSA"**: tutor application fast-track, and the instant gift.
9. Their nickname and score appear on the **TV leaderboard**.

## 5. Functional requirements

Priority: **M** = must have for the first event, **S** = should have, **C** = could have later.

### 5.1 Game (visitor web app)

| # | Requirement | Pri |
|---|---|---|
| G1 | Opens from an event QR code in the phone browser; no install, no login | M |
| G2 | BM / English toggle on every screen; all text available in both languages | M |
| G3 | Role picker (pelajar / ibu bapa / bakal cikgu) and level picker | M |
| G4 | Cikgu Sehari story: about 6–8 situations, playable in ~3 minutes | M |
| G5 | At least one timed mini-challenge that affects the score | M |
| G6 | Scoring (Cikgu XP) and personality result from the player's choices | M |
| G7 | Result card image the visitor can save or share, with BSA branding and the event name | M |
| G8 | Story text adapts slightly to the role (e.g. a student sees "your cikgu" moments, a future tutor sees "your first class") | S |
| G9 | Sound effects and simple animations, with a mute button | S |
| G10 | Play again (best score counts on the leaderboard) | C |

### 5.2 Sign-up and rewards

| # | Requirement | Pri |
|---|---|---|
| R1 | Sign-up after the result, to unlock the reward | M |
| R2 | Fields for pelajar: name, level, school, WhatsApp number of a parent/guardian if under 18 ❓ | M |
| R3 | Fields for ibu bapa: name, WhatsApp number, child's level, subjects of interest | M |
| R4 | Fields for bakal cikgu: name, WhatsApp number, highest qualification, subjects they can teach, area, availability ❓ | M |
| R5 | PDPA consent checkbox (required) and separate marketing consent (optional) | M |
| R6 | Free trial class voucher with a unique code and QR | M |
| R7 | Fee discount code with an expiry date and conditions set by admin | M |
| R8 | Instant gift: staff confirm on the visitor's screen with a staff PIN; each gift can be claimed only once | M |
| R9 | One reward per WhatsApp number per event | M |
| R10 | Reward screen has a "WhatsApp BSA" button to book the trial class | S |
| R11 | Visitor can reopen their reward later through a personal link | S |

### 5.3 Big screen (TV)

| # | Requirement | Pri |
|---|---|---|
| T1 | Leaderboard for the event, updating live: top 10 nicknames, XP and personality | M |
| T2 | QR code and "Scan to play" call to action always visible | M |
| T3 | Live counts: players today, personality mix | S |
| T4 | Animation when someone enters the top 10 | S |

### 5.4 Admin page (BSA staff)

| # | Requirement | Pri |
|---|---|---|
| A1 | Staff login; two roles: **admin** (everything) and **booth staff** (redeem gifts, see today's event) | M |
| A2 | Events: create an event (name, date, venue) and download its QR code and TV link | M |
| A3 | Sign-ups list, filterable by event, role, level and follow-up status | M |
| A4 | One-tap **WhatsApp** button per sign-up, opening a chat with a pre-filled message | M |
| A5 | Follow-up status per sign-up: new / contacted / trial booked / enrolled / not interested | M |
| A6 | Edit offers without coding: trial class text, discount amount, expiry, conditions | M |
| A7 | Gift stock per event; stop offering gifts when stock runs out | S |
| A8 | Edit result personality texts and the WhatsApp message templates (BM and English) | S |
| A9 | Event stats: plays, sign-ups, sign-up rate, gifts claimed, by role and level | S |
| A10 | Edit the story situations and choices | C |
| A11 | Export sign-ups to Excel/CSV | C |

## 6. Quality requirements

- **Mobile first**: works well on mid-range Android phones and iPhones; first screen loads in under
  3 seconds on 4G.
- **Fun and on-brand**: BSA logo and colours; playful, friendly look suitable for kids and adults.
- **Easy to read**: large text and buttons, good contrast, works one-handed.
- **Privacy (PDPA 2010)**: clear consent; collect only what follow-up needs; phone numbers never shown
  on the TV or to other visitors; admin data behind login; delete old sign-ups after a set period ❓.
- **Children**: under-18 players give a parent or guardian's contact, not their own ❓.
- **Fair rewards**: one reward per WhatsApp number per event; gifts can't be claimed twice.
- **Busy booths**: handles at least 50 people playing at the same time per event.

## 7. Not in the first version

These are good ideas for later, not part of v1:

- Live stage quiz with a host, event stamp hunt, booth tablet kiosk mode
- Chinese and Tamil languages
- Automatic WhatsApp messages (v1 opens WhatsApp for staff to send)
- Online payment or full enrolment in the app
- Lucky draw

## 8. How we'll measure success

Per event (targets to agree with BSA ❓):

- Number of players, and % of players who sign up
- Trial classes booked, and enrolments after the event
- Tutor applications
- Result cards shared

## 9. Proposed technology (to confirm in the design step)

- **Web app** that runs in the phone browser (no install), hosted on **Netlify**.
- **Supabase** for the database, staff logins and the live leaderboard.

Both services are already connected to this workspace.

## 10. Open questions for BSA

1. BSA's full name, a one-line description, and branch locations (where do trial classes happen?).
2. Logo files (SVG or high-resolution PNG) and brand colour codes.
3. Subjects offered for each level (Primary, Form 1–3, SPM).
4. Free trial class: how many classes, how long the voucher is valid, how it is booked.
5. Fee discount: amount, expiry, conditions (e.g. new students only).
6. Instant gift: what it is, rough stock per event, and whether everyone who signs up gets one.
7. WhatsApp number(s) for follow-up; one per branch?
8. Tutor applicants: what you need to know about them (qualifications, subjects, area, availability).
9. Under-18 players: OK to ask for a parent/guardian's WhatsApp instead of the child's?
10. How long should sign-up data be kept? Do you already have a PDPA notice we should use?
11. Roughly how many visitors per event, and how many events per year?
12. How many admin and booth staff accounts are needed?
13. A small trial event (or a class at BSA) where we can test the game before the big launch.
