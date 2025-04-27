import React from "react";
import styled from "styled-components";

type TabType = "sendTask" | "getTask" | "streaming";

interface MethodNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const NavContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  transition: transform ${({ theme }) => theme.transitions.normal},
    box-shadow ${({ theme }) => theme.transitions.normal};

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }
`;

const Title = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.darkGray};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  padding-bottom: ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const NavList = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

interface NavItemProps {
  active: boolean;
}

const NavItem = styled.li<NavItemProps>`
  padding: ${({ theme }) => theme.spacing.md};
  font-weight: 500;
  cursor: pointer;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  transition: all ${({ theme }) => theme.transitions.fast};
  background-color: ${({ active, theme }) =>
    active ? theme.colors.primary + "15" : theme.colors.white};
  color: ${({ active, theme }) =>
    active ? theme.colors.primary : theme.colors.gray};
  border-left: 3px solid
    ${({ active, theme }) => (active ? theme.colors.primary : "transparent")};
  display: flex;
  align-items: center;
  box-shadow: ${({ active, theme }) => (active ? theme.shadows.sm : "none")};

  &:hover {
    background-color: ${({ active, theme }) =>
      active ? theme.colors.primary + "20" : theme.colors.lightBg};
    transform: translateX(2px);
  }
`;

const MethodNav: React.FC<MethodNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <NavContainer>
      <Title>Methods</Title>
      <NavList>
        <NavItem
          active={activeTab === "sendTask"}
          onClick={() => onTabChange("sendTask")}
        >
          Send Task
        </NavItem>
        <NavItem
          active={activeTab === "getTask"}
          onClick={() => onTabChange("getTask")}
        >
          Get Task
        </NavItem>
        <NavItem
          active={activeTab === "streaming"}
          onClick={() => onTabChange("streaming")}
        >
          Streaming
        </NavItem>
      </NavList>
    </NavContainer>
  );
};

export default MethodNav;
