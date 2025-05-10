import React from "react";
import styled from "styled-components";
import { Link, useLocation } from "react-router";

// Container for the entire sidebar
const SidebarContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
`;

// Header section of the sidebar (containing title and possibly actions)
const SidebarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

// Title of the sidebar
const SidebarTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.text};
  font-weight: 600;
  margin: 0;
`;

// Optional action button
const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary}ee;
  }
`;

// Section title for grouping links
const SectionTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: ${({ theme }) => theme.spacing.md} 0
    ${({ theme }) => theme.spacing.sm};
  font-weight: 600;
`;

// Navigation section
const NavSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

// Navigation link
const NavLink = styled(Link)<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background-color: ${({ $active, theme }) =>
    $active ? `${theme.colors.primary}20` : "transparent"};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.primary : theme.colors.text};
  font-weight: ${({ $active }) => ($active ? "500" : "400")};
  transition: all 0.2s ease;
  text-decoration: none;
  font-size: ${({ theme }) => theme.fontSizes.sm};

  &:hover {
    background-color: ${({ $active, theme }) =>
      $active ? `${theme.colors.primary}20` : theme.colors.surface};
    color: ${({ $active, theme }) =>
      $active ? theme.colors.primary : theme.colors.primary};
  }
`;

// Content section that can be scrolled
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

// For search functionality
const SearchContainer = styled.div`
  position: relative;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const SearchInput = styled.input`
  width: 100%;
  padding: ${({ theme }) =>
    `${theme.spacing.sm} ${theme.spacing.md} ${theme.spacing.sm} ${theme.spacing.xl}`};
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  transition: all 0.2s ease;
  height: 40px;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => `${theme.colors.primary}30`};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: ${({ theme }) => theme.spacing.sm};
  top: 50%;
  transform: translateY(-50%);
  color: ${({ theme }) => theme.colors.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
`;

// Footer section
const SidebarFooter = styled.div`
  margin-top: auto;
  padding-top: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

interface LinkProps {
  isActive: boolean;
  to: string;
  children: React.ReactNode;
}

const SidebarLink: React.FC<LinkProps> = ({ isActive, ...props }) => {
  return <NavLink $active={isActive} {...props} />;
};

interface SecondarySidebarProps {
  title: string;
  children: React.ReactNode;
  actionButton?: React.ReactNode;
  footer?: React.ReactNode;
}

interface SecondarySidebarComponent extends React.FC<SecondarySidebarProps> {
  Section: typeof NavSection;
  SectionTitle: typeof SectionTitle;
  Link: typeof SidebarLink;
  ActionButton: typeof ActionButton;
  SearchContainer: typeof SearchContainer;
  SearchInput: typeof SearchInput;
  SearchIcon: typeof SearchIcon;
}

const SecondarySidebar: SecondarySidebarComponent = ({
  title,
  children,
  actionButton,
  footer,
}) => {
  return (
    <SidebarContainer>
      <SidebarHeader>
        <SidebarTitle>{title}</SidebarTitle>
        {actionButton}
      </SidebarHeader>

      <SidebarContent>{children}</SidebarContent>

      {footer && <SidebarFooter>{footer}</SidebarFooter>}
    </SidebarContainer>
  );
};

// Assign subcomponents to the main component
SecondarySidebar.Section = NavSection;
SecondarySidebar.SectionTitle = SectionTitle;
SecondarySidebar.Link = SidebarLink;
SecondarySidebar.ActionButton = ActionButton;
SecondarySidebar.SearchContainer = SearchContainer;
SecondarySidebar.SearchInput = SearchInput;
SecondarySidebar.SearchIcon = SearchIcon;

export default SecondarySidebar;
