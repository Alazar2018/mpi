import { create } from "zustand";

export type Tracker = {
	match: {sets: {games: {points: []}}} | null,
	serving: string | null,
	setServing: (playerId: string) => void
}

export const useMatchTrackerStore = create<Tracker>((set) => ({
	match: null,
	serving: null,
	setServing: (playerId: string) => set({serving: playerId})
}));