import React from "react";
import styled from "styled-components";
import Layout from "./Layout";
import { MainSidebarContent } from "../App";

const Container = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.background};
`;

const AgentSidebarContainer = styled.aside`
  width: 350px;
  flex-shrink: 0;
  background: ${({ theme }) => theme.colors.background};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding: ${({ theme }) => theme.spacing.lg};

  @media (max-width: 768px) {
    width: 320px;
  }

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border};
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const ContentArea = styled.main`
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
  padding: ${({ theme }) => theme.spacing.xl};
  background: ${({ theme }) => theme.colors.background};

  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing.lg};
  }

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.surface};
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border};
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const AgentHeader = styled.header`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const AgentTitle = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 ${({ theme }) => theme.spacing.xs} 0;
`;

const AgentDescription = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 0 ${({ theme }) => theme.spacing.sm} 0;
`;

const AgentMeta = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const ContentContainer = styled.div`
  max-width: 1200px;
  width: 100%;
`;

interface AgentSplitLayoutProps {
  agentSidebar: React.ReactNode;
  children: React.ReactNode;
  title?: string;
  description?: string;
  meta?: React.ReactNode;
  sidebarLabel?: string;
}

/**
 * Layout component specifically designed for agent-related pages.
 * Provides a dedicated sidebar for agent controls and a main content area
 * with optional header information.
 */
const AgentSplitLayout: React.FC<AgentSplitLayoutProps> = ({
  agentSidebar,
  children,
  title,
  description,
  meta,
  sidebarLabel = "Agent controls",
}) => {
  return (
    <Layout sidebar={<MainSidebarContent />} noPadding fullWidth>
      <Container>
        <AgentSidebarContainer role="complementary" aria-label={sidebarLabel}>
          {agentSidebar}
        </AgentSidebarContainer>
        <ContentArea>
          {(title || description || meta) && (
            <AgentHeader>
              {title && <AgentTitle>{title}</AgentTitle>}
              {description && (
                <AgentDescription>{description}</AgentDescription>
              )}
              {meta && <AgentMeta>{meta}</AgentMeta>}
            </AgentHeader>
          )}
          <ContentContainer>{children}</ContentContainer>
        </ContentArea>
      </Container>
    </Layout>
  );
};

export default AgentSplitLayout;
