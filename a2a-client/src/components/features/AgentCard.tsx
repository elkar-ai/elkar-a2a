import React from "react";
import styled from "styled-components";
import { useUrl } from "../../contexts/urlContext";
import A2AClient from "../../services/a2aClient";
import { useQuery } from "@tanstack/react-query";

const PanelContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.md};
`;

const Title = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const Card = styled.div`
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.md};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const Section = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const SectionTitle = styled.h4`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const Label = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Value = styled.span`
  color: ${({ theme }) => theme.colors.text};
  font-weight: 500;
`;

const CapabilitiesList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const CapabilityItem = styled.li`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.text};
`;

const AgentCard: React.FC = () => {
  // Mock data - replace with actual data from your API
  const { endpoint } = useUrl();
  const api_client = new A2AClient(endpoint);
  const agentCardQuery = useQuery({
    queryKey: ["agentCard"],
    queryFn: () => api_client.getAgentCard(),
  });

  if (agentCardQuery.isLoading) {
    return <div>Loading...</div>;
  }

  if (agentCardQuery.isError) {
    return <div>Error: {agentCardQuery.error.message}</div>;
  }

  const agentData = agentCardQuery.data;

  if (!agentData) {
    return <div>No agent data</div>;
  }

  return (
    <PanelContainer>
      <Title>Agent Card</Title>
      <Card>
        <Section>
          <InfoRow>
            <Label>Name:</Label>
            <Value>{agentData.name}</Value>
          </InfoRow>
          <InfoRow>
            <Label>Description:</Label>
            <Value>{agentData.description}</Value>
          </InfoRow>
          <InfoRow>
            <Label>Version:</Label>
            <Value>{agentData.version}</Value>
          </InfoRow>
          <InfoRow>
            <Label>Provider:</Label>
            <Value>{agentData.provider?.organization}</Value>
          </InfoRow>
          <InfoRow>
            <Label>URL:</Label>
            <Value>{agentData.url}</Value>
          </InfoRow>

          <InfoRow>
            <Label>Documentation URL:</Label>
            <Value>{agentData.documentationUrl}</Value>
          </InfoRow>
        </Section>

        <Section>
          <SectionTitle>Capabilities</SectionTitle>
          <CapabilitiesList>
            {Object.entries(agentData.capabilities).map(([key, value]) => (
              <CapabilityItem key={key}>
                • {key}: {value ? "Yes" : "No"}
              </CapabilityItem>
            ))}
          </CapabilitiesList>
        </Section>
      </Card>
    </PanelContainer>
  );
};

export default AgentCard;
