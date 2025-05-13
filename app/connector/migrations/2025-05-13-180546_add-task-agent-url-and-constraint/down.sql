-- This file should undo anything in `up.sql`
ALTER TABLE task
    DROP CONSTRAINT unique_agent_task;

ALTER TABLE task
    DROP COLUMN server_agent_url;

