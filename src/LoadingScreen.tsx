// LoadingScreen.tsx
import { useProgress } from "@react-three/drei";
import { useGame } from "./store/GameStore";

export default function LoadingScreen() {
  const { progress, active } = useProgress();

  const isLoaded = useGame((state) => state.isLoaded);

  if (isLoaded) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(ellipse at center, rgba(0,10,30,0.98) 0%, rgba(0,0,10,1) 100%)",
        fontFamily: "'Courier New', monospace",
        color: "white",
      }}
    >
      {/* Static starfield */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        {Array.from({ length: 100 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: Math.random() * 2 + 1,
              height: Math.random() * 2 + 1,
              borderRadius: "50%",
              background: "white",
              opacity: Math.random() * 0.7 + 0.1,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div style={{ position: "relative", textAlign: "center" }}>
        {/* Blinking ship image */}
        <div
          style={{
            animation: "blink 1.4s ease-in-out infinite",
            marginBottom: 32,
            filter: "drop-shadow(0 0 20px rgba(0, 180, 255, 0.8))",
          }}
        >
          <img
            src="/spaceship.png" // ← swap for your image path
            alt="ship"
            style={{ width: 120, height: "auto" }}
          />
        </div>

        <div
          style={{
            fontSize: 10,
            letterSpacing: 6,
            color: "rgba(0, 200, 255, 0.5)",
            marginBottom: 8,
            textTransform: "uppercase",
          }}
        >
          — INITIALIZING —
        </div>

        <h1
          style={{
            fontSize: 36,
            fontWeight: 700,
            letterSpacing: 3,
            margin: "0 0 32px",
            textShadow:
              "0 0 30px rgba(0, 180, 255, 0.8), 0 0 60px rgba(0, 100, 255, 0.4)",
          }}
        >
          SPACE EXPLORER
        </h1>

        {/* Progress bar */}
        <div
          style={{
            width: 280,
            height: 2,
            background: "rgba(0, 150, 255, 0.15)",
            borderRadius: 2,
            margin: "0 auto 12px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background:
                "linear-gradient(to right, rgba(0,150,255,0.6), rgba(0,220,255,1))",
              borderRadius: 2,
              transition: "width 0.3s ease",
              boxShadow: "0 0 10px rgba(0, 200, 255, 0.8)",
            }}
          />
        </div>

        <div
          style={{
            fontSize: 11,
            letterSpacing: 4,
            color: "rgba(0, 200, 255, 0.5)",
          }}
        >
          {Math.round(progress)}%
        </div>
      </div>

      {/* Blink keyframe */}
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.15; }
        }
      `}</style>
    </div>
  );
}
