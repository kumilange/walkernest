import { Toaster } from "@/components/ui/toaster";
import Header from "@/layouts/header";
import CityMap from "@/features/map/components/CityMap";
import ErrorBoundary from "@/components/error/error-boundary";
import "@/styles/reset.css";
import "@/styles/globals.css";
import "@/styles/index.css";
import "maplibre-gl/dist/maplibre-gl.css";
import "@/styles/maplibre-gl-extend.css";
import { useAtomCity } from "./stores";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/api";

export default function App() {
  const { setCity } = useAtomCity();

  return (
    <>
      <Toaster />
      <Header />
      <ErrorBoundary onReset={() => setCity(null)}>
        <main className="w-screen h-screen overflow-hidden">
          <CityMap />
        </main >
      </ErrorBoundary>
    </>
  );
}
