import React from "react";
import styled from "styled-components";

interface LayoutProps {
  header: React.ReactNode;
  sidebar: React.ReactNode;
  main: React.ReactNode;
}

const AppContainer = styled.div`
  max-width: 1600px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.md};
  min-height: 100vh;
  display: flex;
  flex-direction: column;

  @media (min-width: ${({ theme }) => theme.breakpoints.xl}) {
    padding: ${({ theme }) => `${theme.spacing.lg} ${theme.spacing.xl}`};
  }
`;

const AppLayout = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xl};
  flex: 1;
  margin-top: ${({ theme }) => theme.spacing.lg};

  @media (max-width: 900px) {
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing.lg};
  }
`;

const SidebarContainer = styled.aside`
  flex: 0 0 320px;
  position: sticky;
  top: ${({ theme }) => theme.spacing.xl};
  height: fit-content;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  scroll-behavior: smooth;

  @media (max-width: 900px) {
    flex: auto;
    width: 100%;
    position: static;
    max-height: none;
    overflow-y: visible;
  }
`;

const MainContainer = styled.main`
  flex: 1;
  min-width: 0; /* Prevent flex items from overflowing */
`;

const Layout: React.FC<LayoutProps> = ({ header, sidebar, main }) => {
  return (
    <AppContainer>
      {header}
      <AppLayout>
        <SidebarContainer>{sidebar}</SidebarContainer>
        <MainContainer>{main}</MainContainer>
      </AppLayout>
    </AppContainer>
  );
};

export default Layout;
