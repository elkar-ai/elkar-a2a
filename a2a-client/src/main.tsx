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
import { Toaster } from "react-hot-toast";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <UrlProvider>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            // Define default options
            className: "",
            duration: 5000,
            style: {
              background: "#363636", // Example dark background
              color: "#fff", // Example light text
            },
            // Default options for specific types
            success: {
              duration: 3000,
              theme: {
                primary: "green",
                secondary: "black",
              },
            },
          }}
        />
      </QueryClientProvider>
    </UrlProvider>
  </React.StrictMode>
);
