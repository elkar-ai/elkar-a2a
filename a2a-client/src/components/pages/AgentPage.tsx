import React from "react";
import { useParams } from "react-router";
import SecondarySidebarLayout from "../layouts/SecondarySidebarLayout";
import { AgentSidebar, AgentDashboard } from "../features";
import AgentDetail from "./agent-detail";

const AgentPage: React.FC = () => {
  const { id: agentId } = useParams<{ id: string }>();

  return (
    <SecondarySidebarLayout secondarySidebar={<AgentSidebar />}>
      {agentId ? <AgentDetail /> : <></>}
    </SecondarySidebarLayout>
  );
};

export default AgentPage;
