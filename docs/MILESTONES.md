# Cikgu Sehari — Milestones (v0.1)

> Today is Wed 18 Nov 2026. PESKON UPSI 2026 ends Wed 2 Dec; its start date ❓ is still to confirm.
> The plan below aims to be **ready by Thu 26 Nov**. If PESKON starts earlier, the dates move up and
> the **S** items wait.

Each milestone ends with a live link BSA can try on a phone.

| # | Milestone | Target | What BSA gets | BSA's part |
|---|---|---|---|---|
| M0 | **Plan sign-off** | Thu 19 Nov | Approved requirements, design and plan; Supabase and Netlify projects set up | Approve the docs; answer the open questions (PESKON dates, under-18 contact, accounts) |
| M1 | **Playable game** | Sat 21 Nov | Live link: welcome, role, level, nickname, 5 story scenes, Semak Kerja (sample questions), result and share card, BM/EN | Play it on a few phones and send feedback |
| M2 | **Full flow** | Tue 24 Nov | Sign-up with PDPA consent, offer screen and WhatsApp claim, tutor path, live TV leaderboard, admin sign-ups list with WhatsApp buttons, status and CSV export, 3 staff logins | Check the story and question texts (BM/EN); give the 3 staff emails |
| M3 | **Content and test** | Thu 26 Nov | Full question bank (~140 items, checked); test with 10+ people on different phones and fixes; printable QR poster (A4 and A3); one-page staff guide | Run the trial with students or tutors; print the QR poster |
| 🚀 | **Live at PESKON** | PESKON start → 2 Dec | Game running at the booth; I watch for problems and fix them during the event | Set up the TV with the leaderboard link; follow up sign-ups on WhatsApp |
| M4 | **After PESKON** | from 3 Dec | Results summary (players, sign-ups, tutor applications), data export, and a v2 plan (admin editing, stats, events, sound) | Share what worked and what didn't at the booth |

## Build order inside each milestone

1. **M1**: project setup (Vite, React, TypeScript, Tailwind, Netlify deploy) → design tokens and components
   (buttons, cards, Cik Mentol) → screens 1–7 with local data → share card.
2. **M2**: Supabase tables, security rules and server functions → connect the game (plays and scores on the
   server) → sign-up and offer → TV page with live updates → admin pages.
3. **M3**: question bank import → content checks → test on Android and iPhone (small screens, slow 4G) →
   fixes → QR poster and staff guide.

## Risks

| Risk | How we handle it |
|---|---|
| PESKON starts sooner than 26 Nov | Cut **S** items; M1 + M2 alone are enough to run at the booth |
| Question bank not checked in time | Launch with a smaller checked set (4 items per subject) and add more during the event |
| Weak mobile signal at the booth | Small, fast-loading app that only talks to the server when a play starts, when it ends and at sign-up; a dropped request retries instead of losing the play |
| Kids enter rude nicknames | Word filter, plus admin can hide a name from the TV |
| Too many people at once | Static site on a CDN and a light database; tested with 50 players at once in M3 |
