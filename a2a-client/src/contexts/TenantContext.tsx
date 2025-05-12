import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/api";
import { useSupabase } from "./SupabaseContext";

export interface Tenant {
  id: string;
  name: string;
  role?: string;
}

interface TenantContextType {
  currentTenant: Tenant | null;
  setCurrentTenant: (tenant: Tenant | null) => void;
  tenants: Tenant[];
  isLoading: boolean;
  isRefetching: boolean;
  refetchTenants: () => Promise<Tenant[]>;
  error: unknown;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
};

interface TenantProviderProps {
  children: React.ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(() => {
    const savedTenant = localStorage.getItem("currentTenant");
    return savedTenant ? JSON.parse(savedTenant) : null;
  });

  const supabase = useSupabase();

  // Fetch tenants from API

  const isRegisteredQuery = useQuery({
    queryKey: ["isRegistered"],
    queryFn: () => api.epIsRegistered(),
    enabled: !!supabase.user,
  });

  const {
    data: tenants = [],
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["tenants"],
    queryFn: async () => {
      try {
        const response = await api.epRetrieveTenants();
        return response.records || [];
      } catch (err) {
        console.error("Failed to fetch tenants:", err);
        throw err;
      }
    },
    enabled: !!isRegisteredQuery.data?.isRegistered,
  });

  // Set the first tenant as current if none is selected and tenants are loaded
  useEffect(() => {
    if (!currentTenant && tenants.length > 0) {
      setCurrentTenant(tenants[0]);
    }
  }, [currentTenant, tenants]);

  // Save the current tenant to localStorage
  useEffect(() => {
    if (currentTenant) {
      localStorage.setItem("currentTenant", JSON.stringify(currentTenant));
    } else {
      localStorage.removeItem("currentTenant");
    }
  }, [currentTenant]);

  // Handle tenant refetch with proper error handling
  const handleRefetchTenants = async (): Promise<Tenant[]> => {
    try {
      const result = await refetch();
      return result.data || [];
    } catch (err) {
      console.error("Failed to refetch tenants:", err);
      throw err;
    }
  };

  return (
    <TenantContext.Provider
      value={{
        currentTenant,
        setCurrentTenant,
        tenants,
        isLoading,
        isRefetching,
        error,
        refetchTenants: handleRefetchTenants,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};
