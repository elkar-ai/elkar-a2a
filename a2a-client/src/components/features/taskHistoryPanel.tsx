import styled from "styled-components";
import { Message } from "../../types/a2aTypes";

const Container = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

interface TaskHistoryPanelProps {
  messages: Message[];
}

const TaskHistoryPanel: React.FC<TaskHistoryPanelProps> = ({ messages }) => {
  return (
    <Container>
      {messages.map((m, i) => (
        <MessageComponent key={i} message={m} />
      ))}
    </Container>
  );
};

export default TaskHistoryPanel;

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
