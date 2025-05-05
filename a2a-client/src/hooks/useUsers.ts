import { useQuery } from "@tanstack/react-query";
import { api } from "../api/api";

/**
 * Hook for fetching users data with caching
 */
export const useUsers = () => {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      try {
        const response = await api.epRetrieveTenantUsers();
        return response.records || [];
      } catch (error) {
        console.error("Failed to fetch users:", error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};

/**
 * Get a user by ID from the cache of fetched users
 */
export const useUserById = (userId?: string) => {
  const { data: users = [], ...rest } = useUsers();

  const user = userId ? users.find((user) => user.id === userId) : undefined;

  return {
    user,
    ...rest,
  };
};
