import React from "react";
import styled from "styled-components";
import { Link, useLocation } from "react-router";

const NavContainer = styled.nav`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const NavLink = styled(Link)<{ active: boolean }>`
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
  text-decoration: none;

  &:hover {
    background-color: ${({ active, theme }) =>
      active ? theme.colors.primary : theme.colors.surface};
  }
`;

const MethodNav: React.FC = () => {
  const location = useLocation();

  return (
    <NavContainer>
      <NavLink to="/agent-card" active={location.pathname === "/agent-card"}>
        Agent Card
      </NavLink>
      <NavLink
        to="/send-task"
        active={location.pathname === "/send-task" || location.pathname === "/"}
      >
        Send Task
      </NavLink>

      <NavLink to="/list-tasks" active={location.pathname === "/list-tasks"}>
        List Tasks
      </NavLink>
    </NavContainer>
  );
};

export default MethodNav;
