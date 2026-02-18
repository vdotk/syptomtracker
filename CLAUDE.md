# Autoimmune Symptom Tracker

## Purpose
A local-first web app for tracking autoimmune flare symptoms, timing,
and severity. All data stored in browser localStorage. No backend, no
accounts, no data leaving the device.

## Tech Stack
- React 18+ with TypeScript
- Tailwind CSS for styling
- Recharts for data visualization
- date-fns for date handling
- localStorage for all data persistence

## Design Guidelines
- Mobile-first (I'll use this on my phone at the doctor's office)
- Calm, medical-friendly color palette (soft blues, whites, light grays)
- Accessibility: good contrast, large tap targets, readable fonts
- Quick Log screen should require minimal taps for daily entry
- No animations that slow down data entry

## Data Model
Each flare log entry contains:
- id (uuid)
- createdAt (ISO timestamp)
- flareStartDate (ISO date)
- flareEndDate (ISO date, nullable for ongoing)
- symptoms: object with each symptom key containing:
  - active: boolean
  - severity: number (0-10) or enum (mild/moderate/severe)
  - notes: string (optional)
  - imageLinks: string[] (optional, up to 3 URLs — e.g., Google Photos links for skin symptoms)
- overallSeverity: number (1-10)
- notes: string
- tags: string[]

## Symptom Keys
backPain, fingerSkinPeeling, toeSkinPeeling, chills, fatigue,
jointStiffness, skinRash, fever, brainFog, eyeDryness, sleepDisruption

## Image Links
fingerSkinPeeling and toeSkinPeeling support up to 3 image links per
entry (e.g., Google Photos share links). Stored as URLs only — the app
does not download or cache images. Display as clickable labeled links.

## Project Rules
- All data in localStorage — never call external APIs
- Mobile-first responsive design
- Commit after each working feature
- Keep components small and focused
- Use TypeScript strict mode
- Every symptom toggle should be fast — one tap to activate

## Reference Implementation
SymptomTracker.jsx is the reference prototype. All UI patterns, styling,
color palette, component structure, and interaction patterns should match
this file. Do not redesign or restyle without explicit approval.
