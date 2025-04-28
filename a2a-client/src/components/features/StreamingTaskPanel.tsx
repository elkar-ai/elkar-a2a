import React, { useState } from "react";
import styled from "styled-components";
import SplitContentLayout from "../layouts/SplitContentLayout";
import {
  TaskArtifactUpdateEvent,
  TaskSendParams,
  TaskStatusUpdateEvent,
  Part,
} from "../../types/a2aTypes";
import { useUrl } from "../../contexts/urlContext";
import A2AClient from "../../services/a2aClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { v4 as uuidv4 } from "uuid";
import TaskResultPanel from "./TaskResultPanel";

const PanelContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 200px;
  resize: vertical;
  font-family: "Fira Code", monospace;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1.5;
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  padding: ${({ theme }) => theme.spacing.sm};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const Button = styled.button`
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.text};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-weight: 600;
  transition: all 0.2s ease;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

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
`;

const StreamingHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.sm};
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
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
  padding: ${({ theme }) => theme.spacing.sm};
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
`;

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

  &:hover {
    opacity: 0.9;
  }
`;

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

type TabType = "streaming" | "results";

const TabSelector: React.FC<{
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}> = ({ activeTab, onTabChange }) => {
  return (
    <TabContainer>
      <TabButton
        $isActive={activeTab === "streaming"}
        onClick={() => onTabChange("streaming")}
      >
        Streaming Events
      </TabButton>
      <TabButton
        $isActive={activeTab === "results"}
        onClick={() => onTabChange("results")}
      >
        Task
      </TabButton>
    </TabContainer>
  );
};

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

const StreamingPanel: React.FC<StreamingPanelProps> = ({
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

const StreamingTaskPanel = () => {
  const [activeTab, setActiveTab] = useState<TabType>("streaming");
  const [streamingEvents, setStreamingEvents] = useState<
    (TaskStatusUpdateEvent | TaskArtifactUpdateEvent)[]
  >([]);
  const { endpoint } = useUrl();
  const api_client = new A2AClient(endpoint);
  const [taskId, setTaskId] = useState<string>("");
  const [sendTaskParams, setSendTaskParams] = useState<TaskSendParams>({
    message: {
      role: "user",
      parts: [],
    },
    id: "",
    sessionId: "",
  });

  const sendTaskMutation = useMutation({
    mutationFn: (sendTaskParams: TaskSendParams) =>
      api_client.streamTask(sendTaskParams, (update) =>
        setStreamingEvents((prev) => (update ? [...prev, update] : prev))
      ),
    onMutate: () => {
      setStreamingEvents([]);
    },
  });

  const getTaskQuery = useQuery({
    queryKey: ["task", sendTaskParams.id],
    queryFn: () => api_client.getTask(sendTaskParams.id),
  });

  return (
    <SplitContentLayout
      input={
        <PanelContainer>
          <TextArea
            value={
              sendTaskParams.message.parts[0]?.type === "text"
                ? sendTaskParams.message.parts[0].text
                : ""
            }
            onChange={(e) =>
              setSendTaskParams({
                ...sendTaskParams,
                message: {
                  ...sendTaskParams.message,
                  parts: [
                    {
                      type: "text",
                      text: e.target.value,
                    },
                  ],
                },
              })
            }
            placeholder="Enter your message"
            disabled={sendTaskMutation.isPending}
          />
          <Button
            onClick={() => {
              setTaskId(uuidv4());
              sendTaskMutation.mutate({
                ...sendTaskParams,
                id: taskId,
                sessionId: uuidv4(),
              });
            }}
            disabled={
              sendTaskMutation.isPending ||
              (sendTaskParams.message.parts[0]?.type === "text" &&
                !sendTaskParams.message.parts[0].text.trim())
            }
          >
            {sendTaskMutation.isPending ? "Streaming..." : "Start Streaming"}
          </Button>
        </PanelContainer>
      }
      output={
        <TabContent>
          <TabSelector activeTab={activeTab} onTabChange={setActiveTab} />
          <Separator />
          <ContentContainer>
            {activeTab === "results" && getTaskQuery.data && (
              <TaskResultPanel task={getTaskQuery.data} />
            )}
            {activeTab === "streaming" && (
              <StreamingPanel
                events={streamingEvents}
                isStreaming={sendTaskMutation.isPending}
              />
            )}
          </ContentContainer>
        </TabContent>
      }
    />
  );
};

export default StreamingTaskPanel;
