import React, { useState } from "react";
import styled from "styled-components";
import ThemeToggle from "../common/ThemeToggle";
import UserDropdown from "../common/UserDropdown";
import TenantSelector from "../common/TenantSelector";
import { IoMenuOutline, IoCloseOutline } from "react-icons/io5";
import { useNavigate } from "react-router";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: ${({ theme }) => theme.colors.background};
  overflow: hidden;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  z-index: 10;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const Divider = styled.div`
  height: 24px;
  width: 1px;
  background-color: ${({ theme }) => theme.colors.border};
  margin: 0 ${({ theme }) => theme.spacing.sm};
`;

const AppTitle = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.text};
  cursor: ${({ theme }) => theme.cursor};
  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.fontSizes.md};
  }
`;

const MainContainer = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const Sidebar = styled.div<{ $isOpen: boolean }>`
  width: 280px;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.surface};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  transition: all 0.3s ease;
  flex-shrink: 0;

  @media (max-width: 768px) {
    position: fixed;
    top: 64px;
    left: ${({ $isOpen }) => ($isOpen ? "0" : "-280px")};
    bottom: 0;
    z-index: 100;
    box-shadow: ${({ $isOpen, theme }) =>
      $isOpen ? theme.shadows.lg : "none"};
  }
`;

const MobileOverlay = styled.div<{ $isVisible: boolean }>`
  display: none;

  @media (max-width: 768px) {
    display: ${({ $isVisible }) => ($isVisible ? "block" : "none")};
    position: fixed;
    top: 64px;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${({ theme }) => theme.colors.overlay};
    z-index: 90;
  }
`;

const SidebarContent = styled.div`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  overflow-y: auto;
  min-height: 0;

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

const MenuButton = styled.button`
  display: none;
  background: ${({ theme }) => theme.colors.transparent};
  border: none;
  color: ${({ theme }) => theme.colors.text};
  cursor: ${({ theme }) => theme.cursor};
  padding: ${({ theme }) => theme.spacing.sm};
  margin-right: ${({ theme }) => theme.spacing.sm};

  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &:focus {
    outline: none;
  }
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.background};
  overflow: hidden;
  min-width: 0;
`;

const MainHeader = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.background};
  flex-shrink: 0;
`;

const MainBody = styled.div`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.xl};
  overflow-y: auto;
  transition: all 0.2s ease;
  min-height: 0;

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

const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

interface LayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  header?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children, sidebar, header }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };
  const navigate = useNavigate();
  return (
    <Container>
      <Header>
        <HeaderLeft>
          <MenuButton onClick={toggleSidebar}>
            {isSidebarOpen ? (
              <IoCloseOutline size={24} />
            ) : (
              <IoMenuOutline size={24} />
            )}
          </MenuButton>
          <AppTitle onClick={() => navigate("/")}>Elkar A2A</AppTitle>
          <Divider />
          <TenantSelector />
        </HeaderLeft>
        <HeaderRight>
          <ThemeToggle />
          <UserDropdown />
        </HeaderRight>
      </Header>

      <MainContainer>
        <MobileOverlay $isVisible={isSidebarOpen} onClick={closeSidebar} />
        <Sidebar $isOpen={isSidebarOpen}>
          <SidebarContent>{sidebar}</SidebarContent>
        </Sidebar>
        <MainContent>
          {header && <MainHeader>{header}</MainHeader>}
          <MainBody>
            <ContentWrapper>{children}</ContentWrapper>
          </MainBody>
        </MainContent>
      </MainContainer>
    </Container>
  );
};

export default Layout;
