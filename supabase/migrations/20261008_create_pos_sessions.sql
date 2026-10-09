-- Migration: Create pos_sessions table for QR code customer ordering sessions
-- Created: 2026-10-08

-- Create the pos_sessions table
CREATE TABLE IF NOT EXISTS public.pos_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id UUID NULL REFERENCES public.tables(id) ON DELETE SET NULL,
    room_id UUID NULL REFERENCES public.rooms(id) ON DELETE SET NULL,
    qr_token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Constraint: must have either table_id OR room_id, but not both
    CONSTRAINT pos_sessions_one_location CHECK (
        (table_id IS NOT NULL AND room_id IS NULL)
        OR (table_id IS NULL AND room_id IS NOT NULL)
    )
);

-- Create indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_pos_sessions_qr_token ON public.pos_sessions(qr_token);
CREATE INDEX IF NOT EXISTS idx_pos_sessions_table_id ON public.pos_sessions(table_id);
CREATE INDEX IF NOT EXISTS idx_pos_sessions_room_id ON public.pos_sessions(room_id);
CREATE INDEX IF NOT EXISTS idx_pos_sessions_expires_at ON public.pos_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_pos_sessions_is_active ON public.pos_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_pos_sessions_active_lookup ON public.pos_sessions(qr_token, is_active, expires_at);

-- Enable Row Level Security
ALTER TABLE public.pos_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies will be added later when implementing the application flow
-- For now, no policies = no access (secure by default)

-- Add updated_at trigger (reuse existing pattern if available)
-- Note: Assuming a standard updated_at trigger function exists or will be created
-- If not, one can be added:
-- CREATE OR REPLACE FUNCTION public.handle_updated_at()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     NEW.updated_at = now();
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
-- 
-- CREATE TRIGGER set_pos_sessions_updated_at
--     BEFORE UPDATE ON public.pos_sessions
--     FOR EACH ROW
--     EXECUTE FUNCTION public.handle_updated_at();

-- Comment for documentation
COMMENT ON TABLE public.pos_sessions IS 'Active QR code customer ordering sessions linked to tables or rooms. Expires after 24 hours. Historical orders preserved separately in pos_orders.';
COMMENT ON COLUMN public.pos_sessions.table_id IS 'Reference to tables table for bistro/coworking table sessions';
COMMENT ON COLUMN public.pos_sessions.room_id IS 'Reference to rooms table for private room sessions';
COMMENT ON COLUMN public.pos_sessions.qr_token IS 'Unique token embedded in QR code for customer session access';
COMMENT ON COLUMN public.pos_sessions.expires_at IS 'Session expiration timestamp (24 hours from creation)';
COMMENT ON COLUMN public.pos_sessions.is_active IS 'Allows manual deactivation before expiration';