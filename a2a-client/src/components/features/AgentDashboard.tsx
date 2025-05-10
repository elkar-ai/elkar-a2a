import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api, taskApi } from "../../api/api";
import styled from "styled-components";
import { TreeTable } from "../common/AppTable";
import { useNavigate } from "react-router";
import { AgentOutput } from "../../../generated-api";

const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
  width: 100%;
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  font-weight: 600;
`;

const CardsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
`;

const AgentCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => theme.spacing.lg};
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.md};
    border-color: ${({ theme }) => theme.colors.primary}50;
  }
`;

const CardTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const CardDescription = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const TaskCount = styled.span`
  background: ${({ theme }) => theme.colors.primary}20;
  color: ${({ theme }) => theme.colors.primary};
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-weight: 500;
`;

const IdLabel = styled.span`
  opacity: 0.6;
`;

const ErrorMessage = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme }) => theme.colors.error}10;
  border: 1px solid ${({ theme }) => theme.colors.error}30;
  color: ${({ theme }) => theme.colors.error};
  border-radius: ${({ theme }) => theme.borderRadius.md};
`;

const LoadingMessage = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: center;
`;

const NoDataMessage = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  text-align: center;
  color: ${({ theme }) => theme.colors.textSecondary};
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

interface AgentDashboardProps {
  selectedAgentId?: string;
}

const AgentDashboard: React.FC<AgentDashboardProps> = ({ selectedAgentId }) => {
  const navigate = useNavigate();

  // Query to fetch the list of agents
  const agentsQuery = useQuery({
    queryKey: ["agents"],
    queryFn: () => api.epRetrieveAgents(),
  });

  // Query to fetch recent tasks
  const tasksQuery = useQuery({
    queryKey: ["recent-tasks"],
    queryFn: () =>
      taskApi.epRetrieveTasks({
        retrieveTasksInput: {
          pagination: {
            perPage: 5,
          },
        },
      }),
  });

  // Handle loading and error states
  if (agentsQuery.isLoading) {
    return <LoadingMessage>Loading agents...</LoadingMessage>;
  }

  if (agentsQuery.isError) {
    return (
      <ErrorMessage>
        Error loading agents: {agentsQuery.error.message}
      </ErrorMessage>
    );
  }

  const agents = agentsQuery.data?.records || [];

  // Create columns for the tasks table
  const taskColumns = [
    {
      key: "taskId",
      title: "Task ID",
      render: (task: any) => <div>{task.id}</div>,
    },
    {
      key: "agent",
      title: "Agent",
      render: (task: any) => <div>{task.agentName || "Unknown"}</div>,
    },
    {
      key: "status",
      title: "Status",
      render: (task: any) => <div>{task.status}</div>,
    },
    {
      key: "createdAt",
      title: "Created At",
      render: (task: any) => (
        <div>{new Date(task.createdAt).toLocaleString()}</div>
      ),
    },
  ];

  return (
    <DashboardContainer>
      <div>
        <SectionTitle>Your Agents</SectionTitle>
        {agents.length === 0 ? (
          <NoDataMessage>
            No agents found. Create your first agent to get started.
          </NoDataMessage>
        ) : (
          <CardsContainer>
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                onClick={() => navigate(`/agents/${agent.id}`)}
              >
                <CardTitle>{agent.name}</CardTitle>
                <CardDescription>
                  {agent.description || "No description provided"}
                </CardDescription>
                <CardFooter>
                  <IdLabel>ID: {agent.id}</IdLabel>
                  <TaskCount>0 Tasks</TaskCount>
                </CardFooter>
              </AgentCard>
            ))}
          </CardsContainer>
        )}
      </div>

      <div>
        <SectionTitle>Recent Tasks</SectionTitle>
        {tasksQuery.isLoading ? (
          <LoadingMessage>Loading recent tasks...</LoadingMessage>
        ) : tasksQuery.isError ? (
          <ErrorMessage>
            Error loading tasks: {tasksQuery.error.message}
          </ErrorMessage>
        ) : tasksQuery.data?.records?.length === 0 ? (
          <NoDataMessage>
            No tasks found. Start interacting with your agents to create tasks.
          </NoDataMessage>
        ) : (
          <TreeTable
            data={(tasksQuery.data?.records || []).map((task) => ({
              data: task,
              hasChildren: false,
            }))}
            onRowClick={(task) => navigate(`/task/${task.id}`)}
            columns={taskColumns}
          />
        )}
      </div>
    </DashboardContainer>
  );
};

export default AgentDashboard;
