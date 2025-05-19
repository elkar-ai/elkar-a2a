-- Your SQL goes here
CREATE TABLE debugger_history(
    tenant_id uuid NOT NULL,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id text NOT NULL,
    url text NOT NULL,
    payload jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (task_id, url)
);

SELECT
    set_rls_on_table('debugger_history');

SELECT
    set_updated_at_on_table('debugger_history');

