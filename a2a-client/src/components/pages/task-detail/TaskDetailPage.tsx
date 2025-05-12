import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router";
import styled from "styled-components";
import { useQuery } from "@tanstack/react-query";

import { FullTaskPanel } from "../../features/TaskResultPanel";
import { taskApi } from "../../../api/api";
import { TaskEventsPanel } from "../../features/TaskEventsPanel";
import TaskHistoryPanel from "../../features/taskHistoryPanel";
import SplitContentLayout from "../../layouts/SplitContentLayout";
import { Task } from "../../../types/a2aTypes";
import SecondarySidebarLayout from "../../layouts/SecondarySidebarLayout";
import { AgentSidebar } from "../../features";

// Styled components

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 6px;
  background-color: transparent;
  border: 1px solid ${({ theme }) => theme.colors.border};
  cursor: pointer;
  font-size: 14px;

  &:hover {
    background-color: ${({ theme }) => theme.colors.background};
  }

  &:before {
    content: "";
    display: inline-block;
    width: 16px;
    height: 16px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cline x1='19' y1='12' x2='5' y2='12'%3E%3C/line%3E%3Cpolyline points='12 19 5 12 12 5'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: center;
    margin-right: 8px;
  }
`;

const TabContainer = styled.div`
  display: flex;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  margin-bottom: 24px;
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 12px 24px;
  background-color: transparent;
  border: none;
  border-bottom: 2px solid
    ${({ active, theme }) => (active ? theme.colors.primary : "transparent")};
  color: ${({ active, theme }) =>
    active ? theme.colors.primary : theme.colors.text};
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const ComingSoonContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  text-align: center;
  width: 100%;
  height: 100%;
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const ComingSoonLabel = styled.div`
  font-size: 18px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 8px;
`;

const ComingSoonDescription = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};
  opacity: 0.7;
`;

// Tabs enum
enum TabType {
  DETAILS = "details",
  AUDIT = "audit",
  EVENTS = "events",
}

const Container = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const ContentContainer = styled.div`
  flex: 1;
  display: flex;
  overflow: auto;
  min-height: 0;
`;

const TaskDetailPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const tab = searchParams.get("tab");
    return tab && Object.values(TabType).includes(tab as TabType)
      ? (tab as TabType)
      : TabType.DETAILS;
  });

  const taskQuery = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => taskApi.epGetTask({ taskId: taskId || "" }),
    enabled: !!taskId,
  });

  const handleBack = () => {
    navigate(`/agents/${taskQuery.data?.agentId}`);
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set("tab", tab);
      return newParams;
    });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case TabType.DETAILS:
        return (
          <SplitContentLayout
            input={
              <TaskHistoryPanel
                messages={taskQuery.data?.a2aTask?.history || []}
              />
            }
            output={
              <>
                {taskQuery.data?.a2aTask && (
                  <FullTaskPanel
                    task={taskQuery.data.a2aTask as Task}
                    canCancel={false}
                    showStreaming={false}
                    streamingEvents={[]}
                    isCurrentlyStreaming={false}
                    isStreamingActive={false}
                    taskError={null}
                    isTaskLoading={false}
                  />
                )}
              </>
            }
          />
        );
      case TabType.AUDIT:
        return (
          <ComingSoonContainer>
            <ComingSoonLabel>Audit Logs Coming Soon</ComingSoonLabel>
            <ComingSoonDescription>
              Track all actions and changes made to this task with detailed
              audit logs.
            </ComingSoonDescription>
          </ComingSoonContainer>
        );
      case TabType.EVENTS:
        return taskId ? <TaskEventsPanel taskId={taskId} /> : null;
      default:
        return null;
    }
  };

  return (
    <SecondarySidebarLayout secondarySidebar={<AgentSidebar />}>
      <Container>
        <Header>
          <div style={{ display: "flex", alignItems: "center" }}>
            <BackButton onClick={handleBack}>Back</BackButton>
            <Title style={{ marginLeft: "16px" }}>Task Details</Title>
          </div>
        </Header>

        <TabContainer>
          <Tab
            active={activeTab === TabType.DETAILS}
            onClick={() => handleTabChange(TabType.DETAILS)}
          >
            Details
          </Tab>
          <Tab
            active={activeTab === TabType.EVENTS}
            onClick={() => handleTabChange(TabType.EVENTS)}
          >
            Events
          </Tab>
          <Tab
            active={activeTab === TabType.AUDIT}
            onClick={() => handleTabChange(TabType.AUDIT)}
          >
            Audit Log
          </Tab>
        </TabContainer>

        <ContentContainer>{renderTabContent()}</ContentContainer>
      </Container>
    </SecondarySidebarLayout>
  );
};

export default TaskDetailPage;
