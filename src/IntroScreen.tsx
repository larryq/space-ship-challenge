/* eslint-disable react-hooks/purity */
// IntroScreen.tsx
import { useGame } from "./store/GameStore";

export default function IntroScreen() {
  const showIntro = useGame((state) => state.showIntro);
  const setShowIntro = useGame((state) => state.setShowIntro);

  if (!showIntro) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(ellipse at center, rgba(0,10,30,0.92) 0%, rgba(0,0,10,0.97) 100%)",
        backdropFilter: "blur(6px)",
        fontFamily: "'Courier New', monospace",
      }}
    >
      {/* Starfield dots for atmosphere */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        {Array.from({ length: 80 }).map((_, i) => (
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

      {/* Main card */}
      <div
        style={{
          position: "relative",
          maxWidth: 560,
          width: "90%",
          padding: "48px 52px",
          border: "1px solid rgba(0, 200, 255, 0.3)",
          borderRadius: 4,
          background: "rgba(0, 5, 20, 0.8)",
          boxShadow:
            "0 0 60px rgba(0, 150, 255, 0.15), inset 0 0 40px rgba(0, 100, 200, 0.05)",
          textAlign: "center",
          color: "white",
        }}
      >
        {/* Title */}
        <div
          style={{
            fontSize: 11,
            letterSpacing: 6,
            color: "rgba(0, 200, 255, 0.6)",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          — SECTOR COMMAND —
        </div>
        <h1
          style={{
            fontSize: 42,
            fontWeight: 700,
            margin: "0 0 4px",
            letterSpacing: 3,
            color: "white",
            textShadow:
              "0 0 30px rgba(0, 180, 255, 0.8), 0 0 60px rgba(0, 100, 255, 0.4)",
          }}
        >
          SPACE EXPLORER
        </h1>
        <div
          style={{
            height: 1,
            background:
              "linear-gradient(to right, transparent, rgba(0,200,255,0.5), transparent)",
            margin: "20px 0 28px",
          }}
        />

        {/* Intro text */}
        <p
          style={{
            fontSize: 16,
            lineHeight: 1.8,
            color: "rgba(180, 220, 255, 0.85)",
            margin: "0 0 28px",
          }}
        >
          Welcome to Space Explorer! Fly around each sector and enjoy the
          scenery. Try a track course if you'd like — and when ready, fly
          through a glowing <span style={{ color: "#00ff88" }}>Stargate</span>{" "}
          to move on to the next sector.
        </p>

        {/* Controls */}
        <div
          style={{
            background: "rgba(0, 30, 60, 0.6)",
            border: "1px solid rgba(0, 150, 255, 0.2)",
            borderRadius: 4,
            padding: "16px 24px",
            marginBottom: 32,
            textAlign: "left",
          }}
        >
          <div
            style={{
              fontSize: 12,
              letterSpacing: 4,
              color: "rgba(0, 200, 255, 0.9)",
              marginBottom: 12,
              textTransform: "uppercase",
            }}
          >
            Controls
          </div>
          {[
            ["Shift", "Thrust"],
            ["↑ / ↓", "Pitch up / down"],
            ["← / →", "Turn left / right"],
          ].map(([key, action]) => (
            <div
              key={key}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
                fontSize: 14,
              }}
            >
              <span
                style={{
                  background: "rgba(0, 100, 200, 0.3)",
                  border: "1px solid rgba(0, 150, 255, 0.3)",
                  borderRadius: 3,
                  padding: "2px 10px",
                  color: "rgba(150, 210, 255, 1)",
                  fontFamily: "monospace",
                  fontSize: 14,
                }}
              >
                {key}
              </span>
              <span style={{ color: "rgba(180, 210, 255, 0.9)" }}>
                {action}
              </span>
            </div>
          ))}
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 13,
            letterSpacing: 5,
            color: "rgba(0, 255, 150, 0.9)",
            textTransform: "uppercase",
            marginBottom: 32,
          }}
        >
          ✦ Good Luck, Explorer ✦
        </div>

        {/* Start button */}
        <button
          onClick={() => setShowIntro(false)}
          style={{
            background: "transparent",
            border: "1px solid rgba(0, 255, 150, 0.6)",
            borderRadius: 3,
            color: "rgba(0, 255, 150, 0.9)",
            fontSize: 13,
            letterSpacing: 5,
            textTransform: "uppercase",
            padding: "14px 48px",
            cursor: "pointer",
            boxShadow: "0 0 20px rgba(0, 255, 150, 0.2)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget;
            el.style.background = "rgba(0, 255, 150, 0.1)";
            el.style.boxShadow = "0 0 40px rgba(0, 255, 150, 0.4)";
            el.style.color = "rgba(0, 255, 150, 1)";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget;
            el.style.background = "transparent";
            el.style.boxShadow = "0 0 20px rgba(0, 255, 150, 0.2)";
            el.style.color = "rgba(0, 255, 150, 0.9)";
          }}
        >
          LAUNCH
        </button>
      </div>
    </div>
  );
}
