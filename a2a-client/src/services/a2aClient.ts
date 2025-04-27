import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import {
  JSONRPCRequest,
  JSONRPCResponse,
  TaskSendParams,
  SendTaskResponse,
  GetTaskResponse,
  CancelTaskResponse,
  TaskQueryParams,
  TaskIdParams,
  SendTaskStreamingResponse,
  Task,
  createJsonRpcRequest,
  createUserMessage,
} from "../types/a2aTypes";

class A2AClient {
  private baseUrl: string;
  private apiKey: string | null;

  constructor(baseUrl: string, apiKey: string | null = null) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    return headers;
  }

  private async sendRequest<T extends JSONRPCResponse>(
    request: JSONRPCRequest
  ): Promise<T> {
    try {
      const response = await axios.post(this.baseUrl, request, {
        headers: this.getHeaders(),
      });
      return response.data as T;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          `HTTP Error ${error.response.status}: ${error.response.statusText}`
        );
      }
      throw new Error(
        `Failed to send request: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  public async sendTask(
    message: string,
    existingSessionId?: string
  ): Promise<Task | null> {
    // Create a new task ID
    const taskId = uuidv4();
    const sessionId = existingSessionId || uuidv4();

    const params: TaskSendParams = {
      id: taskId,
      sessionId,
      message: createUserMessage(message),
    };

    const request = createJsonRpcRequest("tasks/send", params);
    const response = await this.sendRequest<SendTaskResponse>(request);

    if (response.error) {
      throw new Error(`Error sending task: ${response.error.message}`);
    }

    return response.result || null;
  }

  public async getTask(
    taskId: string,
    historyLength?: number
  ): Promise<Task | null> {
    const params: TaskQueryParams = {
      id: taskId,
      historyLength,
    };

    const request = createJsonRpcRequest("tasks/get", params);
    const response = await this.sendRequest<GetTaskResponse>(request);

    if (response.error) {
      throw new Error(`Error getting task: ${response.error.message}`);
    }

    return response.result || null;
  }

  public async cancelTask(taskId: string): Promise<Task | null> {
    const params: TaskIdParams = {
      id: taskId,
    };

    const request = createJsonRpcRequest("tasks/cancel", params);
    const response = await this.sendRequest<CancelTaskResponse>(request);

    if (response.error) {
      throw new Error(`Error canceling task: ${response.error.message}`);
    }

    return response.result || null;
  }

  // Method to handle streaming responses - you would implement WebSocket functionality here
  public async streamTask(
    message: string,
    onUpdate: (update: SendTaskStreamingResponse) => void,
    existingSessionId?: string
  ): Promise<void> {
    // This is a placeholder for WebSocket implementation
    // In a real implementation, you would connect to the WebSocket endpoint and handle streaming
    console.warn("Streaming not implemented in this client");

    // Prevent unused parameter warnings
    void message;
    void onUpdate;
    void existingSessionId;
  }
}

export default A2AClient;
