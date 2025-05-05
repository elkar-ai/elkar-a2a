import React from "react";
import { AgentOutput } from "../../../../generated-api";
import {
  Card,
  InfoGrid,
  InfoItem,
  InfoLabel,
  InfoValue,
  Section,
} from "./styles";

interface DetailsSectionProps {
  agent: AgentOutput;
}

const DetailsSection: React.FC<DetailsSectionProps> = ({ agent }) => {
  return (
    <Card>
      <InfoGrid>
        <InfoItem>
          <InfoLabel>ID</InfoLabel>
          <InfoValue>{agent.id}</InfoValue>
        </InfoItem>
        <InfoItem>
          <InfoLabel>Created By</InfoLabel>
          <InfoValue>{agent.createdBy}</InfoValue>
        </InfoItem>
        <InfoItem>
          <InfoLabel>Name</InfoLabel>
          <InfoValue>{agent.name}</InfoValue>
        </InfoItem>
        <InfoItem>
          <InfoLabel>Status</InfoLabel>
          <InfoValue>{agent.isDeleted ? "Deleted" : "Active"}</InfoValue>
        </InfoItem>
      </InfoGrid>

      <Section>
        <InfoLabel>Description</InfoLabel>
        <InfoValue>{agent.description || "No description provided."}</InfoValue>
      </Section>
    </Card>
  );
};

export default DetailsSection;
