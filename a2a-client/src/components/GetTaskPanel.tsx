import React from "react";
import styled from "styled-components";

interface GetTaskPanelProps {
  taskId: string;
  loading: boolean;
  onTaskIdChange: (taskId: string) => void;
  onGetTask: () => void;
  onCancelTask: () => void;
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

const FormGroup = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const Label = styled.label`
  display: block;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.fontSizes.md};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Button = styled.button`
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  font-size: ${({ theme }) => theme.fontSizes.md};
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryHover};
  }

  &:disabled {
    background-color: ${({ theme }) => theme.colors.lightGray};
    cursor: not-allowed;
  }
`;

const CancelButton = styled(Button)`
  background-color: ${({ theme }) => theme.colors.red};

  &:hover {
    background-color: ${({ theme }) => theme.colors.error};
  }
`;

const GetTaskPanel: React.FC<GetTaskPanelProps> = ({
  taskId,
  loading,
  onTaskIdChange,
  onGetTask,
  onCancelTask,
}) => {
  return (
    <Panel>
      <Title>Get Task</Title>
      <FormGroup>
        <Label htmlFor="task-id">Task ID:</Label>
        <Input
          id="task-id"
          type="text"
          value={taskId}
          onChange={(e) => onTaskIdChange(e.target.value)}
          placeholder="Enter task ID"
        />
      </FormGroup>
      <ButtonGroup>
        <Button onClick={onGetTask} disabled={loading}>
          {loading ? "Loading..." : "Get Task"}
        </Button>
        <CancelButton onClick={onCancelTask} disabled={loading}>
          {loading ? "Canceling..." : "Cancel Task"}
        </CancelButton>
      </ButtonGroup>
    </Panel>
  );
};

export default GetTaskPanel;
