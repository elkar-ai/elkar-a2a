import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { FiChevronDown } from "react-icons/fi";
import { useTenant, Tenant } from "../../contexts/TenantContext";

const SelectorContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const SelectorButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.transparent};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 500;
  cursor: ${({ theme }) => theme.cursor};
  transition: all 0.2s ease;
  min-width: 150px;
  border: none;

  &:hover {
    background-color: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.primary};
  }

  svg {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const DropdownMenu = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  min-width: 180px;
  max-height: 300px;
  overflow-y: auto;
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: ${({ theme }) => theme.shadows.md};
  z-index: 100;
  display: ${({ $isOpen }) => ($isOpen ? "block" : "none")};
  margin-top: 4px;
`;

const MenuItem = styled.button<{ $isActive?: boolean }>`
  display: flex;
  align-items: center;
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background-color: ${({ $isActive, theme }) =>
    $isActive ? `${theme.colors.primary}10` : theme.colors.transparent};
  border: none;
  text-align: left;
  cursor: ${({ theme }) => theme.cursor};
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
  border-left-color: ${({ $isActive, theme }) =>
    $isActive ? theme.colors.primary : "transparent"};
  color: ${({ $isActive, theme }) =>
    $isActive ? theme.colors.primary : theme.colors.textSecondary};
  font-weight: ${({ $isActive }) => ($isActive ? "500" : "400")};

  &:hover {
    background-color: ${({ $isActive, theme }) =>
      $isActive ? `${theme.colors.primary}10` : theme.colors.transparent};
    color: ${({ $isActive, theme }) =>
      $isActive ? theme.colors.primary : theme.colors.text};
  }
`;

const TenantName = styled.span`
  font-weight: inherit;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const NoSelectionIndicator = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-style: italic;
  font-weight: 400;
`;

const LoadingIndicator = styled.div`
  padding: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: center;
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const TenantSelector: React.FC = () => {
  const { currentTenant, setCurrentTenant, tenants, isLoading } = useTenant();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleToggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleSelectTenant = (tenant: Tenant) => {
    setCurrentTenant(tenant);
    setIsOpen(false);
    window.location.reload();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <SelectorContainer ref={dropdownRef}>
      <SelectorButton onClick={handleToggleDropdown}>
        {currentTenant ? (
          <TenantName>{currentTenant.name}</TenantName>
        ) : (
          <NoSelectionIndicator>Select tenant</NoSelectionIndicator>
        )}
        <FiChevronDown size={16} />
      </SelectorButton>

      <DropdownMenu $isOpen={isOpen}>
        {isLoading ? (
          <LoadingIndicator>Loading tenants...</LoadingIndicator>
        ) : tenants.length > 0 ? (
          tenants.map((tenant) => (
            <MenuItem
              key={tenant.id}
              $isActive={currentTenant?.id === tenant.id}
              onClick={() => handleSelectTenant(tenant)}
            >
              <TenantName>{tenant.name}</TenantName>
            </MenuItem>
          ))
        ) : (
          <LoadingIndicator>No tenants available</LoadingIndicator>
        )}
      </DropdownMenu>
    </SelectorContainer>
  );
};

export default TenantSelector;
