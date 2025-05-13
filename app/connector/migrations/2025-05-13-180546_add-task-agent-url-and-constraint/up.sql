-- Your SQL goes here
ALTER TABLE task
    ADD COLUMN server_agent_url text;

ALTER TABLE task
    ADD CONSTRAINT unique_agent_task UNIQUE (agent_id, task_id, counterparty_id, task_type);

