import React from "react";
import { GlobalStyles } from "../styles/GlobalStyles";
import styled from "styled-components";
import { Routes, Route, BrowserRouter } from "react-router";

import Layout from "./layouts/Layout";
import MethodNav from "./features/MethodNav";
import SendTaskPanel from "./features/SendTaskPanel";
import AgentCard from "./features/AgentCard";
import { AppThemeProvider } from "../styles/ThemeProvider";
import { useUrl } from "../contexts/UrlContext";
import { ListTasks } from "./features";

const ServerUrlContainer = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
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

const SidebarSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const SidebarSectionTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  font-weight: 600;
`;

const App: React.FC = () => {
  const { endpoint, setEndpoint } = useUrl();

  return (
    <BrowserRouter>
      <AppThemeProvider>
        <GlobalStyles />
        <Layout
          sidebar={
            <>
              <SidebarSection>
                <ServerUrlContainer>
                  <ServerUrlLabel>Server URL</ServerUrlLabel>
                  <ServerUrlInput
                    type="text"
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    placeholder="Enter server URL"
                  />
                </ServerUrlContainer>
              </SidebarSection>
              <SidebarSection>
                <SidebarSectionTitle>Navigation</SidebarSectionTitle>
                <MethodNav />
              </SidebarSection>
            </>
          }
        >
          <Routes>
            <Route path="/" element={<SendTaskPanel />} />
            <Route path="/send-task" element={<SendTaskPanel />} />
            <Route path="/agent-card" element={<AgentCard />} />
            <Route path="/list-tasks" element={<ListTasks />} />
          </Routes>
        </Layout>
      </AppThemeProvider>
    </BrowserRouter>
  );
};

export default App;
