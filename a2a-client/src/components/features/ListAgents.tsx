import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { TreeTable } from "../common/AppTable";
import { api } from "../../api/api";
import { AgentOutput } from "../../../generated-api";
import styled from "styled-components";
import CreateAgentModal from "./CreateAgentModal";
import { useNavigate } from "react-router";

const ActionsContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${({ theme }) => `${theme.colors.primary}dd`};
  }
`;

const ErrorMessage = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme }) => theme.colors.error}10;
  border: 1px solid ${({ theme }) => theme.colors.error}30;
  color: ${({ theme }) => theme.colors.error};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

export function ListAgents() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const agentsQuery = useQuery({
    queryKey: ["agents"],
    queryFn: () => api.epRetrieveAgents(),
  });

  useEffect(() => {
    // Debug logging
    console.log("Agents query data:", agentsQuery.data);
    console.log("Agents query error:", agentsQuery.error);
    console.log("Agents query status:", agentsQuery.status);
  }, [agentsQuery.data, agentsQuery.error, agentsQuery.status]);

  const columns = [
    {
      key: "name",
      title: "Name",
      render: (agent: AgentOutput) => {
        return <div>{agent.name}</div>;
      },
    },
    {
      key: "description",
      title: "Description",
      render: (agent: AgentOutput) => {
        return <div>{agent.description || "-"}</div>;
      },
    },
    {
      key: "id",
      title: "ID",
      render: (agent: AgentOutput) => {
        return <div>{agent.id}</div>;
      },
    },
  ];

  // Check if there's an API error
  if (agentsQuery.isError) {
    return (
      <>
        <ActionsContainer>
          <AddButton onClick={() => setIsModalOpen(true)}>
            + Add New Agent
          </AddButton>
        </ActionsContainer>
        <ErrorMessage>
          Error loading agents: {agentsQuery.error.message}
        </ErrorMessage>
        {isModalOpen && (
          <CreateAgentModal onClose={() => setIsModalOpen(false)} />
        )}
      </>
    );
  }

  // Determine where to get the agents from in the response structure
  const agents = agentsQuery.data?.records || [];

  return (
    <>
      <ActionsContainer>
        <AddButton onClick={() => setIsModalOpen(true)}>
          + Add New Agent
        </AddButton>
      </ActionsContainer>
      <TreeTable
        data={
          agents.map((agent) => ({
            data: agent,
            hasChildren: false,
          })) || []
        }
        onRowClick={(agent) => {
          console.log("Selected agent:", agent);
          navigate(`/agents/${agent.id}`);
        }}
        columns={columns}
      />
      {isModalOpen && (
        <CreateAgentModal onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
}

export default ListAgents;
