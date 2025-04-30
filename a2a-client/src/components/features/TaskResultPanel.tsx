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
} from "../../types/a2aTypes";

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

interface TaskResultPanelProps {
  task: Task;
}

const TaskResultPanelContainer = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  height: 100%;
`;

const CancelButton = styled.button`
  background-color: ${({ theme }) => theme.colors.error};
  color: ${({ theme }) => theme.colors.text};
  border: none;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  cursor: pointer;
  width: fit-content;
  font-weight: 500;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  &:hover {
    background-color: ${({ theme }) => theme.colors.error};
  }
  &:disabled {
    background-color: ${({ theme }) => theme.colors.error};
    cursor: not-allowed;
  }
  &:active {
    background-color: ${({ theme }) => theme.colors.error};
  }
`;
type TabType = "streaming" | "results";
const TabContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const TabButton = styled.button<{ $isActive: boolean }>`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background-color: ${({ $isActive, theme }) =>
    $isActive ? theme.colors.primary : theme.colors.surface};
  color: ${({ $isActive, theme }) =>
    $isActive ? theme.colors.text : theme.colors.textSecondary};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:hover {
    opacity: 0.9;
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

const TaskResultPanel: React.FC<TaskResultPanelProps> = ({ task }) => {
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
        <CancelButton
          onClick={() => cancelTaskMutation.mutate()}
          disabled={cancelTaskMutation.isPending}
        >
          {cancelTaskMutation.isPending ? "Cancelling..." : "Cancel"}
        </CancelButton>
      </div>
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
`;

const ContentContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  min-height: 0;
`;

const Separator = styled.div`
  height: 1px;
  background-color: ${({ theme }) => theme.colors.border};
  margin: ${({ theme }) => theme.spacing.sm} 0;
`;

export function FullTaskPanel({
  task,
  streamingEvents,
  isCurrentlyStreaming,
  isStreamingActive,
  isTaskLoading,
  taskError,
}: {
  task: Task | null;
  streamingEvents: (TaskStatusUpdateEvent | TaskArtifactUpdateEvent)[];
  isCurrentlyStreaming: boolean;
  isStreamingActive: boolean;
  taskError: string | null;
  isTaskLoading: boolean;
}) {
  const [activeTab, setActiveTab] = useState<TabType>("results");

  const renderTask = () => {
    if (isTaskLoading) {
      return <div>Loading...</div>;
    }
    if (taskError) {
      return <div>{taskError}</div>;
    }
    if (task) {
      return <TaskResultPanel task={task} />;
    }
    return <div>No task</div>;
  };
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
