import React from "react";
import styled from "styled-components";

interface Session {
  id: string;
  name: string;
}

interface SessionManagerProps {
  sessionId: string;
  sessionName: string;
  savedSessions: Session[];
  onSessionNameChange: (value: string) => void;
  onCreateNewSession: () => void;
  onSaveSession: () => void;
  onLoadSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
}

const PanelContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.md};
`;

const Title = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const InputGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Input = styled.input`
  flex: 1;
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

const SessionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  max-height: 200px;
  overflow-y: auto;
`;

const SessionItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.sm};
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
`;

const SessionName = styled.span`
  color: ${({ theme }) => theme.colors.text};
`;

const SessionActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const ActionButton = styled.button`
  color: ${({ theme }) => theme.colors.textSecondary};
  padding: ${({ theme }) => theme.spacing.xs};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  transition: all 0.2s ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.text};
  }

  &:last-child {
    color: ${({ theme }) => theme.colors.error};
  }
`;

const SessionManager: React.FC<SessionManagerProps> = ({
  sessionId,
  sessionName,
  savedSessions,
  onSessionNameChange,
  onCreateNewSession,
  onSaveSession,
  onLoadSession,
  onDeleteSession,
}) => {
  return (
    <PanelContainer>
      <Title>Sessions</Title>
      <InputGroup>
        <Input
          type="text"
          value={sessionName}
          onChange={(e) => onSessionNameChange(e.target.value)}
          placeholder="Session name"
        />
        <Button onClick={onSaveSession} disabled={!sessionName.trim()}>
          Save
        </Button>
      </InputGroup>
      <Button onClick={onCreateNewSession}>New Session</Button>
      {savedSessions.length > 0 && (
        <SessionsList>
          {savedSessions.map((session) => (
            <SessionItem key={session.id}>
              <SessionName>{session.name}</SessionName>
              <SessionActions>
                <ActionButton onClick={() => onLoadSession(session.id)}>
                  Load
                </ActionButton>
                <ActionButton onClick={() => onDeleteSession(session.id)}>
                  Delete
                </ActionButton>
              </SessionActions>
            </SessionItem>
          ))}
        </SessionsList>
      )}
    </PanelContainer>
  );
};

export default SessionManager;
