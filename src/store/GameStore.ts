import { create, useStore } from "zustand";

interface GameState {
  phase: "idle" | "playing" | "warping" | "gameOver" | "resetShipPosition";
  score: number;
  health: number;
  currentSector: number;
  waypointsCollected: number;

  // Actions
  start: () => void;
  enterGate: () => void;
  warpComplete: () => void;
  reset: () => void;
  collectWaypoint: () => void;
}

export const useGame = create<GameState>((set, get) => ({
  phase: "playing",
  score: 0,
  health: 100,
  currentSector: 1,
  waypointsCollected: 0,

  start: () => set({ phase: "playing", score: 0, health: 100 }),

  // Action to increment the counter
  collectWaypoint: () =>
    set((state) => ({
      waypointsCollected: state.waypointsCollected + 1,
    })),

  enterGate: () => {
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
    }, 3000);
  },

  warpComplete: () => set({ phase: "playing" }),

  reset: () => set({ phase: "idle", currentSector: 1 }),
}));
