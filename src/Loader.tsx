import { useProgress } from "@react-three/drei";
import { useGame } from "./store/GameStore";

export function Loader() {
  const { active, progress } = useProgress();
  const phase = useGame((state) => state.phase);

  // We only show the loader if assets are actively loading
  // OR if we haven't started the game yet.
  if (!active && phase !== "idle") return null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black transition-opacity duration-1000">
      <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden border border-cyan-900">
        <div
          className="h-full bg-cyan-400 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-4 font-mono text-cyan-500 text-xs tracking-widest uppercase">
        {progress === 100
          ? "Systems Online"
          : `Syncing Data: ${progress.toFixed(0)}%`}
      </p>
    </div>
  );
}
