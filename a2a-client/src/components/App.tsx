import React from "react";
import { GlobalStyles } from "../styles/GlobalStyles";
import styled from "styled-components";
import { Routes, Route, BrowserRouter } from "react-router";

import ThemeToggle from "./common/ThemeToggle";

import Layout from "./layouts/Layout";
import MethodNav from "./features/MethodNav";

import SendTaskPanel from "./features/SendTaskPanel";
import AgentCard from "./features/AgentCard";
import { AppThemeProvider } from "../styles/ThemeProvider";
import { useUrl } from "../contexts/UrlContext";
import { ListTasks } from "./features";

const ServerUrlInput = styled.input`
  width: 100%;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
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
              <ServerUrlInput
                type="text"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="Server URL"
              />
              <MethodNav />
              <ThemeToggle />
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
