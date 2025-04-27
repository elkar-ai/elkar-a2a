import React from "react";
import styled from "styled-components";
import { Task, TaskState } from "../types/a2aTypes";

interface TaskResultPanelProps {
  task: Task;
}

const Panel = styled.div`
  background-color: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  padding: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Title = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.darkGray};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const SubTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.darkGray};
  margin-top: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const TaskInfo = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  padding-bottom: ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const InfoItem = styled.p`
  margin-bottom: ${({ theme }) => theme.spacing.sm};

  strong {
    font-weight: 500;
  }
`;

const StatusMessage = styled.div`
  margin-top: ${({ theme }) => theme.spacing.md};
`;

interface StatusProps {
  state: string;
}

const Status = styled.span<StatusProps>`
  color: ${({ state, theme }) => {
    switch (state) {
      case TaskState.COMPLETED:
        return theme.colors.green;
      case TaskState.FAILED:
        return theme.colors.red;
      case TaskState.WORKING:
        return theme.colors.blue;
      case TaskState.INPUT_REQUIRED:
        return theme.colors.orange;
      default:
        return theme.colors.gray;
    }
  }};
  font-weight: 500;
`;

const Artifact = styled.div`
  background-color: ${({ theme }) => theme.colors.lightBg};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  padding: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const ArtifactTitle = styled.h4`
  font-size: ${({ theme }) => theme.fontSizes.md};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const ArtifactDescription = styled.p`
  color: ${({ theme }) => theme.colors.darkGray};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const ArtifactPart = styled.div`
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

const Pre = styled.pre`
  background-color: ${({ theme }) => theme.colors.white};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  overflow-x: auto;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1.6;
  word-wrap: break-all;
  white-space: pre-wrap;
`;

const HistoryItem = styled.div`
  background-color: ${({ theme }) => theme.colors.lightBg};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  padding: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const MessagePart = styled.div`
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

const RawData = styled.div`
  margin-top: ${({ theme }) => theme.spacing.lg};
`;

const TaskResultPanel: React.FC<TaskResultPanelProps> = ({ task }) => {
  // Render task artifacts
  const renderArtifacts = () => {
    if (!task?.artifacts || task.artifacts.length === 0) {
      return <p>No artifacts available</p>;
    }

    return task.artifacts.map((artifact, index) => (
      <Artifact key={index}>
        <ArtifactTitle>{artifact.name || `Artifact ${index}`}</ArtifactTitle>
        {artifact.description && (
          <ArtifactDescription>{artifact.description}</ArtifactDescription>
        )}
        {artifact.parts.map((part, partIndex) => {
          if (part.type === "text") {
            return (
              <ArtifactPart key={partIndex}>
                <Pre>{part.text}</Pre>
              </ArtifactPart>
            );
          } else if (part.type === "file") {
            return (
              <ArtifactPart key={partIndex}>
                <p>File: {part.file.name || "Unnamed"}</p>
                {part.file.uri && (
                  <a href={part.file.uri} target="_blank" rel="noreferrer">
                    View File
                  </a>
                )}
              </ArtifactPart>
            );
          } else if (part.type === "data") {
            return (
              <ArtifactPart key={partIndex}>
                <Pre>{JSON.stringify(part.data, null, 2)}</Pre>
              </ArtifactPart>
            );
          }
          return null;
        })}
      </Artifact>
    ));
  };

  return (
    <Panel>
      <Title>Task Result</Title>
      <TaskInfo>
        <InfoItem>
          <strong>Task ID:</strong> {task.id}
        </InfoItem>
        <InfoItem>
          <strong>Session ID:</strong> {task.sessionId || "N/A"}
        </InfoItem>
        <InfoItem>
          <strong>Status:</strong>{" "}
          <Status state={task.status.state}>{task.status.state}</Status>
        </InfoItem>
        {task.status.message && (
          <StatusMessage>
            <strong>Status Message:</strong>
            <Pre>{JSON.stringify(task.status.message, null, 2)}</Pre>
          </StatusMessage>
        )}
      </TaskInfo>

      <div>
        <SubTitle>Artifacts</SubTitle>
        {renderArtifacts()}
      </div>

      {task.history && task.history.length > 0 && (
        <div>
          <SubTitle>History</SubTitle>
          {task.history.map((message, index) => (
            <HistoryItem key={index}>
              <InfoItem>
                <strong>Role:</strong> {message.role}
              </InfoItem>
              {message.parts.map((part, partIndex) => {
                if (part.type === "text") {
                  return (
                    <MessagePart key={partIndex}>
                      <Pre>{part.text}</Pre>
                    </MessagePart>
                  );
                }
                return null;
              })}
            </HistoryItem>
          ))}
        </div>
      )}

      <RawData>
        <SubTitle>Raw Task Data</SubTitle>
        <Pre>{JSON.stringify(task, null, 2)}</Pre>
      </RawData>
    </Panel>
  );
};

export default TaskResultPanel;
