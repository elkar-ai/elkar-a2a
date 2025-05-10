import React from "react";
import styled from "styled-components";

const Container = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
  overflow: hidden;
`;

const Sidebar = styled.div`
  width: 320px;
  flex-shrink: 0;
  background: ${({ theme }) => theme.colors.surface};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  overflow-y: auto;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    width: 280px;
  }
`;

const Content = styled.div`
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
  padding: ${({ theme }) => theme.spacing.xl};

  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing.md};
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

interface SplitLayoutProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

const SplitLayout: React.FC<SplitLayoutProps> = ({ sidebar, children }) => {
  return (
    <Container>
      <Sidebar>{sidebar}</Sidebar>
      <Content>{children}</Content>
    </Container>
  );
};

export default SplitLayout;
