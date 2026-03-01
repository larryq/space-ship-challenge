import { Canvas } from "@react-three/fiber";
import { KeyboardControls } from "@react-three/drei";
import { Suspense } from "react";
import Experience from "./Experience";
import Interface from "./Interface"; // Your 2D HUD
import { Stats } from "@react-three/drei";
import IntroScreen from "./IntroScreen";
export default function App() {
  return (
    // Define your key map once at the top level
    <KeyboardControls
      map={[
        { name: "forward", keys: ["ArrowUp", "KeyW"] },
        { name: "backward", keys: ["ArrowDown", "KeyS"] },
        { name: "left", keys: ["ArrowLeft", "KeyA"] },
        { name: "right", keys: ["ArrowRight", "KeyD"] },
        { name: "shift", keys: ["ShiftLeft", "ShiftRight"] },
        { name: "level", keys: ["Space"] },
      ]}
    >
      <div style={{ width: "100vw", height: "100vh", background: "#000" }}>
        {/* THE 3D WORLD */}
        <Canvas
          shadows
          camera={{ fov: 45, near: 0.1, far: 12000, position: [0, 5, 12] }}
        >
          {/* <Stats /> */}
          <Suspense fallback={null}>
            <Experience />
          </Suspense>
        </Canvas>
        <IntroScreen />
        {/* //THE 2D UI (Overlayed on top)
        <Interface /> */}
      </div>
    </KeyboardControls>
  );
}
