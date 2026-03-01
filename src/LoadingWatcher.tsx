// LoadingWatcher.tsx
import { useProgress } from "@react-three/drei";
import { useEffect } from "react";
import { useGame } from "./store/GameStore";

export function LoadingWatcher() {
  const { active } = useProgress();
  const setIsLoaded = useGame((state) => state.setIsLoaded);

  useEffect(() => {
    if (!active) setIsLoaded(true);
  }, [active, setIsLoaded]);

  return null;
}
