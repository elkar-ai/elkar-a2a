-- Your SQL goes here
CREATE TABLE IF NOT EXISTS task_subscription(
    tenant_id uuid NOT NULL REFERENCES tenant(id),
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id uuid NOT NULL REFERENCES task(id),
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
);

SELECT
    set_rls_on_table('task_subscription');

SELECT
    set_updated_at_on_table('task_subscription');

CREATE TABLE IF NOT EXISTS task_event(
    tenant_id uuid NOT NULL REFERENCES tenant(id),
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id uuid NOT NULL REFERENCES task(id),
    event_data jsonb NOT NULL,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
);

SELECT
    set_rls_on_table('task_event');

SELECT
    set_updated_at_on_table('task_event');

CREATE TYPE task_event_subscription_status AS ENUM(
    'pending',
    'delivered',
    'failed'
);

CREATE TABLE IF NOT EXISTS task_event_subscription(
    tenant_id uuid NOT NULL REFERENCES tenant(id),
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_event_id uuid NOT NULL REFERENCES task_event(id),
    task_subscription_id uuid NOT NULL REFERENCES task_subscription(id),
    status task_event_subscription_status NOT NULL DEFAULT 'pending'
);

SELECT
    set_rls_on_table('task_event_subscription');

