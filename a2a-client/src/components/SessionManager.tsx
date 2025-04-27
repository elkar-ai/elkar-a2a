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

const SessionPanel = styled.div`
  background-color: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  transition: transform ${({ theme }) => theme.transitions.normal},
    box-shadow ${({ theme }) => theme.transitions.normal};

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }
`;

const Title = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.darkGray};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  padding-bottom: ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const SubTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.darkGray};
  margin: ${({ theme }) => theme.spacing.md} 0;
`;

const Button = styled.button`
  background: ${({ theme }) => theme.colors.gradient.primary};
  color: ${({ theme }) => theme.colors.white};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.fontSizes.md};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  width: 100%;
  font-weight: 500;
  box-shadow: ${({ theme }) => theme.shadows.sm};

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.md};
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(1px);
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.lightGray};
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const SaveButton = styled(Button)`
  background: ${({ theme }) => theme.colors.gradient.secondary};
  flex-shrink: 0;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;

const SessionControls = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const SaveSession = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.md};
  align-items: center;
`;

const Input = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.md};
  transition: all ${({ theme }) => theme.transitions.fast};
  box-shadow: ${({ theme }) => theme.shadows.sm};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: ${({ theme }) => theme.shadows.highlight};
  }
`;

const SessionList = styled.ul`
  list-style: none;
  margin-top: ${({ theme }) => theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  max-height: 200px;
  overflow-y: auto;
  padding-right: ${({ theme }) => theme.spacing.sm};
`;

interface SessionItemProps {
  active: boolean;
}

const SessionItem = styled.li<SessionItemProps>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background-color: ${({ active, theme }) =>
    active ? theme.colors.secondary + "15" : theme.colors.lightBg};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  border-left: 3px solid
    ${({ active, theme }) => (active ? theme.colors.secondary : "transparent")};
  box-shadow: ${({ active, theme }) => (active ? theme.shadows.sm : "none")};

  &:hover {
    background-color: ${({ active, theme }) =>
      active ? theme.colors.secondary + "20" : theme.colors.lightBg + "dd"};
    transform: translateX(2px);
  }
`;

const SessionName = styled.span`
  flex: 1;
  font-weight: 500;
`;

const DeleteButton = styled.button`
  background-color: transparent;
  color: ${({ theme }) => theme.colors.lightGray};
  padding: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-size: 1.25rem;
  line-height: 1;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background-color: ${({ theme }) => theme.colors.error};
    color: ${({ theme }) => theme.colors.white};
    transform: rotate(90deg);
  }
`;

const ActiveSession = styled.div`
  margin-top: ${({ theme }) => theme.spacing.lg};
`;

const SessionId = styled.p`
  font-family: monospace;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  word-break: break-all;
  background-color: ${({ theme }) => theme.colors.lightBg};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border-left: 3px solid ${({ theme }) => theme.colors.primary};
  box-shadow: ${({ theme }) => theme.shadows.sm} inset;
`;

const NoSessionsMessage = styled.p`
  color: ${({ theme }) => theme.colors.gray};
  font-style: italic;
  padding: ${({ theme }) => theme.spacing.md};
  text-align: center;
  background-color: ${({ theme }) => theme.colors.lightBg};
  border-radius: ${({ theme }) => theme.borderRadius.md};
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
    <SessionPanel>
      <Title>Sessions</Title>
      <SessionControls>
        <Button onClick={onCreateNewSession}>New Session</Button>
        {sessionId && (
          <SaveSession>
            <Input
              type="text"
              value={sessionName}
              onChange={(e) => onSessionNameChange(e.target.value)}
              placeholder="Session name"
            />
            <SaveButton onClick={onSaveSession}>Save</SaveButton>
          </SaveSession>
        )}
      </SessionControls>

      <SubTitle>Saved Sessions</SubTitle>
      {savedSessions.length === 0 ? (
        <NoSessionsMessage>No saved sessions</NoSessionsMessage>
      ) : (
        <SessionList>
          {savedSessions.map((session) => (
            <SessionItem
              key={session.id}
              active={sessionId === session.id}
              onClick={() => onLoadSession(session.id)}
            >
              <SessionName>{session.name}</SessionName>
              <DeleteButton
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(session.id);
                }}
              >
                ×
              </DeleteButton>
            </SessionItem>
          ))}
        </SessionList>
      )}

      <ActiveSession>
        <SubTitle>Active Session</SubTitle>
        <SessionId>{sessionId ? sessionId : "No active session"}</SessionId>
      </ActiveSession>
    </SessionPanel>
  );
};

export default SessionManager;
