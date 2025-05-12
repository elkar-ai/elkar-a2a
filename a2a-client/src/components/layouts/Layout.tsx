import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import styled from "styled-components";
import {
  IoMenuOutline,
  IoCloseOutline,
  IoDocumentTextOutline,
} from "react-icons/io5";

import ThemeToggle from "../common/ThemeToggle";
import UserDropdown from "../common/UserDropdown";
import TenantSelector from "../common/TenantSelector";

interface LayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  header?: React.ReactNode;
  noPadding?: boolean;
  fullWidth?: boolean;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: ${({ theme }) => theme.colors.background};
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  height: 60px;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const MenuButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.xs};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.background};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}20;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    display: none;
  }
`;

const AppTitle = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  margin: 0;
  transition: color 0.2s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const Divider = styled.div`
  width: 1px;
  height: 24px;
  background-color: ${({ theme }) => theme.colors.border};
  margin: 0 ${({ theme }) => theme.spacing.md};
`;

const DocLink = styled.a`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.text};
  text-decoration: none;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  transition: all 0.2s ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.primary};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}20;
  }
`;

const MainContainer = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
`;

const Sidebar = styled.aside<{ $isOpen: boolean }>`
  width: 280px;
  background-color: ${({ theme }) => theme.colors.surface};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    position: fixed;
    top: 60px;
    left: 0;
    bottom: 0;
    z-index: 100;
    transform: translateX(${({ $isOpen }) => ($isOpen ? "0" : "-100%")});
  }
`;

const SidebarContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.md};
`;

const MobileOverlay = styled.div<{ $isVisible: boolean }>`
  display: none;
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 99;
  opacity: ${({ $isVisible }) => ($isVisible ? 1 : 0)};
  visibility: ${({ $isVisible }) => ($isVisible ? "visible" : "hidden")};
  transition:
    opacity 0.3s ease,
    visibility 0.3s ease;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: block;
  }
`;

const MainContent = styled.div`
  position: relative;
  width: 100%;
`;

const MainHeader = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const MainBody = styled.div<{ $noPadding: boolean }>`
  flex: 1;
  height: 100%;
  width: 100%;
  overflow: hidden;
  padding: ${({ $noPadding, theme }) => ($noPadding ? 0 : theme.spacing.md)};
`;

const ContentWrapper = styled.div<{ $fullWidth: boolean }>`
  max-width: ${({ $fullWidth }) => ($fullWidth ? "none" : "1200px")};
  margin: 0 auto;
  width: 100%;
  height: 100%;
`;

/**
 * Main layout component that provides the application structure with a header,
 * sidebar, and main content area. Supports responsive design with a mobile-friendly
 * sidebar toggle.
 */
const Layout: React.FC<LayoutProps> = ({
  children,
  sidebar,
  header,
  noPadding = false,
  fullWidth = false,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const handleHomeClick = useCallback(() => {
    navigate("/");
  }, [navigate]);

  return (
    <Container>
      <Header>
        <HeaderLeft>
          <MenuButton
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
            aria-expanded={isSidebarOpen}
            aria-controls="sidebar"
          >
            {isSidebarOpen ? (
              <IoCloseOutline size={24} aria-hidden="true" />
            ) : (
              <IoMenuOutline size={24} aria-hidden="true" />
            )}
          </MenuButton>
          <AppTitle onClick={handleHomeClick}>Elkar A2A</AppTitle>
          <Divider />
          <TenantSelector />
        </HeaderLeft>
        <HeaderRight>
          <DocLink
            href="https://docs.elkar.co"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View documentation"
          >
            <IoDocumentTextOutline size={18} aria-hidden="true" />
            Docs
          </DocLink>
          <ThemeToggle />
          <UserDropdown />
        </HeaderRight>
      </Header>

      <MainContainer>
        <MobileOverlay
          $isVisible={isSidebarOpen}
          onClick={closeSidebar}
          aria-hidden="true"
        />
        <Sidebar $isOpen={isSidebarOpen} id="sidebar" role="complementary">
          <SidebarContent>{sidebar}</SidebarContent>
        </Sidebar>
        <MainContent>
          {header && <MainHeader>{header}</MainHeader>}
          <MainBody $noPadding={noPadding}>
            <ContentWrapper $fullWidth={fullWidth}>{children}</ContentWrapper>
          </MainBody>
        </MainContent>
      </MainContainer>
    </Container>
  );
};

export default Layout;
