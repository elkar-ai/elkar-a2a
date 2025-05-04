-- Sets up a trigger for the given table to automatically set a column called
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION fill_updated_at_column()
    RETURNS TRIGGER
    AS $$
BEGIN
    IF ROW(NEW.*) IS DISTINCT FROM ROW(OLD.*) THEN
        NEW.updated_at = now();
    END IF;
    RETURN NEW;
END;
$$
LANGUAGE 'plpgsql';

CREATE OR REPLACE FUNCTION set_updated_at_on_table(_tbl regclass)
    RETURNS VOID
    AS $$
BEGIN
    EXECUTE format('CREATE TRIGGER set_updated_at_%s BEFORE UPDATE OR INSERT ON %s
                    FOR EACH ROW EXECUTE PROCEDURE fill_updated_at_column()', _tbl, _tbl);
END;
$$
LANGUAGE plpgsql;

-- set RLS on table for app_user
CREATE OR REPLACE FUNCTION set_rls_on_table(_tbl regclass)
    RETURNS VOID
    AS $$
BEGIN
    EXECUTE format('ALTER TABLE %s ALTER COLUMN tenant_id SET DEFAULT current_setting(''tenant.id'', TRUE)::uuid;
                    ALTER TABLE %s ENABLE ROW LEVEL SECURITY;
                    CREATE POLICY %s_app_user_rls ON %s TO app_user
                        USING (tenant_id = current_setting(''tenant.id'', TRUE)::uuid);', _tbl, _tbl, _tbl, _tbl);
END;
$$
LANGUAGE plpgsql;

CREATE TABLE tenant(
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    created_at timestamp NOT NULL DEFAULT NOW(),
    updated_at timestamp NOT NULL DEFAULT NOW()
);

CREATE TYPE application_user_status AS ENUM(
    'ACTIVE',
    'DELETED',
    'INVITED'
);

CREATE TABLE application_user(
    -- id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    id uuid PRIMARY KEY, -- from supabase
    status application_user_status NOT NULL,
    email text NOT NULL,
    first_name text,
    last_name text,
    created_at timestamp NOT NULL DEFAULT NOW(),
    updated_at timestamp NOT NULL DEFAULT NOW()
);

CREATE TABLE tenant_user(
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp NOT NULL DEFAULT NOW(),
    updated_at timestamp NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, user_id),
    FOREIGN KEY (tenant_id) REFERENCES tenant(id),
    FOREIGN KEY (user_id) REFERENCES application_user(id)
);

