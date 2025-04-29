import { useState } from "react";
import styled from "styled-components";
import { TaskIdParams } from "../../types/a2aTypes";
import A2AClient from "../../services/a2aClient";

import { useMutation } from "@tanstack/react-query";
import TaskResultPanel from "./TaskResultPanel";
import SplitContentLayout from "../layouts/SplitContentLayout";
import ErrorMessage from "../common/ErrorMessage";
import { useUrl } from "../../contexts/UrlContext";

const PanelContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const InputGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
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

  &.cancel {
    background-color: ${({ theme }) => theme.colors.error};
  }
`;

const GetTaskPanel = () => {
  const [taskIdParams, setTaskIdParams] = useState<TaskIdParams>({
    id: "",
  });
  const { endpoint } = useUrl();
  const api_client = new A2AClient(endpoint);
  const getTaskMutation = useMutation({
    mutationFn: (taskIdParams: TaskIdParams) =>
      api_client.getTask(taskIdParams.id),
  });

  const cancelTaskMutation = useMutation({
    mutationFn: (taskIdParams: TaskIdParams) =>
      api_client.cancelTask(taskIdParams),
  });
  return (
    <SplitContentLayout
      input={
        <PanelContainer>
          <InputGroup>
            <Input
              type="text"
              value={taskIdParams.id}
              onChange={(e) =>
                setTaskIdParams({ ...taskIdParams, id: e.target.value })
              }
              placeholder="Enter task ID"
              disabled={getTaskMutation.isPending}
            />
            <Button
              onClick={() => getTaskMutation.mutate(taskIdParams)}
              disabled={getTaskMutation.isPending || !taskIdParams.id.trim()}
            >
              {getTaskMutation.isPending ? "Loading..." : "Get Task"}
            </Button>
            <Button
              className="cancel"
              onClick={() => cancelTaskMutation.mutate(taskIdParams)}
              disabled={cancelTaskMutation.isPending}
            >
              Cancel Task
            </Button>
          </InputGroup>
        </PanelContainer>
      }
      output={
        <>
          {getTaskMutation.data && (
            <TaskResultPanel task={getTaskMutation.data} />
          )}
          {getTaskMutation.error && (
            <ErrorMessage message={getTaskMutation.error.name} />
          )}
        </>
      }
    />
  );
};

export default GetTaskPanel;
