import React from "react";
import styled, { keyframes } from "styled-components";
import { useUrl } from "../../contexts/UrlContext";
import A2AClient from "../../services/a2aClient";
import { useQuery } from "@tanstack/react-query";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const PanelContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.md};
  animation: ${fadeIn} 0.3s ease-out;
`;

const Title = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  font-weight: 600;
  letter-spacing: -0.5px;
`;

const Card = styled.div`
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const Section = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  padding-bottom: ${({ theme }) => theme.spacing.lg};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  &:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }
`;

const SectionTitle = styled.h4`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  font-weight: 500;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.xs} 0;
`;

const Label = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: 500;
`;

const Value = styled.span`
  color: ${({ theme }) => theme.colors.text};
  font-weight: 500;
  max-width: 60%;
  text-align: right;
  word-break: break-word;
`;

const CapabilitiesList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing.sm};
`;

const CapabilityItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm};
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
`;

const CapabilityStatus = styled.span<{ enabled: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${({ enabled, theme }) =>
    enabled ? theme.colors.success : theme.colors.error};
`;

const LoadingContainer = styled.div`
  padding: ${({ theme }) => theme.spacing.xl};
  text-align: center;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const LoadingShimmer = styled.div`
  height: 20px;
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.colors.surface} 25%,
    ${({ theme }) => theme.colors.background} 50%,
    ${({ theme }) => theme.colors.surface} 75%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s infinite;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const ErrorContainer = styled.div`
  padding: ${({ theme }) => theme.spacing.xl};
  text-align: center;
  color: ${({ theme }) => theme.colors.error};
  background-color: ${({ theme }) => theme.colors.error}10;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.colors.error}30;
`;

const AgentCard: React.FC = () => {
  const { endpoint } = useUrl();
  const api_client = new A2AClient(endpoint);
  const agentCardQuery = useQuery({
    queryKey: ["agentCard"],
    queryFn: () => api_client.getAgentCard(),
  });

  if (agentCardQuery.isLoading) {
    return (
      <PanelContainer>
        <Title>Agent Card</Title>
        <Card>
          <LoadingContainer>
            <LoadingShimmer />
            <LoadingShimmer />
            <LoadingShimmer />
          </LoadingContainer>
        </Card>
      </PanelContainer>
    );
  }

  if (agentCardQuery.isError) {
    return (
      <PanelContainer>
        <Title>Agent Card</Title>
        <Card>
          <ErrorContainer>
            <p>Unable to load agent information</p>
            <small>{agentCardQuery.error.message}</small>
          </ErrorContainer>
        </Card>
      </PanelContainer>
    );
  }

  const agentData = agentCardQuery.data;

  if (!agentData) {
    return (
      <PanelContainer>
        <Title>Agent Card</Title>
        <Card>
          <ErrorContainer>
            <p>No agent data available</p>
          </ErrorContainer>
        </Card>
      </PanelContainer>
    );
  }

  return (
    <PanelContainer>
      <Title>Agent Card</Title>
      <Card>
        <Section>
          <InfoRow>
            <Label>Name</Label>
            <Value>{agentData.name}</Value>
          </InfoRow>
          <InfoRow>
            <Label>Description</Label>
            <Value>{agentData.description}</Value>
          </InfoRow>
          <InfoRow>
            <Label>Version</Label>
            <Value>{agentData.version}</Value>
          </InfoRow>
          <InfoRow>
            <Label>Provider</Label>
            <Value>{agentData.provider?.organization}</Value>
          </InfoRow>
          <InfoRow>
            <Label>URL</Label>
            <Value>{agentData.url}</Value>
          </InfoRow>
          <InfoRow>
            <Label>Documentation</Label>
            <Value>{agentData.documentationUrl}</Value>
          </InfoRow>
        </Section>

        <Section>
          <SectionTitle>Capabilities</SectionTitle>
          <CapabilitiesList>
            {Object.entries(agentData.capabilities).map(([key, value]) => (
              <CapabilityItem key={key}>
                <CapabilityStatus enabled={value} />
                <span>{key}</span>
              </CapabilityItem>
            ))}
          </CapabilitiesList>
        </Section>
      </Card>
    </PanelContainer>
  );
};

export default AgentCard;
