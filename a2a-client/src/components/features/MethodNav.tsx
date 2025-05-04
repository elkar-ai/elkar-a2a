import React from "react";
import styled from "styled-components";
import { Link, useLocation } from "react-router";
import { RiRobot2Line, RiSendPlaneLine, RiListCheck } from "react-icons/ri";

const NavContainer = styled.nav`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const NavLink = styled(Link)<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background-color: ${({ $active, theme }) =>
    $active ? `${theme.colors.primary}20` : "transparent"};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.primary : theme.colors.textSecondary};
  font-weight: ${({ $active }) => ($active ? "500" : "400")};
  transition: all 0.2s ease;
  text-decoration: none;
  font-size: ${({ theme }) => theme.fontSizes.sm};

  &:hover {
    background-color: ${({ $active, theme }) =>
      $active ? `${theme.colors.primary}20` : theme.colors.surface};
    color: ${({ $active, theme }) =>
      $active ? theme.colors.primary : theme.colors.text};
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const MethodNav: React.FC = () => {
  const location = useLocation();

  return (
    <NavContainer>
      <NavLink to="/agent-card" $active={location.pathname === "/agent-card"}>
        <RiRobot2Line />
        Agent Card
      </NavLink>
      <NavLink
        to="/send-task"
        $active={
          location.pathname === "/send-task" || location.pathname === "/"
        }
      >
        <RiSendPlaneLine />
        Send Task
      </NavLink>
      <NavLink to="/list-tasks" $active={location.pathname === "/list-tasks"}>
        <RiListCheck />
        List Tasks
      </NavLink>
      <NavLink to="/list-agents" $active={location.pathname === "/list-agents"}>
        <RiRobot2Line />
        List Agents
      </NavLink>
    </NavContainer>
  );
};

export default MethodNav;
