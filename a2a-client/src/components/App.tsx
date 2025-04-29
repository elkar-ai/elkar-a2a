import React, { useState } from "react";
import { GlobalStyles } from "../styles/GlobalStyles";

import styled from "styled-components";

import ThemeToggle from "./common/ThemeToggle";
import GetTaskPanel from "./features/GetTaskPanel";
import Layout from "./layouts/Layout";
import MethodNav from "./features/MethodNav";
import StreamingTaskPanel from "./features/StreamingTaskPanel";
import SendTaskPanel from "./features/SendTaskPanel";
import AgentCard from "./features/AgentCard";
import { AppThemeProvider } from "../styles/ThemeProvider";
import { useUrl } from "../contexts/UrlContext";

// Define tab types
type TabType = "sendTask" | "getTask" | "streaming" | "agentCard";

const ServerUrlInput = styled.input`
  width: 100%;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const App: React.FC = () => {
  const { endpoint, setEndpoint } = useUrl();

  const [activeTab, setActiveTab] = useState<TabType>("sendTask");

  // Render main content based on active tab
  const renderMainContent = () => {
    if (activeTab === "sendTask") {
      return <SendTaskPanel />;
    } else if (activeTab === "getTask") {
      return <GetTaskPanel />;
    } else if (activeTab === "streaming") {
      return <StreamingTaskPanel />;
    } else if (activeTab === "agentCard") {
      return <AgentCard />;
    }
  };

  return (
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
            <MethodNav activeTab={activeTab} onTabChange={setActiveTab} />
            <ThemeToggle />
          </>
        }
      >
        {renderMainContent()}
      </Layout>
    </AppThemeProvider>
  );
};

export default App;
