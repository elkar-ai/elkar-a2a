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
  id: string; // unique identifier for the task
  sessionId: string; // client-generated id for the session holding the task.
  status: TaskStatus; // current status of the task
  history?: Message[];
  artifacts?: Artifact[]; // collection of artifacts created by the agent.
  metadata?: Record<string, any>; // extension metadata
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

export interface JSONRPCRequest<T> extends JSONRPCMessage {
  method: string;
  params?: T;
}

export interface JSONRPCError {
  code: number;
  message: string;
  data?: any;
}

export interface JSONRPCResponse<T> extends JSONRPCMessage {
  result?: T;
  error?: JSONRPCError;
}

export interface SendTaskRequest extends JSONRPCRequest<TaskSendParams> {
  method: "tasks/send";
}

export interface SendTaskResponse extends JSONRPCResponse<Task> {
  result?: Task;
}

export interface SendTaskStreamingRequest
  extends JSONRPCRequest<TaskSendParams> {
  method: "tasks/sendSubscribe";
}

export interface SendTaskStreamingResponse
  extends JSONRPCResponse<TaskStatusUpdateEvent | TaskArtifactUpdateEvent> {
  result?: TaskStatusUpdateEvent | TaskArtifactUpdateEvent;
}

export interface GetTaskRequest extends JSONRPCRequest<TaskQueryParams> {
  method: "tasks/get";
}

export interface GetTaskResponse extends JSONRPCResponse<Task> {
  result?: Task;
}

export interface CancelTaskRequest extends JSONRPCRequest<TaskIdParams> {
  method: "tasks/cancel";
}

export interface CancelTaskResponse extends JSONRPCResponse<Task> {
  result?: Task;
}

export interface SetTaskPushNotificationRequest
  extends JSONRPCRequest<TaskPushNotificationConfig> {
  method: "tasks/pushNotification/set";
}

export interface SetTaskPushNotificationResponse
  extends JSONRPCResponse<TaskPushNotificationConfig> {
  result?: TaskPushNotificationConfig;
}

export interface GetTaskPushNotificationRequest
  extends JSONRPCRequest<TaskIdParams> {
  method: "tasks/pushNotification/get";
}

export interface GetTaskPushNotificationResponse
  extends JSONRPCResponse<TaskPushNotificationConfig> {
  result?: TaskPushNotificationConfig;
}

export interface TaskResubscriptionRequest
  extends JSONRPCRequest<TaskIdParams> {
  method: "tasks/resubscribe";
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
export function createJsonRpcRequest<T>(
  method: string,
  params?: T
): JSONRPCRequest<T> {
  return {
    jsonrpc: "2.0",
    id: uuidv4(),
    method,
    params,
  };
}

export interface AgentCard {
  // Human readable name of the agent.
  // (e.g. "Recipe Agent")
  name: string;
  // A human-readable description of the agent. Used to assist users and
  // other agents in understanding what the agent can do.
  // (e.g. "Agent that helps users with recipes and cooking.")
  description: string;
  // A URL to the address the agent is hosted at.
  url: string;
  // The service provider of the agent
  provider?: {
    organization: string;
    url: string;
  };
  // The version of the agent - format is up to the provider. (e.g. "1.0.0")
  version: string;
  // A URL to documentation for the agent.
  documentationUrl?: string;
  // Optional capabilities supported by the agent.
  capabilities: {
    streaming?: boolean; // true if the agent supports SSE
    pushNotifications?: boolean; // true if the agent can notify updates to client
    stateTransitionHistory?: boolean; //true if the agent exposes status change history for tasks
  };
  // Authentication requirements for the agent.
  // Intended to match OpenAPI authentication structure.
  authentication: {
    schemes: string[]; // e.g. Basic, Bearer
    credentials?: string; //credentials a client should use for private cards
  };
  // The set of interaction modes that the agent
  // supports across all skills. This can be overridden per-skill.
  defaultInputModes: string[]; // supported mime types for input
  defaultOutputModes: string[]; // supported mime types for output
  // Skills are a unit of capability that an agent can perform.
  skills: {
    id: string; // unique identifier for the agent's skill
    name: string; //human readable name of the skill
    // description of the skill - will be used by the client or a human
    // as a hint to understand what the skill does.
    description: string;
    // Set of tagwords describing classes of capabilities for this specific
    // skill (e.g. "cooking", "customer support", "billing")
    tags: string[];
    // The set of example scenarios that the skill can perform.
    // Will be used by the client as a hint to understand how the skill can be
    // used. (e.g. "I need a recipe for bread")
    examples?: string[]; // example prompts for tasks
    // The set of interaction modes that the skill supports
    // (if different than the default)
    inputModes?: string[]; // supported mime types for input
    outputModes?: string[]; // supported mime types for output
  }[];
}
