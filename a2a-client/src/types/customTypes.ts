import { PushNotificationConfig, Task, TaskState } from "./a2aTypes";

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TaskResponse {
  id: string;
  caller_id: string;
  created_at: Date;
  updated_at: Date;
  state: TaskState;
  task: Task;
  notification: PushNotificationConfig | null;
}
