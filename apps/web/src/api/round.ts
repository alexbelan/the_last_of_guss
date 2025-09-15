import api from "./client";

export type Round = {
  id: string;
  createdAt: string;
  startAt: string;
  endAt: string;
  totalPoints: number;
  totalTaps: number;
};

export async function createRound() {
  const { data } = await api.post("/rounds");
  return data as Round;
}

export async function listRounds(
  status?: "active" | "cooldown" | "finished",
  cursorId?: string | null,
  limit?: number
) {
  const { data } = await api.get("/rounds", {
    params: { status, cursorId, limit },
  });
  return data as {
    serverTime: string;
    items: Round[];
    nextCursor: string | null;
  };
}

export async function tap(roundId: string) {
  const { data } = await api.post(`/rounds/${roundId}/tap`);
  return data as {
    award: number;
    my_taps: number;
    my_points: number;
    round_points: number;
    round_taps: number;
  };
}

export async function getRoundFull(roundId: string) {
  const { data } = await api.get(`/rounds/${roundId}/full`);
  return data as {
    serverTime: string;
    status: "active" | "cooldown" | "finished";
    round: Round;
    totals: { totalPoints: number; totalTaps: number };
    winner: { username: string; points: number; taps: number } | null;
    my: { taps: number; points: number } | null;
  };
}
