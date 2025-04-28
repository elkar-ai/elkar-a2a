import React from "react";
import styled from "styled-components";

const NavContainer = styled.nav`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const NavButton = styled.button<{ active: boolean }>`
  display: flex;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background-color: ${({ active, theme }) =>
    active ? theme.colors.primary : "transparent"};
  color: ${({ active, theme }) =>
    active ? theme.colors.text : theme.colors.textSecondary};
  font-weight: ${({ active }) => (active ? "600" : "400")};
  transition: all 0.2s ease;

  &:hover {
    background-color: ${({ active, theme }) =>
      active ? theme.colors.primary : theme.colors.surface};
  }
`;

interface MethodNavProps {
  activeTab: "sendTask" | "getTask" | "streaming" | "agentCard";
  onTabChange: (
    tab: "sendTask" | "getTask" | "streaming" | "agentCard"
  ) => void;
}

const MethodNav: React.FC<MethodNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <NavContainer>
      <NavButton
        active={activeTab === "agentCard"}
        onClick={() => onTabChange("agentCard")}
      >
        Agent Card
      </NavButton>
      <NavButton
        active={activeTab === "sendTask"}
        onClick={() => onTabChange("sendTask")}
      >
        Send Task
      </NavButton>
      <NavButton
        active={activeTab === "getTask"}
        onClick={() => onTabChange("getTask")}
      >
        Get Task
      </NavButton>
      <NavButton
        active={activeTab === "streaming"}
        onClick={() => onTabChange("streaming")}
      >
        Streaming
      </NavButton>
    </NavContainer>
  );
};

export default MethodNav;
