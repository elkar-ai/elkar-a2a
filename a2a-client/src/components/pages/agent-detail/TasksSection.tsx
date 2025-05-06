import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { useNavigate } from "react-router";
import styled from "styled-components";

import {
  TaskResponse,
  TaskState,
  TaskType,
} from "../../../../generated-api/models";
import { TreeTable } from "../../common/AppTable";
import { Card, SectionTitle, EmptyState, EmptyStateText } from "./styles";
import { taskApi } from "../../../api/api";
import FilterComponent, {
  FilterOption,
  FilterValue,
} from "../../common/FilterComponent";

const FilterSection = styled.div`
  margin-top: 16px;
  margin-bottom: 24px;
`;

const ActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  margin-bottom: 16px;
`;

const TaskCount = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  align-items: center;
`;

const TasksSection: React.FC = () => {
  const { id: agentId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<FilterValue>({});

  // Initialize the generated API client
  const tasksQuery = useQuery({
    queryKey: ["agentTasks", agentId, filters],
    queryFn: async () => {
      if (!agentId) {
        throw new Error("Agent ID is required");
      }

      // Prepare API query parameters
      const queryParams = {
        retrieveTasksInput: {
          agentIdIn: [agentId],
          // Add filters based on the selected values
          taskStateIn: filters.status
            ? [filters.status as TaskState]
            : undefined,
          taskTypeIn: filters.taskType
            ? [filters.taskType as unknown as TaskType]
            : undefined,
        },
      };

      // Handle date filtering with server-side filtering if available
      // Note: This logic may need adjustment based on backend API capabilities
      const response = await taskApi.epRetrieveTasks(queryParams);

      // If date filtering is not supported directly by the API, we can still filter the results
      let filteredRecords = [...response.records];

      if (filters.createdAfter) {
        const createdAfterDate = new Date(filters.createdAfter as string);
        filteredRecords = filteredRecords.filter(
          (task) => new Date(task.createdAt) >= createdAfterDate
        );
      }

      if (filters.createdBefore) {
        const createdBeforeDate = new Date(filters.createdBefore as string);
        filteredRecords = filteredRecords.filter(
          (task) => new Date(task.createdAt) <= createdBeforeDate
        );
      }

      // Return the filtered results with the original pagination info
      return {
        ...response,
        records: filteredRecords,
      };
    },
    enabled: !!agentId,
  });

  const filterOptions: FilterOption<string>[] = [
    {
      id: "status",
      label: "Status",
      type: "select",
      options: [
        { value: TaskState.Submitted, label: "Submitted" },
        { value: TaskState.Working, label: "Working" },
        { value: TaskState.InputRequired, label: "Input Required" },
        { value: TaskState.Completed, label: "Completed" },
        { value: TaskState.Canceled, label: "Canceled" },
        { value: TaskState.Failed, label: "Failed" },
      ],
    },
    {
      id: "taskType",
      label: "Task Type",
      type: "select",
      options: Array.from(
        new Set(tasksQuery.data?.records.map((task) => task.taskType) || [])
      ).map((type) => ({ value: type, label: type })),
    },
    {
      id: "createdAfter",
      label: "Created After",
      type: "date",
    },
    {
      id: "createdBefore",
      label: "Created Before",
      type: "date",
    },
  ];

  const columns = [
    {
      key: "id",
      title: "ID",
      render: (task: TaskResponse) => <div>{task.a2aTask?.id}</div>,
    },
    {
      key: "status",
      title: "Status",
      render: (task: TaskResponse) => (
        <StatusCell state={task.a2aTask?.status?.state}>
          {task.a2aTask?.status?.state || "N/A"}
        </StatusCell>
      ),
    },
    {
      key: "taskType",
      title: "Type",
      render: (task: TaskResponse) => <div>{task.taskType}</div>,
    },
    {
      key: "createdAt",
      title: "Created At",
      render: (task: TaskResponse) => (
        <div>{new Date(task.createdAt).toLocaleString()}</div>
      ),
    },
    {
      key: "updatedAt",
      title: "Updated At",
      render: (task: TaskResponse) => (
        <div>{new Date(task.updatedAt).toLocaleString()}</div>
      ),
    },
  ];

  const handleFilterChange = (newFilters: FilterValue) => {
    setFilters(newFilters);
  };

  const isLoading = tasksQuery.isLoading;
  const taskItems = tasksQuery.data?.records || [];

  return (
    <Card>
      <SectionTitle>Tasks</SectionTitle>

      <FilterSection>
        <FilterComponent
          options={filterOptions}
          onFilterChange={handleFilterChange}
          initialValues={filters}
        />
      </FilterSection>

      <ActionBar>
        <TaskCount>
          {taskItems.length} {taskItems.length === 1 ? "task" : "tasks"}
        </TaskCount>
      </ActionBar>

      {isLoading ? (
        <div>Loading tasks...</div>
      ) : taskItems.length > 0 ? (
        <TreeTable
          data={taskItems.map((task: TaskResponse) => ({
            data: task,
            hasChildren: false,
          }))}
          onRowClick={(task: TaskResponse) => {
            navigate(`/task/${task.id}`);
          }}
          columns={columns}
        />
      ) : (
        <EmptyState>
          <EmptyStateText>
            {Object.keys(filters).length
              ? "No tasks match your filter criteria."
              : "No tasks have been assigned to this agent yet."}
          </EmptyStateText>
        </EmptyState>
      )}
    </Card>
  );
};

// Style for status cells with appropriate colors
const StatusCell = styled.div<{ state?: string }>`
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
  font-weight: 500;
  font-size: 14px;

  ${({ state, theme }) => {
    switch (state) {
      case TaskState.Completed:
        return `
          background-color: rgba(0, 200, 83, 0.1);
          color: #00c853;
        `;
      case TaskState.Working:
        return `
          background-color: rgba(3, 169, 244, 0.1);
          color: #0288d1;
        `;
      case TaskState.InputRequired:
        return `
          background-color: rgba(255, 152, 0, 0.1);
          color: #f57c00;
        `;
      case TaskState.Failed:
        return `
          background-color: rgba(244, 67, 54, 0.1);
          color: #f44336;
        `;
      case TaskState.Canceled:
        return `
          background-color: rgba(158, 158, 158, 0.1);
          color: #757575;
        `;
      case TaskState.Submitted:
        return `
          background-color: rgba(156, 39, 176, 0.1);
          color: #9c27b0;
        `;
      default:
        return `
          background-color: ${theme.colors.background};
          color: ${theme.colors.text};
        `;
    }
  }}
`;

export default TasksSection;
