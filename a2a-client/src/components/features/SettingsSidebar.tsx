import React from "react";
import styled from "styled-components";
import { Link, useLocation } from "react-router";
import {
  IoPersonOutline,
  IoBusinessOutline,
  IoPeopleOutline,
} from "react-icons/io5";

const NavContainer = styled.nav`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const SidebarTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  font-weight: 600;
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

const SettingsSidebar: React.FC = () => {
  const location = useLocation();

  return (
    <>
      <SidebarTitle>User Settings</SidebarTitle>
      <NavContainer>
        <NavLink
          to="/settings/profile"
          $active={
            location.pathname === "/settings/profile" ||
            location.pathname === "/settings"
          }
        >
          <IoPersonOutline />
          Profile
        </NavLink>
        <NavLink
          to="/settings/tenants"
          $active={location.pathname === "/settings/tenants"}
        >
          <IoBusinessOutline />
          Tenants
        </NavLink>
        <NavLink
          to="/settings/tenant-users"
          $active={location.pathname === "/settings/tenant-users"}
        >
          <IoPeopleOutline />
          Tenant Users
        </NavLink>
      </NavContainer>
    </>
  );
};

export default SettingsSidebar;
