-- ==============================================================================
-- SUPABASE COMPLETE SCHEMA & MIGRATION SCRIPT
-- Application: AI School Admissions CRM
-- Run this entire script in Supabase Dashboard -> SQL Editor -> New Query -> Run
-- 100% Safe to run on fresh databases OR existing databases (Idempotent)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 2. TABLE DEFINITIONS (Fresh Install)
-- ------------------------------------------------------------------------------

-- Team Members Table
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    owner_id UUID,
    organization_name TEXT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'Sales Executive' CHECK (role IN ('Sales Executive', 'Lead Specialist', 'Manager', 'Admin')),
    is_owner BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Leads Table
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID,
    name TEXT NOT NULL,
    organization TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    city TEXT,
    source TEXT NOT NULL DEFAULT 'Website' CHECK (source IN ('Website', 'Referral', 'Cold Call', 'Social Media', 'Event', 'WhatsApp', 'Other')),
    status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Contacted', 'In Progress', 'Proposal Sent', 'Won', 'Lost')),
    priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
    deal_value NUMERIC DEFAULT 0,
    assigned_to UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
    notes TEXT,
    last_contacted TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lead Activities & Interaction Logs Table
CREATE TABLE IF NOT EXISTS public.lead_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('call', 'whatsapp', 'note', 'meeting', 'email', 'status_change')),
    title TEXT NOT NULL,
    description TEXT,
    outcome TEXT,
    performed_by TEXT,
    scheduled_at TIMESTAMPTZ,
    meeting_link TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 3. MIGRATION / UPGRADE PATCH (Guarantees columns exist in existing tables)
-- ------------------------------------------------------------------------------

-- Ensure all columns exist in public.team_members
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS organization_name TEXT;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS is_owner BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

-- Ensure all columns exist in public.leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.team_members(id) ON DELETE SET NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS deal_value NUMERIC DEFAULT 0;

-- Ensure all columns exist in public.lead_activities
ALTER TABLE public.lead_activities ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
ALTER TABLE public.lead_activities ADD COLUMN IF NOT EXISTS meeting_link TEXT;

-- ------------------------------------------------------------------------------
-- 4. PERFORMANCE INDEXES
-- ------------------------------------------------------------------------------

-- Multi-Tenant Owner Isolation Indexes
CREATE INDEX IF NOT EXISTS idx_leads_owner_id ON public.leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_members_owner_id ON public.team_members(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);

-- Pipeline & Query Acceleration Indexes
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON public.team_members(status);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON public.team_members(email);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON public.lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_created_at ON public.lead_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_activities_scheduled_at ON public.lead_activities(scheduled_at);

-- ------------------------------------------------------------------------------
-- 5. AUTOMATIC TIMESTAMP TRIGGERS
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_team_members_updated_at ON public.team_members;
CREATE TRIGGER tr_team_members_updated_at
    BEFORE UPDATE ON public.team_members
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_leads_updated_at ON public.leads;
CREATE TRIGGER tr_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

-- Permissive policies allowing CRM API client operations
DROP POLICY IF EXISTS "Allow all access to team_members" ON public.team_members;
CREATE POLICY "Allow all access to team_members"
    ON public.team_members
    FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to leads" ON public.leads;
CREATE POLICY "Allow all access to leads"
    ON public.leads
    FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to lead_activities" ON public.lead_activities;
CREATE POLICY "Allow all access to lead_activities"
    ON public.lead_activities
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- ==============================================================================
-- END OF SCHEMA
-- ==============================================================================
