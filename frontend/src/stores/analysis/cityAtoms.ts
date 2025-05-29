import { atom, useAtom } from "jotai";

const cityAtom = atom<string | null>(null);

export function useAtomCity() {
  const [city, setCity] = useAtom(cityAtom);
  return { city, setCity };
}
