import { create, useStore } from "zustand";

interface GameState {
  phase: "idle" | "playing" | "warping" | "gameOver" | "resetShipPosition";
  score: number;
  health: number;
  currentSector: number;
  waypointsCollected: number;
  cameraMode: "thirdPerson" | "firstPerson";
  isRacing: boolean;
  toggleTrackMode: () => void;
  // Separate setter if you need to force a specific mode
  setCameraMode: (mode: "thirdPerson" | "firstPerson") => void;
  showIntro: boolean;
  setShowIntro: (show: boolean) => void;
  warpTextureIndex: number;

  // Actions
  start: () => void;
  enterGate: () => void;
  warpComplete: () => void;
  reset: () => void;
  collectWaypoint: () => void;
  setWarpTextureIndex: (index: number) => void;
}

export const useGame = create<GameState>((set, get) => ({
  phase: "playing",
  score: 0,
  health: 100,
  currentSector: 1,
  waypointsCollected: 0,
  cameraMode: "thirdPerson",
  warpTextureIndex: 0,
  isRacing: false,
  toggleTrackMode: () =>
    set((state) => {
      const newRacingState = !state.isRacing;
      return {
        isRacing: newRacingState,
        // If we start racing, go First Person. If we stop, go Third Person.
        cameraMode: newRacingState ? "firstPerson" : "thirdPerson",
      };
    }),

  setCameraMode: (mode) => set({ cameraMode: mode }),

  setWarpTextureIndex: (i: number) => set({ warpTextureIndex: i }),

  start: () => set({ phase: "playing", score: 0, health: 100 }),

  // Action to increment the counter
  collectWaypoint: () =>
    set((state) => ({
      waypointsCollected: state.waypointsCollected + 1,
    })),

  enterGate: () => {
    const warpPeriod = 6000; // Total warp time in ms
    const nextSector = get().currentSector + 1;

    // 1. Immediately start warping and switch to an EMPTY sector (0)
    set({ phase: "warping", currentSector: 0 });

    // 2. Wait 3 seconds in the empty void
    setTimeout(() => {
      // 3. Teleport ship & Load new sector while STILL in warp phase
      // This happens "behind" the tunnel walls
      set({ phase: "resetShipPosition", currentSector: nextSector });

      // 4. Half a second later, end the warp and start playing
      setTimeout(() => {
        set({ phase: "playing" });
      }, 500);
    }, warpPeriod);
  },

  warpComplete: () => set({ phase: "playing" }),

  reset: () => set({ phase: "idle", currentSector: 1 }),

  showIntro: true,
  setShowIntro: (show: boolean) => set({ showIntro: show }),
}));
