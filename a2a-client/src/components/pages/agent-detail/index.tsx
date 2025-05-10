import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../api/api";
import {
  Header,
  Title,
  Description,
  MetaInfo,
  StatusIndicator,
  BackButton,
  TabsContainer,
  Tab,
  Section,
  SectionTitle,
  CardsContainer,
  Card,
  CardLabel,
  CardValue,
  MetricsSection,
  MetricsHeader,
  MetricsTitle,
  MetricsSubtitle,
  MetricsContent,
  ErrorMessage,
} from "./styles";

import TasksSection from "./TasksSection";
import ApiKeySection from "./ApiKeySection";
import { useUsers } from "../../../hooks/useUsers";
import { UnpaginatedOutputApplicationUserOutputRecordsInner } from "../../../../generated-api";

const AgentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    "details" | "tasks" | "connections" | "api"
  >("details");
  const users = useUsers();

  // Query for agent details
  const agentQuery = useQuery({
    queryKey: ["agent", id],
    queryFn: () => api.epRetrieveAgent({ id: id! }),
    enabled: !!id,
  });

  const userMap = useMemo(() => {
    return users.data?.reduce(
      (acc, user) => {
        acc[user.id] = user;
        return acc;
      },
      {} as Record<string, UnpaginatedOutputApplicationUserOutputRecordsInner>,
    );
  }, [users.data]);

  if (agentQuery.isLoading) {
    return <div>Loading agent details...</div>;
  }

  if (agentQuery.isError) {
    return (
      <div>
        <ErrorMessage>
          Error loading agent: {(agentQuery.error as Error).message}
        </ErrorMessage>
        <BackButton onClick={() => navigate("/agents")}>
          Back to Agents
        </BackButton>
      </div>
    );
  }

  // Create enhanced agent with defaults for missing fields
  const agent = agentQuery.data!;

  return (
    <div>
      <Header>
        <div>
          <Title>{agent.name}</Title>
          <Description>
            {agent.description || "No description provided"}
          </Description>
          <MetaInfo>
            ID: {agent.id} • Created by: {userMap?.[agent.createdBy]?.email}
          </MetaInfo>
        </div>
      </Header>

      <TabsContainer>
        <Tab
          active={activeTab === "details"}
          onClick={() => setActiveTab("details")}
        >
          Overview
        </Tab>
        <Tab
          active={activeTab === "tasks"}
          onClick={() => setActiveTab("tasks")}
        >
          Tasks
        </Tab>
        <Tab
          active={activeTab === "connections"}
          onClick={() => setActiveTab("connections")}
        >
          Connections
        </Tab>
        <Tab active={activeTab === "api"} onClick={() => setActiveTab("api")}>
          API Keys
        </Tab>
      </TabsContainer>

      {activeTab === "details" && (
        <>
          <Section>
            <SectionTitle>Agent Details</SectionTitle>
            <CardsContainer>
              <Card>
                <CardLabel>Type</CardLabel>
                {/* <CardValue>{agent.type}</CardValue> */}
              </Card>
              <Card>
                <CardLabel>Created By</CardLabel>
                <CardValue>
                  {userMap?.[agent.createdBy]?.email || "Unknown"}
                </CardValue>
              </Card>
              <Card>
                <CardLabel>Status</CardLabel>
                <CardValue>{agent.isDeleted ? "Deleted" : "Active"}</CardValue>
              </Card>
              <Card>
                <CardLabel>Tasks Executed</CardLabel>
                <CardValue>{10}</CardValue>
              </Card>
            </CardsContainer>
          </Section>

          <MetricsSection>
            <MetricsHeader>
              <MetricsTitle>Agent Metrics</MetricsTitle>
              <MetricsSubtitle>
                Performance statistics and usage metrics
              </MetricsSubtitle>
            </MetricsHeader>
            <MetricsContent>
              Metrics functionality will be implemented in a future update.
            </MetricsContent>
          </MetricsSection>
        </>
      )}
      {activeTab === "tasks" && <TasksSection />}
      {activeTab === "connections" && (
        <div>Connections functionality coming soon</div>
      )}
      {activeTab === "api" && <ApiKeySection />}
    </div>
  );
};

export default AgentDetail;
