import { ErrorBoundary } from "@/components/error";
import { queryClient } from "@/lib/api";
import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { MapProvider } from "react-map-gl/maplibre";
import App from "./app";

ReactDOM.createRoot(document.getElementById("app") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary
      onReset={() => {
        window.location.reload();
      }}
    >
      <QueryClientProvider client={queryClient}>
        <MapProvider>
          <App />
        </MapProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
