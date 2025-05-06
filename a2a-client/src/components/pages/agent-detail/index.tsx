import React, { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../api/api";
import {
  PageContainer,
  Header,
  Title,
  BackButton,
  TabsContainer,
  Tab,
  ErrorMessage,
} from "./styles";

import DetailsSection from "./DetailsSection";
import TasksSection from "./TasksSection";
import ApiKeySection from "./ApiKeySection";

const AgentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"details" | "tasks" | "api">(
    "details"
  );

  // Query for agent details
  const agentQuery = useQuery({
    queryKey: ["agent", id],
    queryFn: () => api.epRetrieveAgent({ id: id! }),
    enabled: !!id,
  });

  if (agentQuery.isLoading) {
    return <PageContainer>Loading agent details...</PageContainer>;
  }

  if (agentQuery.isError) {
    return (
      <PageContainer>
        <ErrorMessage>
          Error loading agent: {(agentQuery.error as Error).message}
        </ErrorMessage>
        <BackButton onClick={() => navigate("/list-agents")}>
          Back to Agents
        </BackButton>
      </PageContainer>
    );
  }

  const agent = agentQuery.data!;

  return (
    <PageContainer>
      <Header>
        <Title>{agent.name}</Title>
        <BackButton onClick={() => navigate("/list-agents")}>
          Back to Agents
        </BackButton>
      </Header>

      <TabsContainer>
        <Tab
          active={activeTab === "details"}
          onClick={() => setActiveTab("details")}
        >
          Details
        </Tab>
        <Tab
          active={activeTab === "tasks"}
          onClick={() => setActiveTab("tasks")}
        >
          Tasks
        </Tab>
        <Tab active={activeTab === "api"} onClick={() => setActiveTab("api")}>
          API Keys
        </Tab>
      </TabsContainer>

      {activeTab === "details" && <DetailsSection agent={agent} />}
      {activeTab === "tasks" && <TasksSection />}
      {activeTab === "api" && <ApiKeySection />}
    </PageContainer>
  );
};

export default AgentDetail;
