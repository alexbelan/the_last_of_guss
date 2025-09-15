import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getRoundFull, tap, type Round } from "@/api/index";
import { useAuthToken } from "@/store/slices/auth";

function formatCountdown(ms: number) {
  if (ms < 0) ms = 0;
  const sec = Math.floor(ms / 1000);
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export function useRoundPage() {
  const { id: roundId } = useParams();
  const token = useAuthToken();
  const [myStats, setMyStats] = useState<{
    my_taps: number;
    my_points: number;
    round_points: number;
    round_taps: number;
  } | null>(null);
  const [roundMeta, setRoundMeta] = useState<Pick<
    Round,
    "startAt" | "endAt"
  > | null>(null);
  const [loading, setLoading] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [serverNow, setServerNow] = useState<Date | null>(null);
  const [serverOffsetMs, setServerOffsetMs] = useState<number>(0);
  const [finishedStats, setFinishedStats] = useState<{
    totals: { totalPoints: number; totalTaps: number };
    winner: { username: string; points: number; taps: number } | null;
    my: { taps: number; points: number } | null;
  } | null>(null);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      if (!roundId) return;
      setInitialLoading(true);
      const full = await getRoundFull(roundId);
      setRoundMeta({ startAt: full.round.startAt, endAt: full.round.endAt });
      const server = new Date(full.serverTime);
      setServerNow(server);
      setServerOffsetMs(server.getTime() - Date.now());
      if (full.my || full.totals) {
        setMyStats({
          my_taps: full.my?.taps ?? 0,
          my_points: full.my?.points ?? 0,
          round_points: full.totals.totalPoints,
          round_taps: full.totals.totalTaps,
        });
      }
      if (full.status === "finished") {
        setFinishedStats({
          totals: full.totals,
          winner: full.winner,
          my: full.my,
        });
      }
      setInitialLoading(false);
    };
    load();
  }, [roundId]);

  useEffect(() => {
    const id = setInterval(() => {
      setServerNow(new Date(Date.now() + serverOffsetMs));
    }, 1000);
    return () => clearInterval(id);
  }, [serverOffsetMs]);

  const status = useMemo<"cooldown" | "active" | "finished" | "unknown">(() => {
    if (!roundMeta || !serverNow) return "unknown";
    const start = new Date(roundMeta.startAt);
    const end = new Date(roundMeta.endAt);
    if (serverNow < start) return "cooldown";
    if (serverNow >= start && serverNow < end) return "active";
    return "finished";
  }, [roundMeta, serverNow]);

  const countdown = useMemo(() => {
    if (!roundMeta || !serverNow) return null;
    const start = new Date(roundMeta.startAt);
    const end = new Date(roundMeta.endAt);
    if (status === "cooldown")
      return formatCountdown(start.getTime() - serverNow.getTime());
    if (status === "active")
      return formatCountdown(end.getTime() - serverNow.getTime());
    return null;
  }, [roundMeta, serverNow, status]);

  useEffect(() => {
    const loadFinal = async () => {
      if (!roundId || status !== "finished" || finishedStats) return;
      const full = await getRoundFull(roundId);
      setFinishedStats({
        totals: full.totals,
        winner: full.winner,
        my: full.my,
      });
    };
    loadFinal();
  }, [roundId, status, finishedStats]);

  useEffect(() => {
    if (!serverNow) return;
    const id = setInterval(
      () =>
        setServerNow((t: Date | null) =>
          t ? new Date(t.getTime() + 1000) : t
        ),
      1000
    );
    return () => clearInterval(id);
  }, [serverNow]);

  const onTap = async () => {
    if (!roundId || !token || status !== "active") return;
    setLoading(true);
    setPressed(true);
    try {
      const res = await tap(roundId);
      setMyStats({
        my_taps: res.my_taps,
        my_points: res.my_points,
        round_points: res.round_points,
        round_taps: res.round_taps,
      });
    } finally {
      setTimeout(() => setPressed(false), 120);
      setLoading(false);
    }
  };

  return {
    token,
    myStats,
    roundMeta,
    loading,
    pressed,
    serverNow,
    finishedStats,
    status,
    countdown,
    onTap,
    initialLoading,
  };
}
