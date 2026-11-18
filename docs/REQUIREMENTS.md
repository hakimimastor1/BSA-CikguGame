# Cikgu Sehari — Requirements (draft v0.2)

> Status: **draft for review**. Items marked ❓ need an answer from BSA (see section 11).

## 1. Goal

**Bright Scholar Academy (BSA)** ([brightscholaracademy.com.my](https://brightscholaracademy.com.my/),
*"Quality Tutoring, Made Affordable"*) gives **1-to-1 tuition, online or at home**, to primary and secondary
students across Malaysia. Many of its tutors are **UPSI students and graduates**.

At events BSA wants a **fun game that visitors play on their own phones** which:

1. makes people feel *"I could be a cikgu"* and recruits **tutors** for BSA, and
2. turns school students (and their parents) into **BSA students**,

while collecting contact details for follow-up on WhatsApp, giving out rewards, getting results
shared on social media, and building BSA's brand.

The core idea is **"Cikgu Sehari" (Teacher for a Day)**: a ~3-minute story game in which the visitor
plays a BSA tutor for one day, makes choices in teaching situations, marks a pupil's work against the
clock, and ends up with a *Cikgu personality* card, a score, and a reward.

**First event: PESKON UPSI 2026** ❓ (date, venue and expected crowd to confirm).

## 2. BSA facts the game uses

| | Primary (Std 1–6, KSSR) | Lower secondary (Form 1–3, KSSM) | Upper secondary (Form 4–5, SPM) |
|---|---|---|---|
| **Price (1-to-1, online)** | RM25/hour | RM35/hour | RM40/hour |
| **Subjects** | BM, BI, Matematik, Sains, Sejarah, Pendidikan Islam, Bahasa Arab, ASK, RBT | BM, BI, Matematik, Sains, Sejarah, Geografi, RBT, ASK | BM, BI, Sejarah, Pendidikan Islam, Matematik, Sains, Fizik, Kimia, Biologi, Matematik Tambahan, Prinsip Perakaunan, RBT, PQS, PSI |

- Home tuition: +RM20/hour for the tutor's travel.
- Normal free trial: 1 hour, online, 1 subject.
- **Event offer: code `PESKON UPSI 2026` = free trial for 3 subjects.**
- WhatsApp: **011-7523 4588** (`wa.me/601175234588`).
- Tutors: RM25–40/hour, paid weekly, flexible hours, online or home. UPSI students need semester 5+,
  CGPA 3.3+, and practicum done or in progress. Graduates need a degree (education preferred).
  Apply at `brightscholaracademy.com.my/register` or on WhatsApp.
- Brand colours (from the logo): **yellow `#F9C414`**, **navy `#023E86`**.

## 3. Who uses it

| User | Who they are | What they want | What BSA wants from them |
|---|---|---|---|
| **Pelajar** (school student) | Std 1 – Form 5 students, often visiting with family | Fun, a prize, beat their friends, something to share | Book the 3-subject free trial, then enrol |
| **Ibu bapa** (parent) | Parents of Std 1 – Form 5 students | Know if BSA suits their child; a good deal | Book the free trial for their child |
| **Bakal cikgu** (future tutor) | UPSI students (sem 5+), fresh graduates, job-seekers | See what tutoring at BSA is like and what it pays | Apply to become a BSA tutor |
| **Booth staff** (2) | BSA staff at the event | Run the booth smoothly, hand out gifts fairly | — |
| **Admin** (1) | BSA office | Manage events and offers, follow up sign-ups | — |

## 4. How the game serves each visitor

### 4.1 School students (pelajar)

Kids love being the teacher, so students play the same *Cikgu Sehari* story, but tuned to **their own level**:

- **The story** uses classroom moments a student recognises (a classmate who is shy to ask, a noisy
  class, a test tomorrow). The student decides what a good cikgu would do, so they experience
  *"what good teaching feels like"*, which is what BSA sells.
- **The "Semak Kerja" mini-challenge**: as the cikgu, they mark a pupil's answers (✓ or ✗) against the
  clock. The questions are **real questions from their own level** (e.g. Form 2 Matematik, Std 5 Sains).
  Without noticing, they are testing their own knowledge.
- **The result** shows their *Cikgu personality*, their XP and rank, and **"Your strongest subject"
  and "Subjects to level up"**, based on the questions they got wrong.
- **The reward** suggests **3 free trial subjects** (pre-selected from "subjects to level up",
  changeable), with the code `PESKON UPSI 2026` and a button to book on WhatsApp.
- **Competition**: their nickname on the TV leaderboard; they challenge friends and siblings to beat it.
- **Sharing**: a result card made for Instagram/TikTok stories.
- **Safety**: under-18 players give a **parent or guardian's** WhatsApp number, and the trial is booked with
  the parent ❓.

### 4.2 Parents (ibu bapa)

Parents pick their child's level and play the same game. The Semak Kerja questions come from the child's
level (*"Can you still do Std 4 maths?"*). The result shows which subjects to try, and the reward books the
3-subject trial for the child.

### 4.3 Future tutors (bakal cikgu)

They pick the level and subjects they would teach. The story shows a day as a BSA tutor (first online
class, a home visit, a parent's question). The result shows *"You'd earn RM25–40/hour teaching
Form 4 Fizik"* and a **tutor application**: name, WhatsApp, UPSI or graduate, semester and CGPA,
subjects, area. Staff follow up, and the applicant is pointed to the website's `/register` page.

## 5. Visitor journey

1. **Scan QR**. Each event has its own QR code, so every play and sign-up is tagged with the event.
2. **Choose a language**: Bahasa Melayu or English (can switch at any time).
3. **"Saya…"**: *pelajar*, *ibu bapa* or *nak jadi cikgu*, then level (and subjects for future tutors).
4. **Pick a nickname** for the leaderboard (filtered for rude words, since it shows on the TV).
5. **Play Cikgu Sehari** (~3 minutes): story situations with choices, plus the Semak Kerja mini-challenge.
6. **Result**: Cikgu personality, XP, leaderboard rank, subject strengths, and a shareable card.
7. **Sign up** to unlock the reward (fields depend on the role), with PDPA consent.
8. **Reward screen**: offer code, personal reference number, WhatsApp button, and instant gift ❓.

## 6. Functional requirements

Priority: **M** = must have for the first event, **S** = should have, **C** = could have later.

### 6.1 Game (visitor web app)

| # | Requirement | Pri |
|---|---|---|
| G1 | Opens from an event QR code in the phone browser; no install, no login | M |
| G2 | BM / English toggle on every screen; all text available in both languages | M |
| G3 | Role picker (pelajar / ibu bapa / bakal cikgu), level picker, subject picker for future tutors | M |
| G4 | Cikgu Sehari story: about 6 situations, playable in ~3 minutes, text adapted to the role | M |
| G5 | Semak Kerja mini-challenge: timed marking of questions from the chosen level | M |
| G6 | Question bank per level and subject (BM and English), checked by BSA tutors ❓ | M |
| G7 | Scoring (Cikgu XP), Cikgu personality, and subject strengths from the player's answers | M |
| G8 | Result card image to save or share, with the BSA logo, colours and event name | M |
| G9 | Sound effects and simple animations, with a mute button | S |
| G10 | Play again (best score counts on the leaderboard) | C |

### 6.2 Sign-up and rewards

| # | Requirement | Pri |
|---|---|---|
| R1 | Sign-up after the result, to unlock the reward | M |
| R2 | Pelajar: name, level, school, parent/guardian WhatsApp if under 18 ❓, 3 trial subjects | M |
| R3 | Ibu bapa: name, WhatsApp, child's level, 3 trial subjects, area (for home tuition) | M |
| R4 | Bakal cikgu: name, WhatsApp, UPSI student or graduate, semester and CGPA (UPSI), subjects, area, availability | M |
| R5 | PDPA consent checkbox (required) and separate marketing consent (optional) | M |
| R6 | Reward shows the event offer code (`PESKON UPSI 2026`, 3-subject free trial) and a personal reference number | M |
| R7 | "Claim on WhatsApp" button opening a chat to 011-7523 4588 with a pre-filled message (name, level, subjects, code, reference) | M |
| R8 | Instant gift: staff confirm on the visitor's screen with a staff PIN; each gift can be claimed only once ❓ | M |
| R9 | One reward per WhatsApp number per event | M |
| R10 | Future tutors get a link to `brightscholaracademy.com.my/register` | M |
| R11 | Fee discount code with expiry and conditions ❓ (only if BSA wants one besides the trial) | C |
| R12 | Visitor can reopen their reward later through a personal link | S |

### 6.3 Big screen (TV)

| # | Requirement | Pri |
|---|---|---|
| T1 | Leaderboard for the event, updating live: top 10 nicknames, XP and personality | M |
| T2 | QR code and "Scan to play" call to action always visible | M |
| T3 | Live counts: players today, personality mix | S |
| T4 | Animation when someone enters the top 10 | S |

### 6.4 Admin page (BSA staff)

| # | Requirement | Pri |
|---|---|---|
| A1 | Staff login: **1 admin** (everything) and **2 booth staff** (redeem gifts, see today's event) | M |
| A2 | Events: create an event (name, date, venue, offer code) and download its QR code and TV link | M |
| A3 | Sign-ups list, filterable by event, role, level, subject and follow-up status | M |
| A4 | One-tap **WhatsApp** button per sign-up, opening a chat with a pre-filled message | M |
| A5 | Follow-up status: new / contacted / trial booked / enrolled / not interested (tutors: new / contacted / interviewed / hired / not suitable) | M |
| A6 | Edit offers without coding: offer code, trial text, conditions, expiry | M |
| A7 | Gift stock per event; stop offering gifts when stock runs out | S |
| A8 | Edit result texts and WhatsApp message templates (BM and English) | S |
| A9 | Event stats: plays, sign-ups, sign-up rate, gifts claimed, by role and level | S |
| A10 | Edit story situations and the question bank | C |
| A11 | Export sign-ups to Excel/CSV | C |

## 7. Quality requirements

- **Mobile first**: works well on mid-range Android phones and iPhones; first screen loads in under
  3 seconds on 4G.
- **Fun and on-brand**: BSA yellow and navy, logo, playful and friendly for kids and adults.
- **Easy to read**: large text and buttons, good contrast, works one-handed.
- **Privacy (PDPA 2010)**: clear consent; collect only what follow-up needs; phone numbers never shown
  on the TV or to other visitors; admin data behind login; delete old sign-ups after a set period ❓.
- **Fair rewards**: one reward per WhatsApp number per event; gifts can't be claimed twice.
- **Busy booths**: handles at least 50 people playing at the same time per event.

## 8. Not in the first version

- Live stage quiz, event stamp hunt, booth tablet kiosk mode, lucky draw
- Chinese and Tamil languages
- Automatic WhatsApp messages (v1 opens WhatsApp for staff to send)
- Linking to BSA's existing website login or booking system
- Online payment or enrolment in the app

## 9. How we'll measure success

Per event (targets to agree with BSA ❓):

- Players, and % of players who sign up
- 3-subject trials claimed on WhatsApp, and enrolments after the event
- Tutor applications, and tutors hired
- Result cards shared

## 10. Proposed technology (to confirm in the design step)

- **Web app** that runs in the phone browser (no install), hosted on **Netlify**.
- **Supabase** for the database, staff logins and the live leaderboard.

Both services are already connected to this workspace.

## 11. Open questions for BSA

Answered so far: BSA details, logo and colours, offer code and trial, WhatsApp number, staff accounts.

1. **PESKON UPSI 2026**: what is it (Pesta Konvokesyen?), the date, the venue, and who comes (UPSI
   graduates, families, school groups)? Roughly how many visitors?
2. **Offer code**: valid until when? Is it the same code for everyone, or should each event have its own?
3. **Fee discount**: is there one besides the 3-subject trial, or is the trial the only offer?
4. **Instant gift**: what is it, rough stock, and does everyone who signs up get one (or only top scorers)?
5. **Under-18 players**: OK to ask for a parent/guardian's WhatsApp instead of the child's?
6. **Question bank**: can BSA tutors supply or check the Semak Kerja questions (about 10 per subject per level
   to start), or should I draft them for BSA to check?
7. **Logo**: a version with a transparent background (PNG or SVG), and the "Bright Scholar Academy" wordmark
   if there is one.
8. **Data**: how long should sign-up data be kept? Do you already have a PDPA notice we should use?
9. **Trial run**: a small test (e.g. with a few students or tutors) before PESKON.
