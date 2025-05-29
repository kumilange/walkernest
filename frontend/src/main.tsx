import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { MapProvider } from "react-map-gl/maplibre";
import { queryClient } from "@/lib/api";
import App from "./app";
import { ErrorBoundary } from "@/components/error";

ReactDOM.createRoot(document.getElementById("app") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary onReset={() => { window.location.reload() }}>
      <QueryClientProvider client={queryClient}>
        <MapProvider>
          <App />
        </MapProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
