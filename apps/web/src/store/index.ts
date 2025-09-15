import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/auth";
import roundsReducer from "./slices/rounds";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    rounds: roundsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// typed hooks
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
