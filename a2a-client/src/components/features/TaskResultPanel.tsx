import React from "react";
import styled from "styled-components";
import {
  Task,
  TaskState,
  TaskStatus,
  Artifact,
  Message,
} from "../../types/a2aTypes";
import { PartDisplay } from "../common/partDisplay";

const Title = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const StatusBadge = styled.span<{ $status: TaskStatus }>`
  display: inline-block;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 600;
  background-color: ${({ $status, theme }) => {
    switch ($status.state) {
      case TaskState.COMPLETED:
        return theme.colors.success;
      case TaskState.FAILED:
        return theme.colors.error;
      case TaskState.CANCELED:
        return theme.colors.warning;
      default:
        return theme.colors.info;
    }
  }};
  color: ${({ theme }) => theme.colors.text};
`;

const InfoRow = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
`;

const Label = styled.strong`
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const CodeBlock = styled.pre`
  background-color: ${({ theme }) => theme.colors.background};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  overflow-x: auto;
  font-family: "Fira Code", monospace;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1.5;
  margin-top: ${({ theme }) => theme.spacing.md};
  flex: 1;
  height: 100%;
`;

const ArtifactContainer = styled.div`
  margin-top: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
`;

const ArtifactHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const ArtifactTitle = styled.h4`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

const HistoryItemContainer = styled.div`
  margin-top: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
`;

const HistoryItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const HistoryItemRole = styled.span<{ $role: "user" | "agent" }>`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  color: ${({ $role, theme }) =>
    $role === "user" ? theme.colors.primary : theme.colors.secondary};
`;

interface ArtifactDisplayProps {
  artifact: Artifact;
}

const ArtifactDisplay: React.FC<ArtifactDisplayProps> = ({ artifact }) => {
  return (
    <ArtifactContainer>
      <ArtifactHeader>
        <ArtifactTitle>
          {artifact.name || `Artifact ${artifact.index}`}
        </ArtifactTitle>
        {artifact.description && <span>{artifact.description}</span>}
      </ArtifactHeader>
      {artifact.parts.map((part, index) => (
        <PartDisplay key={index} part={part} index={index} />
      ))}
      {/* {artifact.metadata && (
        <PartContainer>
          <PartType>Metadata:</PartType>
          <CodeBlock>{JSON.stringify(artifact.metadata, null, 2)}</CodeBlock>
        </PartContainer>
      )} */}
    </ArtifactContainer>
  );
};

interface HistoryItemProps {
  historyItem: Message;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ historyItem }) => {
  return (
    <HistoryItemContainer>
      <HistoryItemHeader>
        <HistoryItemRole $role={historyItem.role}>
          {historyItem.role.charAt(0).toUpperCase() + historyItem.role.slice(1)}
        </HistoryItemRole>
      </HistoryItemHeader>
      {historyItem.parts.map((part, index) => (
        <PartDisplay key={index} part={part} index={index} />
      ))}
      {/* {historyItem.metadata && (
        <PartContainer>
          <PartType>Metadata:</PartType>
          <CodeBlock>{JSON.stringify(historyItem.metadata, null, 2)}</CodeBlock>
        </PartContainer>
      )} */}
    </HistoryItemContainer>
  );
};

interface TaskResultPanelProps {
  task: Task;
}

const TaskResultPanelContainer = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  height: 100%;
`;

const TaskResultPanel: React.FC<TaskResultPanelProps> = ({ task }) => {
  return (
    <TaskResultPanelContainer>
      <Title>Task Result</Title>
      <InfoRow>
        <Label>Status:</Label>
        <StatusBadge $status={task.status}>{task.status.state}</StatusBadge>
      </InfoRow>
      <InfoRow>
        <Label>ID:</Label>
        <span>{task.id}</span>
      </InfoRow>
      {task.sessionId && (
        <InfoRow>
          <Label>Session ID:</Label>
          <span>{task.sessionId}</span>
        </InfoRow>
      )}
      {task.result && (
        <>
          <Label>Result:</Label>
          <CodeBlock>{JSON.stringify(task.result, null, 2)}</CodeBlock>
        </>
      )}
      {task.artifacts && (
        <>
          <Label>Artifacts:</Label>
          {task.artifacts.map((artifact, index) => (
            <ArtifactDisplay key={index} artifact={artifact} />
          ))}
        </>
      )}
      {task.history && (
        <>
          <Label>History:</Label>
          {task.history.map((historyItem, index) => (
            <HistoryItem key={index} historyItem={historyItem} />
          ))}
        </>
      )}
    </TaskResultPanelContainer>
  );
};

export default TaskResultPanel;
