import { useGame } from "./store/GameStore";

export default function Interface() {
  const score = useGame((state) => state.score);
  const phase = useGame((state) => state.phase);

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
      {/* HUD Score */}
      <div className="p-8 text-white text-4xl font-mono">
        SECTOR_0{useGame((s) => s.currentSector)} // SCORE: {score}
      </div>

      {/* Warp Flash Overlay */}
      {phase === "warping" && (
        <div className="absolute inset-0 bg-white animate-pulse opacity-20" />
      )}

      {phase === "idle" && (
        <div className="grid place-items-center h-full pointer-events-auto">
          <button className="px-8 py-4 bg-cyan-500 text-black font-bold text-2xl">
            ENGAGE ENGINES
          </button>
        </div>
      )}
    </div>
  );
}

export function WarpTunnelUI() {
  const phase = useGame((state) => state.phase);

  return (
    <div
      className={`
      absolute inset-0 pointer-events-none transition-all duration-700
      ${phase === "warping" ? "bg-white opacity-40 scale-110" : "bg-transparent opacity-0 scale-100"}
    `}
    >
      {/* You can add "Speed Lines" or "Motion Blur" CSS here */}
      <div className="absolute inset-0 bg-[radial-gradient(circle,_transparent_20%,_white_100%)]" />
    </div>
  );
}
