-- Your SQL goes here
CREATE TABLE IF NOT EXISTS agent(
    tenant_id uuid NOT NULL REFERENCES tenant(id),
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    description text,
    is_deleted boolean NOT NULL DEFAULT FALSE,
    created_by uuid NOT NULL REFERENCES application_user(id),
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
);

SELECT
    set_rls_on_table('agent');

SELECT
    set_updated_at_on_table('agent');

CREATE TYPE task_state AS enum(
    'submitted',
    'working',
    'input-required',
    'completed',
    'canceled',
    'failed',
    'unknown'
);

CREATE TYPE task_type AS enum(
    'outgoing',
    'incoming'
);

CREATE TABLE IF NOT EXISTS task(
    tenant_id uuid NOT NULL REFERENCES tenant(id),
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id uuid NOT NULL REFERENCES agent(id),
    task_id text NOT NULL,
    counterparty_id text,
    task_state task_state NOT NULL,
    task_type task_type NOT NULL,
    push_notification jsonb,
    a2a_task jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE (agent_id, counterparty_id, task_id)
);

SELECT
    set_rls_on_table('task');

SELECT
    set_updated_at_on_table('task');

