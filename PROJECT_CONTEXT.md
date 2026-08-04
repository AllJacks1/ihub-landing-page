# iHub Landing Page — Project Context

## Overview
**iHub Davao** is a **coworking bistro hub** in Davao City — Davao's first coworking space that combines flexible work zones, a bistro, artisan coffee, and community events. This repo is the landing/marketing website plus a full admin backend for the venue.

## Tech Stack
- **Framework:** Next.js 16 (App Router) with React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 + shadcn/ui components
- **Backend/Database:** Supabase (PostgreSQL, Auth, SSR)
- **Rich Text Editing:** TipTap editor
- **Forms & Validation:** React Hook Form + Zod
- **Utilities:** date-fns, lucide-react, embla-carousel, recharts, sonner, next-themes
- **Feature Flags:** React Compiler enabled

## Key Features

### Public Site
- **Home** — hero ("Work. Eat. Drink. Play 24/7"), plus sections for bistro, food & drinks, events, coworking, offers, virtual tour, location, and CTA
- **Bistro** — food & drink showcase
- **Events** — venue events (halloween, speed match, confession, etc.)
- **Coworking Space** — plans and pricing
- **Booking** — reservation forms for bistro tables and conference rooms
- **Blogs** — blog system with categories, tags, and comments
- **Contact** — contact page
- **Menu** — linked to an external FlipHTML5 online menu

### Admin Panel (`/admin`)
- **Dashboard** — overview
- **Posts** — CRUD blog posts (TipTap editor, tags, categories, featured images, statuses: draft/published/archived)
- **Categories** — hierarchical categories with slugs
- **Tags** — tag management
- **Comments** — moderation (approve/reject/spam)
- **Reservations** — create/manage reservations (zones: bistro/study/room; statuses: pending/confirmed/seated/completed/cancelled/no_show)
- **Floor/Table Management** — tables & rooms, assign/unassign to reservations, track occupancy

## Core Data Model (Supabase)
- `posts`, `blog_categories`, `blog_tags`, `post_tags`
- `blog_comments` (with parent for replies)
- `profiles`, `auth` (Supabase Auth)
- `reservations`, `tables`, `rooms`
- `reservation_tables`, `reservation_rooms` (join tables)

## Branding
- **Primary color:** `#F36509` (orange)
- **Fonts:** Serif display headings
- **Logos:** `logo_black_horizontal.png`, `logo_white_horizontal.png`

## Getting Started
```bash
npm install
npm run dev
```
- Requires Supabase env vars: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Open `http://localhost:3000`

## Structure
```
src/
  app/          # Routes (page.tsx, admin/, blogs/, booking/, coworking/, etc.)
  components/
    sections/   # Site sections (Hero, Bistro, Events, etc.)
    ui/         # shadcn/ui components
    editor/     # TipTap editor
    pages/      # Coworking, Menu
  lib/actions.ts # Server actions (DB queries, auth, mutations)
  calendar/     # Booking calendar system
  hooks/        # Custom hooks
public/         # Images, logos, videos, events
