            -- Migration: Add cubicles as a QR session location type + seed initial locations
            -- Created: 2026-10-09 (secure deployment revision)
            --
            -- Why: The QR session flow supports Table and Room locations. Cubicles need a
            -- persistent representation. The existing `tables`/`rooms` schemas cannot store
            -- them without overloading `table_number`/`zone`, so the smallest safe change is
            -- a dedicated `cubicles` table modeled on `rooms`, plus a nullable `cubicle_id`
            -- on `pos_sessions` that keeps the "exactly one location per session" rule.
            --
            -- Security model (revised):
            --   * `pos_sessions` stays locked down: NO public SELECT (customers must not
            --     list sessions or read other customers' QR tokens) and NO blanket
            --     management grant for authenticated users (the project has no reliable
            --     staff-role signal — see "Staff authorization" notes at the bottom).
            --   * Customers validate a QR token through the SECURITY DEFINER function
            --     `validate_pos_session()`, which returns only {found, valid, expired,
            --     location label} for the supplied token — never the token itself, the
            --     session id, or any other row.
            --   * Staff manage locations and sessions through the Next.js server actions
            --     in src/lib/pos-actions.ts, which enforce auth.getUser() on the server
            --     and use the service-role key when configured (see notes at the bottom).
            --   * `tables`/`rooms`/`cubicles` keep public read (location names are
            --     non-sensitive and already public for `tables`/`rooms`). No unrelated
            --     policy is dropped, weakened, or replaced.

            -- 1. Cubicles table (modeled on public.rooms)
            CREATE TABLE IF NOT EXISTS public.cubicles (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name TEXT NOT NULL UNIQUE,
                seats INTEGER NOT NULL DEFAULT 1,
                description TEXT NULL,
                is_active BOOLEAN NOT NULL DEFAULT true,
                created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
            );

            COMMENT ON TABLE public.cubicles IS 'Cubicle locations available for QR ordering sessions (e.g. iStudy cubicles).';
            COMMENT ON COLUMN public.cubicles.name IS 'Display name, e.g. Cubicle 1';
            COMMENT ON COLUMN public.cubicles.seats IS 'Number of seats in the cubicle';
            COMMENT ON COLUMN public.cubicles.is_active IS 'Soft-delete flag; inactive cubicles cannot receive new QR sessions';

            -- Row Level Security: public read only (customer menu validation, terminal
            -- dropdowns). No write/management policy is granted here — management is
            -- performed by server actions, not by direct API access.
            ALTER TABLE public.cubicles ENABLE ROW LEVEL SECURITY;

            DROP POLICY IF EXISTS cubicles_public_read ON public.cubicles;
            CREATE POLICY cubicles_public_read ON public.cubicles
                FOR SELECT TO public USING (true);

            -- Remove the blanket management grant from the earlier draft of this
            -- migration (in case that draft was ever applied). It is intentionally
            -- NOT re-created: there is no reliable staff-role signal to gate it on.
            DROP POLICY IF EXISTS cubicles_staff_manage ON public.cubicles;

            -- 2. Link cubicles to pos_sessions (keeps each session tied to exactly one location)
            ALTER TABLE public.pos_sessions ADD COLUMN IF NOT EXISTS cubicle_id UUID NULL
                REFERENCES public.cubicles(id) ON DELETE SET NULL;

            ALTER TABLE public.pos_sessions DROP CONSTRAINT IF EXISTS pos_sessions_one_location;
            ALTER TABLE public.pos_sessions ADD CONSTRAINT pos_sessions_one_location CHECK (
                (table_id IS NOT NULL AND room_id IS NULL AND cubicle_id IS NULL)
                OR (table_id IS NULL AND room_id IS NOT NULL AND cubicle_id IS NULL)
                OR (table_id IS NULL AND room_id IS NULL AND cubicle_id IS NOT NULL)
            );

            CREATE INDEX IF NOT EXISTS idx_pos_sessions_cubicle_id ON public.pos_sessions(cubicle_id);

            -- 3. pos_sessions stays locked down.
            --    - Remove public read: customers must not be able to list session rows
            --      or retrieve other customers' QR tokens.
            --    - Remove the blanket authenticated-management grant from the earlier
            --      draft (in case that draft was ever applied). It is intentionally
            --      NOT re-created (see "Staff authorization" notes below).
            --    Existing table/room sessions are preserved: the constraint above
            --      accepts every row allowed by the previous table-XOR-room constraint.
            ALTER TABLE public.pos_sessions ENABLE ROW LEVEL SECURITY;

            DROP POLICY IF EXISTS pos_sessions_public_read ON public.pos_sessions;
            DROP POLICY IF EXISTS pos_sessions_staff_manage ON public.pos_sessions;

            -- 4. Customer-facing QR token validation.
            --    SECURITY DEFINER: runs as the migration owner (which bypasses RLS),
            --    so the function can read pos_sessions while the table itself stays
            --    locked down. Returns ONLY the validation result and the session's
            --    location label for the supplied token — never qr_token, the session
            --    id, or data about any other row. Token, active status, expiry, and
            --    the associated location are all evaluated here, server-side.
            CREATE OR REPLACE FUNCTION public.validate_pos_session(p_qr_token text)
            RETURNS json
            LANGUAGE plpgsql
            STABLE
            SECURITY DEFINER
            SET search_path = pg_catalog, public
            AS $$
            DECLARE
            v_result json;
            BEGIN
            SELECT json_build_object(
                'found', true,
                'valid', s.is_active AND (s.expires_at > now()),
                'expired', s.expires_at <= now(),
                'table_number', CASE WHEN s.table_id IS NOT NULL THEN t.table_number END,
                'room_name', CASE WHEN s.room_id IS NOT NULL THEN r.name END,
                'cubicle_name', CASE WHEN s.cubicle_id IS NOT NULL THEN c.name END
                ) INTO v_result
            FROM public.pos_sessions s
            LEFT JOIN public.tables t ON t.id = s.table_id
            LEFT JOIN public.rooms r ON r.id = s.room_id
            LEFT JOIN public.cubicles c ON c.id = s.cubicle_id
            WHERE s.qr_token = p_qr_token;

            IF v_result IS NULL THEN
                v_result := json_build_object(
                'found', false,
                'valid', false,
                'expired', false,
                'table_number', NULL,
                'room_name', NULL,
                'cubicle_name', NULL
                );
            END IF;

            RETURN v_result;
            END;
            $$;

            REVOKE ALL ON FUNCTION public.validate_pos_session FROM PUBLIC;
            GRANT EXECUTE ON FUNCTION public.validate_pos_session TO anon, authenticated;

            -- 5. updated_at triggers (function from the pos_sessions migration, applied
            --    here so the new table and pos_sessions keep updated_at accurate)
            CREATE OR REPLACE FUNCTION public.handle_updated_at()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = now();
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            DROP TRIGGER IF EXISTS set_cubicles_updated_at ON public.cubicles;
            CREATE TRIGGER set_cubicles_updated_at
                BEFORE UPDATE ON public.cubicles
                FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

            DROP TRIGGER IF EXISTS set_pos_sessions_updated_at ON public.pos_sessions;
            CREATE TRIGGER set_pos_sessions_updated_at
                BEFORE UPDATE ON public.pos_sessions
                FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

            -- 6. Seed the expected initial locations (idempotent — never duplicates or
            --    overwrites existing rows). Table numbers are stored bare (e.g. "1") so
            --    the UI renders "Table 1".
            INSERT INTO public.tables (table_number, seats, zone, is_active)
            SELECT '1', 4, 'bistro', true
            WHERE NOT EXISTS (SELECT 1 FROM public.tables WHERE table_number = '1' AND zone = 'bistro');

            INSERT INTO public.tables (table_number, seats, zone, is_active)
            SELECT '2', 4, 'bistro', true
            WHERE NOT EXISTS (SELECT 1 FROM public.tables WHERE table_number = '2' AND zone = 'bistro');

            INSERT INTO public.tables (table_number, seats, zone, is_active)
            SELECT '3', 4, 'bistro', true
            WHERE NOT EXISTS (SELECT 1 FROM public.tables WHERE table_number = '3' AND zone = 'bistro');

            INSERT INTO public.tables (table_number, seats, zone, is_active)
            SELECT '4', 4, 'bistro', true
            WHERE NOT EXISTS (SELECT 1 FROM public.tables WHERE table_number = '4' AND zone = 'bistro');

            INSERT INTO public.rooms (name, seats, description, is_active)
            SELECT 'Confe A', 4, NULL, true
            WHERE NOT EXISTS (SELECT 1 FROM public.rooms WHERE name = 'Confe A');

            INSERT INTO public.rooms (name, seats, description, is_active)
            SELECT 'Confe B', 6, NULL, true
            WHERE NOT EXISTS (SELECT 1 FROM public.rooms WHERE name = 'Confe B');

            INSERT INTO public.rooms (name, seats, description, is_active)
            SELECT 'Confe C', 8, NULL, true
            WHERE NOT EXISTS (SELECT 1 FROM public.rooms WHERE name = 'Confe C');

            INSERT INTO public.cubicles (name, seats, description, is_active)
            SELECT 'Cubicle 1', 1, NULL, true
            WHERE NOT EXISTS (SELECT 1 FROM public.cubicles WHERE name = 'Cubicle 1');

            INSERT INTO public.cubicles (name, seats, description, is_active)
            SELECT 'Cubicle 2', 1, NULL, true
            WHERE NOT EXISTS (SELECT 1 FROM public.cubicles WHERE name = 'Cubicle 2');

            INSERT INTO public.cubicles (name, seats, description, is_active)
            SELECT 'Cubicle 3', 1, NULL, true
            WHERE NOT EXISTS (SELECT 1 FROM public.cubicles WHERE name = 'Cubicle 3');

            INSERT INTO public.cubicles (name, seats, description, is_active)
            SELECT 'Cubicle 4', 1, NULL, true
            WHERE NOT EXISTS (SELECT 1 FROM public.cubicles WHERE name = 'Cubicle 4');

            -- ---------------------------------------------------------------------------
            -- Staff authorization — what exists and what is missing
            -- ---------------------------------------------------------------------------
            -- The app's existing staff mechanism is Supabase Auth: staff sign in with
            -- email/password via loginUser() (src/lib/actions.ts), which sets the
            -- adminId cookie; src/app/admin/layout.tsx gates admin routes on that
            -- cookie. The profiles table maps auth users to display names only —
            -- there is NO role/is_admin column, no app-metadata claim, and no staff
            -- table. The database therefore cannot currently distinguish staff from
            -- any other authenticated user.
            --
            -- Because no reliable staff-role signal exists, this migration grants no
            -- management rights on pos_sessions, tables, rooms, or cubicles. Instead,
            -- staff operations (location CRUD, session create/deactivate, session
            -- listing) are performed by the server actions in src/lib/pos-actions.ts,
            -- which (1) verify a Supabase Auth session with auth.getUser() on the
            -- server and (2) use the service-role key (SUPABASE_SERVICE_ROLE_KEY) when
            -- configured, falling back to the anon key — in which case writes fail
            -- closed with permission errors.
            --
            -- To enable staff management: set SUPABASE_SERVICE_ROLE_KEY in the server
            -- environment (server actions run only on the server; the key is never
            -- sent to the browser). To move management into the database later, add a
            -- staff signal (e.g. profiles.role or a Supabase app-metadata claim) and
            -- gate policies or SECURITY DEFINER helpers on it — do not widen these
            -- grants to every authenticated user.
            -- ---------------------------------------------------------------------------
