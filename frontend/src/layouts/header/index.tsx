import MenuBar from "@/features/map/components/MenuBar";
import Heading from "./components/Heading";

export default function Header() {
  return (
    <header className="fixed top-0 right-0 left-0 z-10 flex h-12 w-screen items-center bg-primary p-2 shadow-md">
      <Heading />
      <MenuBar />
    </header>
  );
}
