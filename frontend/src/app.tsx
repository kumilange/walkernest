import ErrorBoundary from "@/components/error/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import CityMap from "@/features/map/components/CityMap";
import Header from "@/layouts/header";
import "@/styles/reset.css";
import "@/styles/globals.css";
import "@/styles/index.css";
import "maplibre-gl/dist/maplibre-gl.css";
import "@/styles/maplibre-gl-extend.css";
import { queryClient } from "@/lib/api";
import { QueryClientProvider } from "@tanstack/react-query";
import { useAtomCity } from "./stores";

export default function App() {
  const { setCity } = useAtomCity();

  return (
    <>
      <Toaster />
      <Header />
      <ErrorBoundary onReset={() => setCity(null)}>
        <main className="w-screen h-screen overflow-hidden">
          <CityMap />
        </main>
      </ErrorBoundary>
    </>
  );
}
