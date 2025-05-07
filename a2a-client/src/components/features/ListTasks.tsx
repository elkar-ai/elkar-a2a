import { useQuery } from "@tanstack/react-query";
import { useUrl } from "../../contexts/UrlContext";
import A2AClient from "../../services/a2aClient";
import { TreeTable } from "../common/AppTable";
import { TaskResponse } from "../../types/customTypes";
import { useNavigate } from "react-router";

export function ListTasks() {
  const { endpoint } = useUrl();
  const apiClient = new A2AClient(endpoint);

  const tasksQuery = useQuery({
    queryKey: ["tasks"],
    queryFn: () => [],
  });
  const navigate = useNavigate();

  const columns = [
    {
      key: "id",
      title: "ID",
      render: (task: TaskResponse) => {
        return <div>{task.id}</div>;
      },
    },
    {
      key: "status",
      title: "Status",
      render: (task: TaskResponse) => {
        return <div>{task.state}</div>;
      },
    },
    {
      key: "createdAt",
      title: "Created At",
      render: (task: TaskResponse) => {
        return <div>{task.created_at.toLocaleString()}</div>;
      },
    },
    {
      key: "updatedAt",
      title: "Updated At",
      render: (task: TaskResponse) => {
        return <div>{task.updated_at.toLocaleString()}</div>;
      },
    },
  ];

  return (
    <TreeTable
      data={
        tasksQuery.data?.map((task) => ({
          data: task,
          hasChildren: false,
        })) ?? []
      }
      onRowClick={(task) => {
        navigate(`/send-task?taskId=${task.id}`);
      }}
      columns={columns}
    />
  );
}
