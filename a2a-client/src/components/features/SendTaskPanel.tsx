import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import styled from "styled-components";
import {
  FilePart,
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
import { useTheme } from "styled-components";

import { IoMdClose } from "react-icons/io";

import { useSearchParams } from "react-router";
import { SendMessageArea } from "./SendMessageArea";

const Container = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const Input = styled.input`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  padding: ${({ theme }) => theme.spacing.sm};
  font-family: "Fira Code", monospace;
  font-size: ${({ theme }) => theme.fontSizes.sm};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const NewTaskButton = styled.div`
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  width: fit-content;
  font-weight: 500;
  cursor: pointer;
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.text};
`;

const SwitchContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
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

const Separator = styled.div`
  height: 1px;
  background-color: ${({ theme }) => theme.colors.border};
`;

const SendTaskPanel = () => {
  const { endpoint } = useUrl();

  const apiClient = new A2AClient(endpoint);
  const [searchParams, setSearchParams] = useSearchParams();
  const taskId = searchParams.get("taskId");
  const [newTaskId, setNewTaskId] = useState<string>(taskId ?? uuidv4());
  useEffect(() => {
    if (taskId === null) {
      const newTaskId = uuidv4();
      setSearchParams({
        taskId: newTaskId,
      });
    }
  }, [taskId]);
  // const [newTaskId, setNewTaskId] = useState<string>(taskId);
  const [task, setTask] = useState<Task | null>(null);
  const [streaming, setStreaming] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingMessages, setStreamingMessages] = useState<
    (TaskStatusUpdateEvent | TaskArtifactUpdateEvent)[]
  >([]);
  console.log("taskId", taskId);

  const getTaskClientQuery = useQuery({
    queryKey: ["tasks", taskId],
    queryFn: () => {
      return apiClient.getTask(taskId);
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
    mutationFn: async (TaskSendParams: TaskSendParams) => {
      if (streaming) {
        await apiClient.streamTask(TaskSendParams, (data) => {
          setStreamingMessages((prev) => [...prev, data]);
          getTaskClientQuery.refetch();
        });
        return;
      }
      return apiClient.sendTask(TaskSendParams);
    },

    // onSuccess(data) {
    //   setMessages(data?.history ?? []);
    // },
    onSettled() {
      getTaskClientQuery.refetch();
    },
  });

  return (
    <SplitContentLayout
      input={
        <Container>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              height: "100%",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
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
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  gap: "0.5rem",
                  alignItems: "center",
                }}
              >
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
                  Get Task
                </NewTaskButton>
              </div>
            </div>
            <Separator />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                overflowY: "auto",
                flex: 1,
                padding: "0.5rem",
              }}
            >
              {messages.map((m, i) => {
                return <MessageComponent key={i} message={m} />;
              })}
            </div>
          </div>

          <SendMessageArea
            taskId={taskId}
            sessionId={null}
            sendTaskMutation={sendTaskMutation}
            setMessages={setMessages}
          />
        </Container>
      }
      output={
        <FullTaskPanel
          task={task}
          streamingEvents={streamingMessages}
          isCurrentlyStreaming={sendTaskMutation.isPending}
          isStreamingActive={true}
          taskError={getTaskClientQuery.error?.message || null}
          isTaskLoading={getTaskClientQuery.isLoading}
        />
      }
    />
  );
};

export default SendTaskPanel;

const UserMessageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`;

const UserMessage = styled.div`
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: 0.5rem;
  padding: 0.5rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.75rem;
`;

const AgentMessageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const AgentMessage = styled.div`
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.75rem;
`;

function MessageComponent({ message }: { message: Message }) {
  const textParts = message.parts.filter((p) => p.type === "text");
  const fileParts = message.parts.filter((p) => p.type === "file");
  const isAgent = message.role === "agent";
  const MessageContainer = isAgent
    ? AgentMessageContainer
    : UserMessageContainer;
  const MessageLayout = isAgent ? AgentMessage : UserMessage;
  return (
    <MessageContainer>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <MessageLayout>
          {textParts.map((p) => {
            return <div>{p.text}</div>;
          })}
        </MessageLayout>
        {fileParts.map((p) => {
          return (
            <FilePartInInputArea
              key={p.file.name}
              filePart={p}
              canRemove={false}
              onRemove={() => {}}
            />
          );
        })}
      </div>
    </MessageContainer>
  );
}

const FilePartContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  width: fit-content;
  font-size: 0.8rem;
  gap: 0.5rem;
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: 0.05rem;
  padding-left: 0.3rem;
  padding-right: 0.3rem;
  padding-top: 0.1rem;
  padding-bottom: 0.1rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const FilePartInInputArea = ({
  filePart,
  canRemove = true,
  onRemove,
}: {
  filePart: FilePart;
  canRemove: boolean;
  onRemove: () => void;
}) => {
  const theme = useTheme();
  return (
    <FilePartContainer>
      <div>{filePart.file.name}</div>
      {canRemove && (
        <IoMdClose
          style={{ cursor: "pointer" }}
          color={theme.colors.error}
          onClick={() => {
            onRemove();
          }}
        />
      )}
    </FilePartContainer>
  );
};
