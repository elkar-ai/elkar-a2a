import React from "react";
import styled from "styled-components";
import Layout from "./Layout";
import { MainSidebarContent } from "../App";

const Container = styled.div`
  display: flex;

  height: 100%;
  background: ${({ theme }) => theme.colors.background};
`;

const SecondarySidebarContainer = styled.aside`
  width: 350px;
  flex-shrink: 0;
  background: ${({ theme }) => theme.colors.background};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  height: 100%;
  overflow-y: auto;
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

const SidebarContent = styled.div`
  flex: 1;
  overflow-y: auto;

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

const ContentArea = styled.div`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.xl};

  overflow-y: auto;
  /* padding: ${({ theme }) => theme.spacing.xl}; */
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

const ContentContainer = styled.div`
  height: 100%;

  width: 100%;
`;

interface SecondarySidebarLayoutProps {
  secondarySidebar: React.ReactNode;
  children: React.ReactNode;

  sidebarLabel?: string;
}

/**
 * Layout component that provides a secondary sidebar alongside the main content.
 * Used for settings pages and other sections that require additional navigation.
 */
const SecondarySidebarLayout: React.FC<SecondarySidebarLayoutProps> = ({
  secondarySidebar,
  children,

  sidebarLabel = "Secondary navigation",
}) => {
  return (
    <Layout sidebar={<MainSidebarContent />} noPadding fullWidth>
      <Container>
        <SecondarySidebarContainer
          role="complementary"
          aria-label={sidebarLabel}
        >
          <SidebarContent>{secondarySidebar}</SidebarContent>
        </SecondarySidebarContainer>
        <ContentArea>
          <ContentContainer>{children}</ContentContainer>
        </ContentArea>
      </Container>
    </Layout>
  );
};

export default SecondarySidebarLayout;
