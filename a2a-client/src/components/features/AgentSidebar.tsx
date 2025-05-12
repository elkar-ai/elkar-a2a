import React, { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/api";
import styled from "styled-components";
import { IoSearch, IoAdd } from "react-icons/io5";
import { RiRobot2Line } from "react-icons/ri";
import {
  BsCheck2Circle,
  BsExclamationTriangle,
  BsXCircle,
} from "react-icons/bs";
import { useNavigate, useParams } from "react-router";
import CreateAgentModal from "./CreateAgentModal";
import SecondarySidebar from "../common/SecondarySidebar";
import { useUsers } from "../../hooks/useUsers";
import { UnpaginatedOutputApplicationUserOutputRecordsInner } from "../../../generated-api";
import { taskApi } from "../../api/api";

// Maintain existing styled components but only the ones that are specific to this sidebar
const AgentItem = styled.div<{ $isActive: boolean }>`
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ $isActive, theme }) =>
    $isActive ? theme.colors.surface : theme.colors.background};
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid
    ${({ $isActive, theme }) =>
      $isActive ? theme.colors.primary : theme.colors.border};

  &:hover {
    background: ${({ theme }) => theme.colors.surface};
    border-color: ${({ theme }) => theme.colors.border};
  }
`;

const AgentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const AgentName = styled.div`
  font-weight: 600;
  font-size: ${({ theme }) => theme.fontSizes.md};
`;

const StatusIcon = styled.div<{ status: "active" | "warning" | "error" }>`
  color: ${({ status, theme }) =>
    status === "active"
      ? theme.colors.success
      : status === "warning"
        ? theme.colors.warning
        : theme.colors.error};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const AgentDescription = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const AgentMeta = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const AgentsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const NoAgentsMessage = styled.div`
  padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: center;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  background: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  border: 1px dashed ${({ theme }) => theme.colors.border};
`;

const NoAgentsIcon = styled.div`
  font-size: 32px;
  color: ${({ theme }) => theme.colors.textSecondary};
  opacity: 0.5;
`;

const LoadingMessage = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: center;
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const ErrorMessage = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.error};
  text-align: center;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  background: ${({ theme }) => theme.colors.error}10;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.colors.error}20;
`;

const getAgentStatus = (agent: any): "active" | "warning" | "error" => {
  // This is a placeholder. In a real app, you'd determine status based on actual agent data
  if (agent.id % 3 === 0) return "error";
  if (agent.id % 3 === 1) return "warning";
  return "active";
};

const AgentSidebar: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const { id: selectedAgentId } = useParams<{ id: string }>();
  const { taskId } = useParams<{ taskId: string }>();

  // Fetch task data if we're on a task page
  const taskQuery = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => taskApi.epGetTask({ taskId: taskId || "" }),
    enabled: !!taskId,
  });

  // Get the agent ID either directly selected or from a task
  const effectiveAgentId = selectedAgentId || taskQuery.data?.agentId;

  const agentsQuery = useQuery({
    queryKey: ["agents"],
    queryFn: () => api.epRetrieveAgents(),
  });

  // Auto-select first agent if none selected
  useEffect(() => {
    const records = agentsQuery.data?.records;
    if (
      !effectiveAgentId &&
      !agentsQuery.isLoading &&
      records &&
      records.length > 0 &&
      !taskId // Don't auto-navigate if we're on a task page
    ) {
      navigate(`/agents/${records[0].id}`);
    }
  }, [
    effectiveAgentId,
    agentsQuery.data,
    agentsQuery.isLoading,
    navigate,
    taskId,
  ]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredAgents = React.useMemo(() => {
    const agents = agentsQuery.data?.records || [];
    if (!searchQuery) return agents;

    const lowerCaseQuery = searchQuery.toLowerCase();
    return agents.filter(
      (agent) =>
        agent.name.toLowerCase().includes(lowerCaseQuery) ||
        (agent.description &&
          agent.description.toLowerCase().includes(lowerCaseQuery)),
    );
  }, [agentsQuery.data, searchQuery]);

  const renderStatusIcon = (status: "active" | "warning" | "error") => {
    switch (status) {
      case "active":
        return <BsCheck2Circle size={18} />;
      case "warning":
        return <BsExclamationTriangle size={18} />;
      case "error":
        return <BsXCircle size={18} />;
    }
  };

  const actionButton = (
    <SecondarySidebar.ActionButton onClick={() => setIsModalOpen(true)}>
      <IoAdd size={16} />
      New Agent
    </SecondarySidebar.ActionButton>
  );

  const users = useUsers();
  const userMap = useMemo(() => {
    return users.data?.reduce(
      (acc, user) => {
        acc[user.id] = user;
        return acc;
      },
      {} as Record<string, UnpaginatedOutputApplicationUserOutputRecordsInner>,
    );
  }, [users.data]);

  return (
    <SecondarySidebar title="Agents" actionButton={actionButton}>
      <SecondarySidebar.SearchContainer>
        <SecondarySidebar.SearchIcon>
          <IoSearch size={16} />
        </SecondarySidebar.SearchIcon>
        <SecondarySidebar.SearchInput
          placeholder="Search..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </SecondarySidebar.SearchContainer>

      {agentsQuery.isLoading ? (
        <LoadingMessage>Loading agents...</LoadingMessage>
      ) : agentsQuery.isError ? (
        <ErrorMessage>
          Error loading agents: {agentsQuery.error.message}
        </ErrorMessage>
      ) : filteredAgents.length === 0 ? (
        <NoAgentsMessage>
          <NoAgentsIcon>
            <RiRobot2Line />
          </NoAgentsIcon>
          {searchQuery ? "No agents matching your search" : "No agents found"}
        </NoAgentsMessage>
      ) : (
        <AgentsList>
          {filteredAgents.map((agent) => {
            const status = getAgentStatus(agent);
            return (
              <AgentItem
                key={agent.id}
                $isActive={agent.id === effectiveAgentId}
                onClick={() => navigate(`/agents/${agent.id}`)}
              >
                <AgentHeader>
                  <AgentName>{agent.name}</AgentName>
                  <StatusIcon status={status}>
                    {renderStatusIcon(status)}
                  </StatusIcon>
                </AgentHeader>
                <AgentDescription>
                  {agent.description || "No description"}
                </AgentDescription>
                <AgentMeta>
                  {userMap?.[agent.createdBy]?.email &&
                    `Created by: ${userMap?.[agent.createdBy]?.email}`}
                </AgentMeta>
              </AgentItem>
            );
          })}
        </AgentsList>
      )}

      {isModalOpen && (
        <CreateAgentModal onClose={() => setIsModalOpen(false)} />
      )}
    </SecondarySidebar>
  );
};

export default AgentSidebar;
