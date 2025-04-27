import { v4 as uuidv4 } from "uuid";

export enum TaskState {
  SUBMITTED = "submitted",
  WORKING = "working",
  INPUT_REQUIRED = "input-required",
  COMPLETED = "completed",
  CANCELED = "canceled",
  FAILED = "failed",
  UNKNOWN = "unknown",
}

export interface TextPart {
  type: "text";
  text: string;
  metadata?: Record<string, any>;
}

export interface FileContent {
  name?: string;
  mimeType?: string;
  bytes?: string;
  uri?: string;
}

export interface FilePart {
  type: "file";
  file: FileContent;
  metadata?: Record<string, any>;
}

export interface DataPart {
  type: "data";
  data: Record<string, any>;
  metadata?: Record<string, any>;
}

export type Part = TextPart | FilePart | DataPart;

export interface Message {
  role: "user" | "agent";
  parts: Part[];
  metadata?: Record<string, any>;
}

export interface TaskStatus {
  state: TaskState;
  message?: Message;
  timestamp: string;
}

export interface Artifact {
  name?: string;
  description?: string;
  parts: Part[];
  metadata?: Record<string, any>;
  index: number;
  append?: boolean;
  lastChunk?: boolean;
}

export interface Task {
  id: string;
  sessionId?: string;
  status: TaskStatus;
  artifacts?: Artifact[];
  history?: Message[];
  metadata?: Record<string, any>;
}

export interface TaskStatusUpdateEvent {
  id: string;
  status: TaskStatus;
  final: boolean;
  metadata?: Record<string, any>;
}

export interface TaskArtifactUpdateEvent {
  id: string;
  artifact: Artifact;
  metadata?: Record<string, any>;
}

export interface AuthenticationInfo {
  schemes: string[];
  credentials?: string;
  [key: string]: any;
}

export interface PushNotificationConfig {
  url: string;
  token?: string;
  authentication?: AuthenticationInfo;
}

export interface TaskIdParams {
  id: string;
  metadata?: Record<string, any>;
}

export interface TaskQueryParams extends TaskIdParams {
  historyLength?: number;
}

export interface TaskSendParams {
  id: string;
  sessionId: string;
  message: Message;
  acceptedOutputModes?: string[];
  pushNotification?: PushNotificationConfig;
  historyLength?: number;
  metadata?: Record<string, any>;
}

export interface TaskPushNotificationConfig {
  id: string;
  pushNotificationConfig: PushNotificationConfig;
}

// RPC Messages
export interface JSONRPCMessage {
  jsonrpc: "2.0";
  id: string | number | null;
}

export interface JSONRPCRequest extends JSONRPCMessage {
  method: string;
  params?: Record<string, any>;
}

export interface JSONRPCError {
  code: number;
  message: string;
  data?: any;
}

export interface JSONRPCResponse extends JSONRPCMessage {
  result?: any;
  error?: JSONRPCError;
}

export interface SendTaskRequest extends JSONRPCRequest {
  method: "tasks/send";
  params: TaskSendParams;
}

export interface SendTaskResponse extends JSONRPCResponse {
  result?: Task;
}

export interface SendTaskStreamingRequest extends JSONRPCRequest {
  method: "tasks/sendSubscribe";
  params: TaskSendParams;
}

export interface SendTaskStreamingResponse extends JSONRPCResponse {
  result?: TaskStatusUpdateEvent | TaskArtifactUpdateEvent;
}

export interface GetTaskRequest extends JSONRPCRequest {
  method: "tasks/get";
  params: TaskQueryParams;
}

export interface GetTaskResponse extends JSONRPCResponse {
  result?: Task;
}

export interface CancelTaskRequest extends JSONRPCRequest {
  method: "tasks/cancel";
  params: TaskIdParams;
}

export interface CancelTaskResponse extends JSONRPCResponse {
  result?: Task;
}

export interface SetTaskPushNotificationRequest extends JSONRPCRequest {
  method: "tasks/pushNotification/set";
  params: TaskPushNotificationConfig;
}

export interface SetTaskPushNotificationResponse extends JSONRPCResponse {
  result?: TaskPushNotificationConfig;
}

export interface GetTaskPushNotificationRequest extends JSONRPCRequest {
  method: "tasks/pushNotification/get";
  params: TaskIdParams;
}

export interface GetTaskPushNotificationResponse extends JSONRPCResponse {
  result?: TaskPushNotificationConfig;
}

export interface TaskResubscriptionRequest extends JSONRPCRequest {
  method: "tasks/resubscribe";
  params: TaskIdParams;
}

export type A2ARequest =
  | SendTaskRequest
  | GetTaskRequest
  | CancelTaskRequest
  | SetTaskPushNotificationRequest
  | GetTaskPushNotificationRequest
  | TaskResubscriptionRequest
  | SendTaskStreamingRequest;

// Helper functions
export const createJsonRpcRequest = (
  method: string,
  params?: any
): JSONRPCRequest => {
  return {
    jsonrpc: "2.0",
    id: uuidv4(),
    method,
    params,
  };
};

export const createTextPart = (text: string): TextPart => {
  return {
    type: "text",
    text,
  };
};

export const createUserMessage = (text: string): Message => {
  return {
    role: "user",
    parts: [createTextPart(text)],
  };
};
