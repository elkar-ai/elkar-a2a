import React from "react";
import ReactDOM from "react-dom/client";
import App from "./components/App";
import "./index.css";

// Import Fira Code font
import "@fontsource/fira-code/400.css";
import "@fontsource/fira-code/500.css";
import "@fontsource/fira-code/600.css";
import { UrlProvider } from "./contexts/UrlContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <UrlProvider>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </UrlProvider>
  </React.StrictMode>
);
