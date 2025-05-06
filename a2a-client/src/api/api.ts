export interface PaginationInformation {
  page: number;
  total_pages: number;
  total: number;
  has_more: boolean;
}

export interface PaginatedOutput<T> {
  records: T[];
  pagination: PaginationInformation;
}

export interface UnpaginatedOutput<T> {
  records: T[];
}

import {
  DefaultApi,
  Configuration,
  TaskApi,
  RequestContext,
} from "../../generated-api";
import { getAccessToken } from "./accessToken";
import getTenantId from "./tenantId";

const authMiddleware = {
  pre: async (context: RequestContext) => {
    try {
      const token = await getAccessToken();
      const tenantId = getTenantId();
      context.init.headers = {
        ...context.init.headers,
        Authorization: `Bearer ${token}`,
        "X-Tenant-Id": tenantId,
      };
    } catch (error) {
      console.error("Failed to get access token:", error);
    }
    return context;
  },
};

export const apiConfig = new Configuration({
  basePath: import.meta.env.VITE_BACKEND_URL || "http://localhost:1996",
  headers: {
    "Content-Type": "application/json",
  },
  middleware: [authMiddleware],
});

// Create API instance with dynamic token fetching
export const taskApi = new TaskApi(apiConfig);
export const api = new DefaultApi(apiConfig);
