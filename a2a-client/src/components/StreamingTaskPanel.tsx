import React from "react";
import styled from "styled-components";

interface StreamingTaskPanelProps {
  message: string;
  isStreaming: boolean;
  streamingUpdates: string[];
  onMessageChange: (message: string) => void;
  onStreamTask: () => void;
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

const TextArea = styled.textarea`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.fontSizes.md};
  min-height: 120px;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
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

const StreamingUpdates = styled.div`
  margin-top: ${({ theme }) => theme.spacing.lg};
`;

const SubTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.darkGray};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const UpdatesContainer = styled.div`
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background-color: ${({ theme }) => theme.colors.lightBg};
`;

const UpdateItem = styled.pre`
  margin: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm};
  background-color: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  overflow-x: auto;
`;

const StreamingTaskPanel: React.FC<StreamingTaskPanelProps> = ({
  message,
  isStreaming,
  streamingUpdates,
  onMessageChange,
  onStreamTask,
}) => {
  return (
    <Panel>
      <Title>Streaming Task</Title>
      <FormGroup>
        <Label htmlFor="streaming-message">Message:</Label>
        <TextArea
          id="streaming-message"
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          placeholder="Enter your message for streaming"
          rows={4}
        />
      </FormGroup>
      <Button onClick={onStreamTask} disabled={isStreaming}>
        {isStreaming ? "Streaming..." : "Start Streaming"}
      </Button>

      {streamingUpdates.length > 0 && (
        <StreamingUpdates>
          <SubTitle>Streaming Updates</SubTitle>
          <UpdatesContainer>
            {streamingUpdates.map((update, index) => (
              <UpdateItem key={index}>{update}</UpdateItem>
            ))}
          </UpdatesContainer>
        </StreamingUpdates>
      )}
    </Panel>
  );
};

export default StreamingTaskPanel;
