import React from "react";
import {
  Card,
  SectionTitle,
  EmptyState,
  EmptyStateText,
  Button,
} from "./styles";

const TasksSection: React.FC = () => {
  return (
    <Card>
      <SectionTitle>Tasks</SectionTitle>
      <EmptyState>
        <EmptyStateText>
          No tasks have been assigned to this agent yet.
        </EmptyStateText>
        <Button>Create new task</Button>
      </EmptyState>
    </Card>
  );
};

export default TasksSection;
