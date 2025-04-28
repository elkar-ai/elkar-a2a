import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import styled from "styled-components";
import { TaskSendParams } from "../../types/a2aTypes";
import { useUrl } from "../../contexts/urlContext";
import A2AClient from "../../services/a2aClient";
import SplitContentLayout from "../layouts/SplitContentLayout";
import TaskResultPanel from "./TaskResultPanel";
import { v4 as uuidv4 } from "uuid";
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

const SendTaskPanel = () => {
  const [taskSendParams, setTaskSendParams] = useState<TaskSendParams>({
    message: {
      role: "user",
      parts: [
        {
          type: "text",
          text: "",
        },
      ],
    },
    sessionId: "",
    id: "",
  });

  const { endpoint } = useUrl();

  const apiClient = new A2AClient(endpoint);

  const sendQueryMutation = useMutation({
    mutationFn: (params: TaskSendParams) => {
      return apiClient.sendTask(params);
    },
  });
  return (
    <SplitContentLayout
      input={
        <PanelContainer>
          <TextArea
            value={taskSendParams.message.parts[0].text}
            onChange={(e) =>
              setTaskSendParams({
                ...taskSendParams,
                message: {
                  ...taskSendParams.message,
                  parts: [{ type: "text", text: e.target.value }],
                },
              })
            }
            placeholder="Enter your message"
            disabled={sendQueryMutation.isPending}
          />
          <Button
            onClick={() =>
              sendQueryMutation.mutate({
                ...taskSendParams,
                id: uuidv4(),
                sessionId: uuidv4(),
              })
            }
            disabled={
              sendQueryMutation.isPending ||
              !taskSendParams.message.parts[0].text.trim()
            }
          >
            {sendQueryMutation.isPending ? "Sending..." : "Send Task"}
          </Button>
        </PanelContainer>
      }
      output={
        sendQueryMutation.data && (
          <TaskResultPanel task={sendQueryMutation.data} />
        )
      }
    />
  );
};

export default SendTaskPanel;
