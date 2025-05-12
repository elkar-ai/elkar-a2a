import React, { useState } from "react";
import styled from "styled-components";

import { PartDisplay } from "../common/partDisplay";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUrl } from "../../contexts/UrlContext";
import A2AClient from "../../services/a2aClient";
import { StreamingPanel } from "./StreamingTask";
import {
  TaskState,
  Task,
  TaskStatus,
  Artifact,
  TaskStatusUpdateEvent,
  TaskArtifactUpdateEvent,
  FilePart,
} from "../../types/a2aTypes";
import toast from "react-hot-toast";

const Title = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const StatusBadge = styled.span<{ $status: TaskStatus }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  background-color: ${({ $status, theme }) => {
    switch ($status.state) {
      case TaskState.COMPLETED:
        return `${theme.colors.success}20`;
      case TaskState.FAILED:
        return `${theme.colors.error}20`;
      case TaskState.CANCELED:
        return `${theme.colors.warning}20`;
      default:
        return `${theme.colors.info}20`;
    }
  }};
  color: ${({ $status, theme }) => {
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
  border: 1px solid
    ${({ $status, theme }) => {
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
`;

const StatusMessage = styled.div`
  font-weight: normal;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.sm};
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const InfoRow = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  align-items: center;
  padding: ${({ theme }) => theme.spacing.sm};
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const Label = styled.strong`
  color: ${({ theme }) => theme.colors.textSecondary};
  min-width: 100px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const ArtifactContainer = styled.div`
  margin-top: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  background-color: ${({ theme }) => theme.colors.surface};
  box-shadow: 0 2px 4px ${({ theme }) => theme.colors.border}20;
`;

const ArtifactHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  padding-bottom: ${({ theme }) => theme.spacing.md};
  border-bottom: 2px solid ${({ theme }) => theme.colors.border};
`;

const ArtifactTitle = styled.h4`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
  font-weight: 600;
`;

const ArtifactDescription = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

const FileList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const FileItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const FileIcon = styled.div`
  color: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.sm};
  background-color: ${({ theme }) => theme.colors.primary}10;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
`;

const FileInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const FileName = styled.div`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const FileType = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const FileUri = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const DownloadButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.primary}10;
  color: ${({ theme }) => theme.colors.primary};
  border: 1px solid ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  transition: all 0.2s ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary}20;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

interface ArtifactDisplayProps {
  artifact: Artifact;
}

const ArtifactDisplay: React.FC<ArtifactDisplayProps> = ({ artifact }) => {
  const fileParts = artifact.parts.filter(
    (part): part is FilePart => part.type === "file",
  );
  const otherParts = artifact.parts.filter((part) => part.type !== "file");

  const handleDownload = async (part: FilePart) => {
    try {
      console.log("Downloading file part:", part);
      let blob: Blob;

      if (part.file.uri) {
        console.log("Downloading from URI:", part.file.uri);
        // Handle URI-based download
        const response = await fetch(part.file.uri);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        blob = await response.blob();
      } else if (part.file.bytes) {
        console.log(
          "Downloading from bytes, raw length:",
          part.file.bytes.length,
        );
        try {
          // Make sure we have a valid base64 string by:
          // 1. Replacing URL-safe chars with base64 standard chars
          // 2. Adding padding if needed
          let base64 = part.file.bytes.replace(/-/g, "+").replace(/_/g, "/");

          // Add padding if needed
          while (base64.length % 4) {
            base64 += "=";
          }

          console.log("Processed base64 string length:", base64.length);

          // Convert base64 to byte array using a safer method
          const byteArray = Uint8Array.from(atob(base64), (c) =>
            c.charCodeAt(0),
          );

          // Create blob with proper mime type if available
          blob = new Blob([byteArray], {
            type: part.file.mimeType || "application/octet-stream",
          });
          console.log("Created blob:", blob);
        } catch (decodeError) {
          console.error("Base64 decoding error:", decodeError);
          console.error(
            "Base64 string preview:",
            part.file.bytes.substring(0, 100) + "...",
          );
          throw new Error(
            "Failed to decode file content: " + decodeError.message,
          );
        }
      } else {
        throw new Error("No file content available");
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = part.file.name || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      console.log("Download completed");
    } catch (error) {
      console.error("Error downloading file:", error);
      // You might want to add proper error handling/notification here
    }
  };

  return (
    <ArtifactContainer>
      <ArtifactHeader>
        <div>
          <ArtifactTitle>
            {artifact.name || `Artifact ${artifact.index}`}
          </ArtifactTitle>
          {artifact.description && (
            <ArtifactDescription>{artifact.description}</ArtifactDescription>
          )}
        </div>
      </ArtifactHeader>

      {fileParts.length > 0 && (
        <FileList>
          {fileParts.map((part, index) => (
            <FileItem key={index}>
              <FileIcon>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </FileIcon>
              <FileInfo>
                <FileName>{part.file.name || "Unnamed file"}</FileName>
                {part.file.mimeType && (
                  <FileType>{part.file.mimeType}</FileType>
                )}
                {part.file.uri && <FileUri>{part.file.uri}</FileUri>}
              </FileInfo>
              {(part.file.uri || part.file.bytes) && (
                <DownloadButton onClick={() => handleDownload(part)}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download
                </DownloadButton>
              )}
            </FileItem>
          ))}
        </FileList>
      )}

      {otherParts.length > 0 && (
        <div style={{ marginTop: fileParts.length > 0 ? "1rem" : 0 }}>
          {otherParts.map((part, index) => (
            <PartDisplay key={index} part={part} index={index} />
          ))}
        </div>
      )}
    </ArtifactContainer>
  );
};

interface TaskResultPanelProps {
  task: Task;
  canCancel: boolean;
}

const TaskResultPanelContainer = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  height: 100%;
  min-height: 0;
  padding: ${({ theme }) => theme.spacing.md};
`;

const CancelButton = styled.button`
  background-color: ${({ theme }) => theme.colors.error}20;
  color: ${({ theme }) => theme.colors.error};
  border: 1px solid ${({ theme }) => theme.colors.error};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  cursor: pointer;
  width: fit-content;
  font-weight: 500;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  margin-bottom: ${({ theme }) => theme.spacing.sm};

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
type TabType = "streaming" | "results";
const TabContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  flex-shrink: 0;
  background-color: ${({ theme }) => theme.colors.background};
  padding: ${({ theme }) => theme.spacing.xs};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const TabButton = styled.button<{ $isActive: boolean }>`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  background-color: ${({ $isActive, theme }) =>
    $isActive ? theme.colors.primary : "transparent"};
  color: ${({ $isActive, theme }) =>
    $isActive ? theme.colors.text : theme.colors.textSecondary};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  cursor: pointer;
  font-weight: 500;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  transition: all 0.2s ease;
  position: relative;
  min-width: 120px;
  text-align: center;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background-color: ${({ $isActive, theme }) =>
      $isActive ? theme.colors.primary : theme.colors.surface};
    color: ${({ $isActive, theme }) =>
      $isActive ? theme.colors.text : theme.colors.text};
  }

  &:active:not(:disabled) {
    transform: translateY(1px);
  }
`;
const TabSelector: React.FC<{
  activeTab: TabType;

  onTabChange: (tab: TabType) => void;
  disabled: boolean;
}> = ({ activeTab, onTabChange, disabled }) => {
  return (
    <TabContainer>
      <TabButton
        $isActive={activeTab === "streaming"}
        onClick={() => onTabChange("streaming")}
        disabled={disabled}
      >
        Streaming Events
      </TabButton>
      <TabButton
        $isActive={activeTab === "results"}
        onClick={() => onTabChange("results")}
        disabled={disabled}
      >
        Task
      </TabButton>
    </TabContainer>
  );
};

const TaskResultPanel: React.FC<TaskResultPanelProps> = ({
  task,
  canCancel,
}) => {
  const { endpoint } = useUrl();
  const apiClient = new A2AClient(endpoint);
  const queryClient = useQueryClient();
  const cancelTaskMutation = useMutation({
    mutationFn: () => {
      return apiClient.cancelTask({ id: task.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", task.id] });
    },
  });

  return (
    <TaskResultPanelContainer>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <Title>Task Result</Title>
        {canCancel && (
          <CancelButton
            onClick={() => cancelTaskMutation.mutate()}
            disabled={cancelTaskMutation.isPending}
          >
            {cancelTaskMutation.isPending ? "Cancelling..." : "Cancel"}
          </CancelButton>
        )}
      </div>
      <InfoRow>
        <Label>Status:</Label>
        <StatusBadge $status={task.status}>{task.status.state}</StatusBadge>
      </InfoRow>
      {task.status.message && task.status.message.parts.length > 0 && (
        <InfoRow>
          <Label>Message:</Label>
          <StatusMessage>
            {task.status.message.parts
              .filter((part) => part.type === "text")
              .map((part) => part.text)
              .join(" ")}
          </StatusMessage>
        </InfoRow>
      )}
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

      {task.artifacts && (
        <>
          <Label>Artifacts:</Label>
          {task.artifacts.map((artifact, index) => (
            <ArtifactDisplay key={index} artifact={artifact} />
          ))}
        </>
      )}
    </TaskResultPanelContainer>
  );
};

export default TaskResultPanel;

const TabContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  max-height: 100%;

  background-color: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const ContentContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  max-height: 100%;
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.borderRadius.md};
`;

const Separator = styled.div`
  height: 1px;
  background-color: ${({ theme }) => theme.colors.border};
  /* margin: ${({ theme }) => theme.spacing.sm} 0; */
  flex-shrink: 0;
`;

const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.xl};
  height: 100%;
  min-height: 300px;
  text-align: center;
`;

const EmptyStateIcon = styled.div`
  color: ${({ theme }) => theme.colors.primary};
  background-color: ${({ theme }) => theme.colors.primary}10;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  font-size: 2rem;
`;

const EmptyStateTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const EmptyStateDescription = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.md};
  max-width: 400px;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const CreateButton = styled.button`
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-weight: 500;
  font-size: ${({ theme }) => theme.fontSizes.md};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary}DD;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: translateY(0);
  }
`;

export function FullTaskPanel({
  task,
  streamingEvents,
  isCurrentlyStreaming,
  isStreamingActive,
  isTaskLoading,
  taskError,
  canCancel = true,
  showStreaming = true,
}: {
  task: Task | null;
  streamingEvents: (TaskStatusUpdateEvent | TaskArtifactUpdateEvent)[];
  isCurrentlyStreaming: boolean;
  isStreamingActive: boolean;
  taskError: string | null;
  isTaskLoading: boolean;
  canCancel?: boolean;
  showStreaming?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<TabType>("results");

  const ErrorContainer = styled.div`
    padding: ${({ theme }) => theme.spacing.lg};
    background-color: ${({ theme }) => theme.colors.background};
    border: 1px solid ${({ theme }) => theme.colors.error}30;
    border-radius: ${({ theme }) => theme.borderRadius.md};
    margin: ${({ theme }) => theme.spacing.md};
    color: ${({ theme }) => theme.colors.error};
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing.md};
    align-items: center;
    text-align: center;
  `;

  const ErrorIcon = styled.div`
    font-size: 2rem;
    margin-bottom: ${({ theme }) => theme.spacing.sm};
  `;

  const ErrorMessage = styled.div`
    font-weight: 500;
    margin-bottom: ${({ theme }) => theme.spacing.sm};
  `;

  const ErrorHint = styled.div`
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.textSecondary};
  `;

  const LoadingContainer = styled.div`
    padding: ${({ theme }) => theme.spacing.lg};
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: ${({ theme }) => theme.spacing.md};
    height: 100%;
    min-height: 200px;
  `;

  const LoadingSpinner = styled.div`
    width: 50px;
    height: 50px;
    border: 3px solid ${({ theme }) => theme.colors.border};
    border-top: 3px solid ${({ theme }) => theme.colors.primary};
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: ${({ theme }) => theme.spacing.md};

    @keyframes spin {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
  `;

  const LoadingMessage = styled.div`
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: ${({ theme }) => theme.fontSizes.md};
    font-weight: 500;
  `;

  const LoadingSubtext = styled.div`
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: ${({ theme }) => theme.fontSizes.sm};
    max-width: 300px;
    text-align: center;
  `;

  const renderTask = () => {
    if (isTaskLoading) {
      return (
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingMessage>Loading task data...</LoadingMessage>
          <LoadingSubtext>
            Please wait while we retrieve the latest information
          </LoadingSubtext>
        </LoadingContainer>
      );
    }
    if (taskError) {
      return (
        <ErrorContainer>
          <ErrorIcon>⚠️</ErrorIcon>
          <ErrorMessage>{taskError}</ErrorMessage>
          <ErrorHint>
            You can create a new task or try with a different task ID
          </ErrorHint>
        </ErrorContainer>
      );
    }
    if (task) {
      return <TaskResultPanel task={task} canCancel={canCancel} />;
    }
    return (
      <EmptyStateContainer>
        <EmptyStateIcon>
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
            <polyline points="13 2 13 9 20 9"></polyline>
          </svg>
        </EmptyStateIcon>
        <EmptyStateTitle>No Task Data Available</EmptyStateTitle>
        <EmptyStateDescription>
          Enter a message to create a new task.
        </EmptyStateDescription>
      </EmptyStateContainer>
    );
  };

  if (!showStreaming) {
    return (
      <TabContent>
        <ContentContainer>{renderTask()}</ContentContainer>
      </TabContent>
    );
  }
  return (
    <TabContent>
      <TabSelector
        activeTab={activeTab}
        onTabChange={setActiveTab}
        disabled={!isStreamingActive}
      />
      <Separator />
      <ContentContainer>
        {activeTab === "results" && renderTask()}

        {activeTab === "streaming" && (
          <StreamingPanel
            events={streamingEvents}
            isStreaming={isCurrentlyStreaming}
          />
        )}
      </ContentContainer>
    </TabContent>
  );
}
