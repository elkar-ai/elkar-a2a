import React, { useState, useEffect } from "react";
import styled, { css } from "styled-components";
import { useUrl } from "../../contexts/UrlContext";

import SendTaskPanel from "../features/SendTaskPanel";
import AgentCard from "../features/AgentCard";
import A2AClient from "../../services/a2aClient";

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;

  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.md};
`;

const ServerUrlContainer = styled.div`
  /* Using Section for overall padding and background */
  height: fit-content;
`;

const ServerUrlLabel = styled.label`
  display: block;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  font-weight: 500;
`;

const ServerUrlInput = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  transition: all 0.2s ease;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}20;
    outline: none;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const ErrorMessage = styled.div`
  margin-top: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background-color: transparent;
  color: ${({ theme }) => theme.colors.error};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const TabsContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

interface TabButtonProps {
  active?: boolean;
}

const TabButton = styled.button<TabButtonProps>`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background-color: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }

  ${({ active, theme }) =>
    active &&
    css`
      color: ${theme.colors.primary};
      border-bottom-color: ${theme.colors.primary};
      font-weight: 600;
    `}
`;

const TabContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: ${({ theme }) =>
    theme.spacing.lg}; /* To maintain spacing between sections within a tab */
`;

const A2ADebuggerPage: React.FC = () => {
  const { endpoint, setEndpoint } = useUrl();
  const [activeTab, setActiveTab] = useState<"agent" | "task">("agent");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isCheckingUrl, setIsCheckingUrl] = useState<boolean>(true);
  const a2aApiEndpoint = new A2AClient(endpoint);
  useEffect(() => {
    const checkUrl = async () => {
      if (!endpoint || !endpoint.startsWith("http")) {
        setUrlError("Please enter a valid URL starting with http or https.");
        setIsCheckingUrl(false);
        return;
      }

      setIsCheckingUrl(true);
      setUrlError(null);

      try {
        // Attempting to fetch agent data as a more specific check
        await a2aApiEndpoint.getAgentCard();
      } catch (error) {
        console.error(`A2A Error fetching from ${endpoint}:`, error);

        setUrlError(
          `Failed to fetch from ${endpoint}. Check network, CORS, or if server is down.`
        );
      }
      setIsCheckingUrl(false);
    };

    // Debounce the check slightly to avoid spamming requests while typing
    const timeoutId = setTimeout(checkUrl, 500);
    return () => clearTimeout(timeoutId);
  }, [endpoint]);

  return (
    <PageContainer>
      <Section>
        <ServerUrlContainer>
          <ServerUrlLabel>Server URL</ServerUrlLabel>
          <ServerUrlInput
            type="text"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder="Enter server URL"
          />
        </ServerUrlContainer>
        {urlError && <ErrorMessage>{urlError}</ErrorMessage>}
      </Section>
      {(!urlError || isCheckingUrl) && (
        <>
          <TabsContainer>
            <TabButton
              active={activeTab === "agent"}
              onClick={() => setActiveTab("agent")}
            >
              Agent
            </TabButton>
            <TabButton
              active={activeTab === "task"}
              onClick={() => setActiveTab("task")}
            >
              Task Debugger
            </TabButton>
          </TabsContainer>

          <TabContentContainer>
            {activeTab === "agent" && <AgentCard />}
            {activeTab === "task" && <SendTaskPanel />}
          </TabContentContainer>
        </>
      )}
    </PageContainer>
  );
};

export default A2ADebuggerPage;
