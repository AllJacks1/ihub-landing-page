# iHub Landing Page — Design Patterns & Architecture

## 1. App Router + File-Based Routing (Next.js)
The project uses the **Next.js App Router** with a clear folder-per-route structure:
```
src/app/
  page.tsx          # Homepage (composes sections)
  layout.tsx        # Root layout (fonts, Navbar, Footer, Toaster)
  admin/layout.tsx  # Admin layout (header + sidebar + children)
  booking/page.tsx  # Booking page
  blogs/[slug]/     # Dynamic route (blog post detail)
  blogs/categories/[slug]/  # Nested dynamic route
```
- **Dynamic routes** use `[slug]` bracket syntax.
- **Layouts** wrap nested routes for shared chrome (Navbar/Footer for public, Admin header/sidebar for admin).

## 2. Composition over Inheritance — Section-Based Pages
The homepage is a **composition of section components** rather than a single monolithic file:
```tsx
export default function Home() {
  return (
    <div>
      <Hero /><WhySection /><ILoungeSection /><VirtualTourSection />
      <OffersSection /><FoodDrinksSection /><EventsSection />
      <LocationSection /><CTASection />
    </div>
  );
}
```
Each marketing section lives in `src/components/sections/` as a self-contained presentational component.

## 3. Server Components + Client Components Boundary
- **Server Components** (default in App Router) fetch data directly from Supabase using `createServerClient`. e.g. `getPosts()`, `getCategories()`, `getReservations()`.
- **Client Components** are gated with `"use client"` for interactivity — forms, modals, state, hooks, and `usePathname`/`useSearchParams`.
- **LayoutWrapper** demonstrates the pattern: a client component that reads `usePathname()` to conditionally hide the Navbar/Footer on `/admin` routes.

## 4. Server Actions Pattern (`src/lib/actions.ts`)
All server-side mutations are centralized in `src/lib/actions.ts` using the **Server Action** pattern:
- `"use server"` directive at top.
- Two Supabase client factories:
  - `createSupabaseClientForRead()` — read-only, no cookie writes (for Server Components).
  - `createSupabaseClient()` — full client for mutations (writes cookies).
- Each action returns a consistent shape: `{ success: boolean; data?: T; error?: string }`.
- **Zod validation** on inputs (e.g., `createPostSchema`, `createCategorySchema`, `reservationSchema`).
- **Auth checks** via `supabase.auth.getUser()` before mutations.
- **`revalidatePath()`** after writes to refresh cached routes.

## 5. Form Handling Patterns (Two approaches)
Two distinct form patterns coexist:
1. **React Hook Form + ZodResolver** (`ReservationForm.tsx`) — modern typed forms with `useForm`, `zodResolver`, `form.register`, `form.setError`, and `Field`/`FieldLabel`/`FieldError` UI primitives.
2. **Controlled `useState` + Server Action** (`booking/page.tsx`) — simpler approach using `useState` for form data, then calling a server action (`submitBooking`) directly on submit.

## 6. Custom Hooks + Context Provider
- **Context Pattern** (`calendar/contexts/calendar-context.tsx`): a `CalendarProvider` exposes shared state via `useContext`, with a `useCalendar()` hook that throws if used outside the provider.
- **Custom hooks** (`use-disclosure.ts`, `use-mobile.ts`, `horizontal-scroll.tsx`) encapsulate reusable client logic.

## 7. Reusable UI Primitives (shadcn/ui)
The `src/components/ui/` folder contains ~60 **headless + styled primitives** (button, card, dialog, select, tabs, dropdown-menu, etc.). Components are built with `class-variance-authority`, `clsx`, and `tailwind-merge` for variant management via the `cn()` utility.

## 8. Component Data Modeling — Typed Configuration
The `AdminSidebar.tsx` uses a **data-driven config pattern**:
```tsx
type SidebarItem = { id; label; icon; href; badge? };
type SidebarGroup = { id; label; items: SidebarItem[] };
const sidebarGroups: SidebarGroup[] = [ ... ];
```
Menu items are declared as typed data and rendered via a reusable `SidebarLink` component — easy to extend and maintain.

## 9. Feature-Slice / Module Organization (`src/calendar/`)
The calendar feature is organized as a **self-contained module** with a clear separation of concerns:
```
calendar/
  types.ts / interfaces.ts   # Type definitions
  schemas.ts                 # Zod schemas
  requests.ts / helpers.ts   # Data fetching + utilities
  mocks.ts                   # Mock data
  contexts/                  # Context provider
  hooks/                     # Custom hooks
  components/                # Views (month, week, day, year, agenda) + dnd + dialogs
```

## 10. Routing & Navigation Conventions
- `useSearchParams()` for **query string state** (e.g., `?type=bistro` on booking page).
- `usePathname()` for active-link detection in nav/sidebar.
- `Link` from `next/link` for internal navigation; external links use `target="_blank"`.

## 11. Styling & Branding Pattern
- **Tailwind CSS v4** with the `cn()` utility (`clsx` + `tailwind-merge`).
- Brand accent color **`#F36509`** inlined repeatedly across components.
- Typography: `font-serif` for display headings, `font-sans` (Inter) for body.
- Consistent rounded-full buttons, `bg-[#F36509]/10` icon chips, `text-stone-*` grays.

## 12. Error Handling & UX Feedback
- Server actions return `{ success, error }` and components surface errors via **`sonner` toasts**.
- Forms use `FieldError` for field-level validation messages.
- Loading/submitting states via `isSubmitting` / `form.formState.isSubmitting`.

---

## Summary of Key Patterns
| Pattern | Where Used |
|---------|-----------|
| App Router + File routing | `src/app/*` |
| Section composition | `src/app/page.tsx` |
| Server/Client component split | `"use client"` + Supabase server fetches |
| Centralized Server Actions + Zod | `src/lib/actions.ts` |
| React Hook Form + Zod schema | `ReservationForm.tsx` |
| Context + custom hook | `calendar-context.tsx` |
| Data-driven config rendering | `AdminSidebar.tsx` |
| Reusable UI primitives (shadcn) | `src/components/ui/*` |
| Feature-slice modules | `src/calendar/*` |
| Toast-based feedback | `sonner` |
