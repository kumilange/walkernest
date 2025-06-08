import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import webfontDownload from "vite-plugin-webfont-dl";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Force the correct development values if in development mode
  const finalEnv =
    mode === "development"
      ? {
          ...env,
          VITE_API_DOMAIN: "localhost:3000",
          VITE_API_PROTOCOL: "http",
        }
      : env;

  return {
    plugins: [
      react(),
      webfontDownload([
        "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;600&display=swap",
        "https://fonts.googleapis.com/css2?family=Bungee+Tint&:wght@400&display=swap",
      ]),
    ],
    server: {
      host: true, // Listen on all network interfaces
      port: 5173,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      "import.meta.env.VITE_API_DOMAIN": JSON.stringify(finalEnv.VITE_API_DOMAIN),
      "import.meta.env.VITE_API_PROTOCOL": JSON.stringify(finalEnv.VITE_API_PROTOCOL),
      "import.meta.env.VITE_MAPTILER_API_KEY": JSON.stringify(finalEnv.VITE_MAPTILER_API_KEY),
    },
  };
});
