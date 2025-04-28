import React from "react";
import styled from "styled-components";

const Container = styled.div`
  display: flex;
  height: 100vh;
  background: ${({ theme }) => theme.colors.background};
`;

const Sidebar = styled.div`
  width: 300px;
  padding: ${({ theme }) => theme.spacing.lg};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const MainContent = styled.div`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.background};
  overflow-y: auto;
`;

interface LayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children, sidebar }) => {
  return (
    <Container>
      <Sidebar>{sidebar}</Sidebar>
      <MainContent>{children}</MainContent>
    </Container>
  );
};

export default Layout;
