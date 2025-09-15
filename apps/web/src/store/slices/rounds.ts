import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { useAppSelector, RootState } from "..";

interface Round {
  id: string;
  createdAt: string;
  startAt: string;
  endAt: string;
  totalPoints: number;
  totalTaps: number;
}

interface CurrentRoundResponse {
  serverTime: string;
  status: "active" | "cooldown" | "none";
  round: Round | null;
}

interface RoundsState {
  items: Round[];
  current: CurrentRoundResponse | null;
}

const initialState: RoundsState = {
  items: [],
  current: null,
};

const roundsSlice = createSlice({
  name: "rounds",
  initialState,
  reducers: {
    setRounds(state: RoundsState, action: PayloadAction<Round[]>) {
      state.items = action.payload;
    },
    setCurrent(
      state: RoundsState,
      action: PayloadAction<CurrentRoundResponse | null>
    ) {
      state.current = action.payload;
    },
  },
});

export const { setRounds, setCurrent } = roundsSlice.actions;
export default roundsSlice.reducer;

export const useRounds = () =>
  useAppSelector((state: RootState) => state.rounds.items);
export const useCurrentRound = () =>
  useAppSelector((state: RootState) => state.rounds.current);
