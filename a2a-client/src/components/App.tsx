import React, { useState, useEffect } from "react";
import { ThemeProvider } from "../styles/ThemeProvider";
import Layout from "./Layout";
import Header from "./Header";
import MethodNav from "./MethodNav";
import SessionManager from "./SessionManager";
import SendTaskPanel from "./SendTaskPanel";
import GetTaskPanel from "./GetTaskPanel";
import StreamingTaskPanel from "./StreamingTaskPanel";
import TaskResultPanel from "./TaskResultPanel";
import ErrorMessage from "./ErrorMessage";
import A2AClient from "../services/a2aClient";
import { Task, SendTaskStreamingResponse } from "../types/a2aTypes";

// Define tab types
type TabType = "sendTask" | "getTask" | "streaming";

const App: React.FC = () => {
  const [serverUrl, setServerUrl] = useState<string>("http://localhost:8000");
  const [apiKey, setApiKey] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [streamingMessage, setStreamingMessage] = useState<string>("");
  const [taskId, setTaskId] = useState<string>("");
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<A2AClient | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [savedSessions, setSavedSessions] = useState<
    { id: string; name: string }[]
  >([]);
  const [sessionName, setSessionName] = useState<string>("");
  const [activeTab, setActiveTab] = useState<TabType>("sendTask");
  const [streamingUpdates, setStreamingUpdates] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);

  useEffect(() => {
    // Initialize client when serverUrl or apiKey changes
    const newClient = new A2AClient(
      serverUrl,
      apiKey.trim() === "" ? null : apiKey
    );
    setClient(newClient);

    // Load saved sessions from localStorage
    const savedSessionsData = localStorage.getItem("savedSessions");
    if (savedSessionsData) {
      setSavedSessions(JSON.parse(savedSessionsData));
    }
  }, [serverUrl, apiKey]);

  // Update sessionId when a task is loaded
  useEffect(() => {
    if (task?.sessionId) {
      setSessionId(task.sessionId);
    }
  }, [task]);

  const handleSendTask = async () => {
    if (!client) return;
    if (!message.trim()) {
      setError("Please enter a message");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const result = await client.sendTask(message, sessionId);
      setTask(result);
      if (result) {
        setTaskId(result.id);
        if (result.sessionId) {
          setSessionId(result.sessionId);
        }
      }
    } catch (error) {
      setError(
        `Failed to send task: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGetTask = async () => {
    if (!client) return;
    if (!taskId.trim()) {
      setError("Please enter a task ID");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const result = await client.getTask(taskId);
      setTask(result);
    } catch (error) {
      setError(
        `Failed to get task: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTask = async () => {
    if (!client) return;
    if (!taskId.trim()) {
      setError("Please enter a task ID");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const result = await client.cancelTask(taskId);
      setTask(result);
    } catch (error) {
      setError(
        `Failed to cancel task: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStreamTask = async () => {
    if (!client) return;
    if (!streamingMessage.trim()) {
      setError("Please enter a message");
      return;
    }

    setError(null);
    setIsStreaming(true);
    setStreamingUpdates([]);

    const handleStreamingUpdate = (update: SendTaskStreamingResponse) => {
      setStreamingUpdates((prev) => [...prev, JSON.stringify(update, null, 2)]);
    };

    try {
      await client.streamTask(
        streamingMessage,
        handleStreamingUpdate,
        sessionId
      );
    } catch (error) {
      setError(
        `Failed to stream task: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const saveSession = () => {
    if (!sessionId) {
      setError("No active session to save");
      return;
    }

    if (!sessionName.trim()) {
      setError("Please enter a session name");
      return;
    }

    const newSavedSessions = [
      ...savedSessions.filter((s) => s.id !== sessionId),
      { id: sessionId, name: sessionName },
    ];

    setSavedSessions(newSavedSessions);
    localStorage.setItem("savedSessions", JSON.stringify(newSavedSessions));
    setSessionName("");
    setError(null);
  };

  const loadSession = (id: string) => {
    setSessionId(id);
    setError(null);
  };

  const deleteSession = (id: string) => {
    const newSavedSessions = savedSessions.filter((s) => s.id !== id);
    setSavedSessions(newSavedSessions);
    localStorage.setItem("savedSessions", JSON.stringify(newSavedSessions));

    if (sessionId === id) {
      setSessionId("");
    }
  };

  const createNewSession = () => {
    setSessionId("");
    setTaskId("");
    setTask(null);
  };

  // Render main content based on active tab
  const renderMainContent = () => {
    let content = null;

    // Render the active tab panel
    if (activeTab === "sendTask") {
      content = (
        <SendTaskPanel
          message={message}
          loading={loading}
          onMessageChange={setMessage}
          onSendTask={handleSendTask}
        />
      );
    } else if (activeTab === "getTask") {
      content = (
        <GetTaskPanel
          taskId={taskId}
          loading={loading}
          onTaskIdChange={setTaskId}
          onGetTask={handleGetTask}
          onCancelTask={handleCancelTask}
        />
      );
    } else if (activeTab === "streaming") {
      content = (
        <StreamingTaskPanel
          message={streamingMessage}
          isStreaming={isStreaming}
          streamingUpdates={streamingUpdates}
          onMessageChange={setStreamingMessage}
          onStreamTask={handleStreamTask}
        />
      );
    }

    return (
      <>
        {content}
        {error && <ErrorMessage message={error} />}
        {task && <TaskResultPanel task={task} />}
      </>
    );
  };

  return (
    <ThemeProvider>
      <Layout
        header={
          <Header
            serverUrl={serverUrl}
            apiKey={apiKey}
            onServerUrlChange={setServerUrl}
            onApiKeyChange={setApiKey}
          />
        }
        sidebar={
          <>
            <MethodNav activeTab={activeTab} onTabChange={setActiveTab} />
            <SessionManager
              sessionId={sessionId}
              sessionName={sessionName}
              savedSessions={savedSessions}
              onSessionNameChange={setSessionName}
              onCreateNewSession={createNewSession}
              onSaveSession={saveSession}
              onLoadSession={loadSession}
              onDeleteSession={deleteSession}
            />
          </>
        }
        main={renderMainContent()}
      />
    </ThemeProvider>
  );
};

export default App;
