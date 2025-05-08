import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import styled from "styled-components";
import {
  Message,
  Task,
  TaskArtifactUpdateEvent,
  TaskSendParams,
  TaskStatusUpdateEvent,
} from "../../types/a2aTypes";
import { useUrl } from "../../contexts/UrlContext";
import A2AClient from "../../services/a2aClient";
import SplitContentLayout from "../layouts/SplitContentLayout";
import { FullTaskPanel } from "./TaskResultPanel";
import { v4 as uuidv4 } from "uuid";
import { useSearchParams } from "react-router";
import { SendMessageArea } from "./SendMessageArea";

const Container = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const Header = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  flex-shrink: 0;
`;

const ControlsContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
`;

const MessagesContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  min-height: 0;
`;

const Input = styled.input`
  width: 200px;
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  font-family: "Fira Code", monospace;
  font-size: ${({ theme }) => theme.fontSizes.sm};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}20;
  }
`;

const NewTaskButton = styled.button`
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-weight: 500;
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.text};
  border: none;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.secondary};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const SwitchContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Switch = styled.label`
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  span {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: ${({ theme }) => theme.colors.background};
    transition: 0.4s;
    border-radius: 20px;
    border: 1px solid ${({ theme }) => theme.colors.border};

    &:before {
      position: absolute;
      content: "";
      height: 16px;
      width: 16px;
      left: 2px;
      bottom: 1px;
      background-color: ${({ theme }) => theme.colors.primary};
      transition: 0.4s;
      border-radius: 50%;
    }
  }

  input:checked + span {
    background-color: ${({ theme }) => theme.colors.primary}20;
  }

  input:checked + span:before {
    transform: translateX(20px);
  }
`;

const NewTaskComponent = ({ onClick }: { onClick: () => void }) => {
  return (
    <NewTaskButton
      onClick={() => {
        onClick();
      }}
    >
      New Task
    </NewTaskButton>
  );
};

interface SendTaskPanelProps {
  taskId?: string;
  readOnly?: boolean;
  showNewTaskButton?: boolean;
  showGetTaskButton?: boolean;
}

const SendTaskPanel: React.FC<SendTaskPanelProps> = ({
  taskId: propTaskId,
  readOnly = false,
  showNewTaskButton = true,
  showGetTaskButton = true,
}) => {
  const { endpoint } = useUrl();
  const apiClient = new A2AClient(endpoint);
  const [searchParams, setSearchParams] = useSearchParams();
  // Use the taskId from props if provided, otherwise from search params
  const taskIdFromSearch = searchParams.get("taskId");
  const taskId = propTaskId || taskIdFromSearch;

  const [newTaskId, setNewTaskId] = useState<string>(taskId ?? uuidv4());
  const [task, setTask] = useState<Task | null>(null);
  const [streaming, setStreaming] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingMessages, setStreamingMessages] = useState<
    (TaskStatusUpdateEvent | TaskArtifactUpdateEvent)[]
  >([]);

  useEffect(() => {
    if (!propTaskId && taskIdFromSearch === null && !readOnly) {
      const newTaskId = uuidv4();
      setSearchParams({
        taskId: newTaskId,
      });
    }
  }, [taskIdFromSearch, propTaskId, readOnly, setSearchParams]);

  const getTaskClientQuery = useQuery({
    queryKey: ["tasks", taskId],
    queryFn: () => {
      return apiClient.getTask(taskId ?? "");
    },
    retry: false,
  });

  useEffect(() => {
    if (getTaskClientQuery.data) {
      setMessages(getTaskClientQuery.data?.history ?? []);
      setTask(getTaskClientQuery.data);
    } else {
      setMessages([]);
      setTask(null);
    }
  }, [getTaskClientQuery.isSuccess, getTaskClientQuery.data]);

  const sendTaskMutation = useMutation({
    mutationFn: async (params: TaskSendParams) => {
      if (streaming) {
        await apiClient.streamTask(params, (data) => {
          setStreamingMessages((prev) => [...prev, data]);
          getTaskClientQuery.refetch();
        });
        return undefined;
      }
      const result = await apiClient.sendTask(params);
      return result?.history?.[result.history.length - 1];
    },
    onSettled() {
      getTaskClientQuery.refetch();
    },
  });

  // Don't show controls or inputs in read-only mode
  if (readOnly) {
    return (
      <Container>
        {getTaskClientQuery.isLoading ? (
          <div>Loading task details...</div>
        ) : (
          <FullTaskPanel
            task={task}
            streamingEvents={streamingMessages}
            isCurrentlyStreaming={false}
            isStreamingActive={streaming}
            taskError={null}
            isTaskLoading={getTaskClientQuery.isLoading}
          />
        )}
      </Container>
    );
  }

  return (
    <SplitContentLayout
      input={
        <Container style={{ height: "100%" }}>
          <Header>
            {showNewTaskButton && (
              <NewTaskComponent
                onClick={() => {
                  const newTaskId = uuidv4();
                  setSearchParams({
                    taskId: newTaskId,
                  });
                  setMessages([]);
                  setTask(null);
                }}
              />
            )}
            {showGetTaskButton && (
              <ControlsContainer>
                <SwitchContainer>
                  <span>Streaming</span>
                  <Switch>
                    <input
                      type="checkbox"
                      checked={streaming}
                      onChange={(e) => setStreaming(e.target.checked)}
                    />
                    <span></span>
                  </Switch>
                </SwitchContainer>
                <Input
                  type="text"
                  value={newTaskId}
                  onChange={(e) => setNewTaskId(e.target.value)}
                  placeholder="Enter task ID"
                />
                <NewTaskButton
                  onClick={() => {
                    setSearchParams({
                      taskId: newTaskId,
                    });
                  }}
                >
                  Get
                </NewTaskButton>
              </ControlsContainer>
            )}
          </Header>
          <MessagesContainer>
            {messages.map((m, i) => (
              <MessageComponent key={i} message={m} />
            ))}
          </MessagesContainer>
          <SendMessageArea
            taskId={taskId}
            sessionId={null}
            sendTaskMutation={sendTaskMutation}
            setMessages={setMessages}
          />
        </Container>
      }
      output={
        <Container>
          <FullTaskPanel
            task={task}
            streamingEvents={streamingMessages}
            isCurrentlyStreaming={sendTaskMutation.isPending}
            isStreamingActive={true}
            taskError={getTaskClientQuery.error?.message || null}
            isTaskLoading={getTaskClientQuery.isLoading}
          />
        </Container>
      }
    />
  );
};

export default SendTaskPanel;

const MessageContainer = styled.div<{ $isAgent: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: ${({ $isAgent }) => ($isAgent ? "flex-start" : "flex-end")};
  width: 100%;
  padding: ${({ theme }) => theme.spacing.xs};
  gap: ${({ theme }) => theme.spacing.xs};
`;

const MessageBubble = styled.div<{ $isAgent: boolean }>`
  background-color: ${({ $isAgent, theme }) =>
    $isAgent ? theme.colors.surface : theme.colors.primary};
  color: ${({ $isAgent, theme }) =>
    $isAgent ? theme.colors.text : theme.colors.text};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.sm};
  max-width: 80%;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  border: 1px solid
    ${({ $isAgent, theme }) => ($isAgent ? theme.colors.border : "transparent")};
`;

const MessageText = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-word;
`;

const FilePartContainer = styled.div<{ $isAgent: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  background-color: ${({ $isAgent, theme }) =>
    $isAgent ? theme.colors.background : theme.colors.primary};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  border: 1px solid
    ${({ $isAgent, theme }) => ($isAgent ? theme.colors.border : "transparent")};
  max-width: 80%;
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const FileIcon = styled.div`
  color: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  svg {
    width: 14px;
    height: 14px;
  }
`;

const FileInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const FileName = styled.div`
  font-weight: 500;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const FileType = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

function MessageComponent({ message }: { message: Message }) {
  const textParts = message.parts.filter((p) => p.type === "text");
  const fileParts = message.parts.filter((p) => p.type === "file");
  const isAgent = message.role === "agent";

  return (
    <MessageContainer $isAgent={isAgent}>
      {textParts.length > 0 && (
        <MessageBubble $isAgent={isAgent}>
          <MessageText>
            {textParts.map((p, i) => (
              <div key={i}>{p.text}</div>
            ))}
          </MessageText>
        </MessageBubble>
      )}
      {fileParts.map((p, i) => (
        <FilePartContainer key={i} $isAgent={isAgent}>
          <FileIcon>
            <svg
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
            <FileName>{p.file.name}</FileName>
            {p.file.mimeType && <FileType>{p.file.mimeType}</FileType>}
          </FileInfo>
        </FilePartContainer>
      ))}
    </MessageContainer>
  );
}
