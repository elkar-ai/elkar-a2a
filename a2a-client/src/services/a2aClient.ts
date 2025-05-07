import axios from "axios";
import {
  JSONRPCRequest,
  JSONRPCResponse,
  TaskSendParams,
  SendTaskResponse,
  GetTaskResponse,
  CancelTaskResponse,
  TaskQueryParams,
  TaskIdParams,
  Task,
  createJsonRpcRequest,
  TaskStatusUpdateEvent,
  TaskArtifactUpdateEvent,
  AgentCard,
} from "../types/a2aTypes";

class A2AClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    return headers;
  }

  async getAgentCard(): Promise<AgentCard> {
    const response = await axios.get(`${this.baseUrl}/.well-known/agent.json`);
    return response.data as AgentCard;
  }

  private async sendRequest<T extends JSONRPCResponse<any>, RequestParams>(
    request: JSONRPCRequest<RequestParams>
  ): Promise<T> {
    console.log("Sending request:", JSON.stringify(request, null, 2));
    try {
      const response = await axios.post(this.baseUrl, request, {
        headers: this.getHeaders(),
      });
      return response.data as T;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error("Error response:", error.response.data);
          throw new Error(
            `HTTP Error ${error.response.status}: ${error.response.statusText}`
          );
        } else if (error.request) {
          console.error("No response received:", error.request);
          throw new Error("No response received from server");
        }
      }
      throw new Error(
        `Failed to send request: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  public async sendTask(params: TaskSendParams): Promise<Task> {
    const request = createJsonRpcRequest("tasks/send", params);
    const response = await this.sendRequest<SendTaskResponse, TaskSendParams>(
      request
    );

    if (response.error) {
      throw new Error(`Error sending task: ${response.error.message}`);
    }
    if (!response.result) {
      throw new Error("No task returned");
    }

    return response.result;
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
    const response = await this.sendRequest<GetTaskResponse, TaskQueryParams>(
      request
    );

    if (response.error) {
      throw new Error(`Error getting task: ${response.error.message}`);
    }

    return response.result || null;
  }

  public async cancelTask(params: TaskIdParams): Promise<Task | null> {
    const request = createJsonRpcRequest("tasks/cancel", params);
    const response = await this.sendRequest<CancelTaskResponse, TaskIdParams>(
      request
    );

    if (response.error) {
      throw new Error(`Error canceling task: ${response.error.message}`);
    }

    return response.result || null;
  }

  public async sendStreamingRequest<T, U>(
    request: JSONRPCRequest<T>,
    onChunk: (chunk: U) => void
  ): Promise<void> {
    const response = await axios({
      url: this.baseUrl,
      method: "POST",
      responseType: "stream",
      data: request,
      adapter: "fetch",
      headers: this.getHeaders(),
    });

    if (!response.data) {
      console.error("No stream in response");
      throw new Error("No stream in response");
    }

    const reader = response.data.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const read = await reader.read();
      if (read.done) break;

      buffer += decoder.decode(read.value, { stream: true });

      // Split by newlines and process complete lines
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep the last incomplete line in the buffer

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const jsonStr = line.slice(6); // Remove 'data: ' prefix
            const chunk: JSONRPCResponse<U> = JSON.parse(jsonStr);
            if (chunk.result) {
              onChunk(chunk.result);
            }
            if (chunk.error) {
              throw new Error(chunk.error.message);
            }
          } catch (error) {
            console.error("Error parsing SSE data:", error);
          }
        }
      }
    }
  }

  public async streamTask(
    params: TaskSendParams,
    onUpdate: (update: TaskStatusUpdateEvent | TaskArtifactUpdateEvent) => void
  ): Promise<void> {
    const request = createJsonRpcRequest("tasks/sendSubscribe", params);
    await this.sendStreamingRequest<
      TaskSendParams,
      TaskStatusUpdateEvent | TaskArtifactUpdateEvent
    >(request, onUpdate);
  }
}

export default A2AClient;
