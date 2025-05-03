import React from "react";
import styled from "styled-components";
import {
  TaskArtifactUpdateEvent,
  TaskStatusUpdateEvent,
  Part,
} from "../../types/a2aTypes";

const UpdateItem = styled.div`
  font-family: "Fira Code", monospace;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1.5;
  padding: ${({ theme }) => theme.spacing.sm};
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  border-left: 3px solid ${({ theme }) => theme.colors.primary};
`;

const UpdateHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const UpdateType = styled.span<{ $type: "status" | "artifact" }>`
  font-weight: 600;
  color: ${({ $type, theme }) =>
    $type === "status" ? theme.colors.primary : theme.colors.secondary};
`;

const UpdateContent = styled.pre`
  margin: 0;
  padding: 0;
  background: none;
  color: ${({ theme }) => theme.colors.text};
`;

const ArtifactInfo = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const StatusInfo = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const PartContainer = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.xs};
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.fontSizes.xs};
`;

const PartType = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-right: ${({ theme }) => theme.spacing.sm};
`;

const StreamingPanelContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  height: 100%;
  min-height: 0;
`;

const StreamingHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  flex-shrink: 0;
`;

const StreamingTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

const StreamingStatus = styled.span<{ $isActive: boolean }>`
  color: ${({ $isActive, theme }) =>
    $isActive ? theme.colors.success : theme.colors.textSecondary};
  font-weight: 600;
`;

const StreamingContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  min-height: 0;
`;

const renderPart = (part: Part) => {
  switch (part.type) {
    case "text":
      return <span>{part.text}</span>;
    case "file":
      return (
        <PartContainer>
          <PartType>File:</PartType>
          <div>
            {part.file.name && <div>Name: {part.file.name}</div>}
            {part.file.mimeType && <div>Type: {part.file.mimeType}</div>}
            {part.file.uri && <div>URI: {part.file.uri}</div>}
          </div>
        </PartContainer>
      );
    case "data":
      return (
        <PartContainer>
          <PartType>Data:</PartType>
          <pre>{JSON.stringify(part.data, null, 2)}</pre>
        </PartContainer>
      );
    default:
      return null;
  }
};

const renderUpdateItem = (
  update: TaskStatusUpdateEvent | TaskArtifactUpdateEvent
) => {
  if ("status" in update) {
    return (
      <UpdateItem>
        <UpdateHeader>
          <UpdateType $type="status">Status Update</UpdateType>
          <span>{new Date(update.status.timestamp).toLocaleTimeString()}</span>
        </UpdateHeader>
        <UpdateContent>
          {update.status.message?.parts.map((part, index) => (
            <React.Fragment key={index}>{renderPart(part)}</React.Fragment>
          ))}
        </UpdateContent>
        <StatusInfo>
          State: {update.status.state}
          {update.final && " (Final)"}
        </StatusInfo>
      </UpdateItem>
    );
  } else {
    return (
      <UpdateItem>
        <UpdateHeader>
          <UpdateType $type="artifact">Artifact Update</UpdateType>
          <span>Index: {update.artifact.index}</span>
        </UpdateHeader>
        <UpdateContent>
          {update.artifact.parts.map((part, index) => (
            <React.Fragment key={index}>{renderPart(part)}</React.Fragment>
          ))}
        </UpdateContent>
        <ArtifactInfo>
          {update.artifact.name && `Name: ${update.artifact.name}`}
          {update.artifact.description &&
            `Description: ${update.artifact.description}`}
          {update.artifact.lastChunk && " (Last Chunk)"}
        </ArtifactInfo>
      </UpdateItem>
    );
  }
};

interface StreamingPanelProps {
  events: (TaskStatusUpdateEvent | TaskArtifactUpdateEvent)[];
  isStreaming: boolean;
}

export const StreamingPanel: React.FC<StreamingPanelProps> = ({
  events,
  isStreaming,
}) => {
  return (
    <StreamingPanelContainer>
      <StreamingHeader>
        <StreamingTitle>Streaming Updates</StreamingTitle>
        <StreamingStatus $isActive={isStreaming}>
          {isStreaming ? "Streaming" : "Inactive"}
        </StreamingStatus>
      </StreamingHeader>
      <StreamingContent>
        {events.map((update, index) => (
          <React.Fragment key={index}>
            {renderUpdateItem(update)}
          </React.Fragment>
        ))}
      </StreamingContent>
    </StreamingPanelContainer>
  );
};
