import { useCallback, useEffect, useRef, useState } from "react";
import { notifications } from "@mantine/notifications";
import { createRound, listRounds } from "@/api/index";
import { useAppDispatch } from "@/store/index";
import { setRounds } from "@/store/slices/rounds";
import { useAuthRole } from "@/store/slices/auth";
import { useRounds } from "@/store/slices/rounds";

export function useRoundsListPage() {
  const dispatch = useAppDispatch();
  const rounds = useRounds();
  const authRole = useAuthRole();
  const [loading, setLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const isLoadingMoreRef = useRef(false);

  const loadRounds = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listRounds(undefined, null, 20);
      dispatch(setRounds(res.items));
      setHasMore(Boolean(res.nextCursor));
      setNextCursor(res.nextCursor);
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    loadRounds();
  }, []);

  // Infinite scroll (client-side: pageless API -> we append same list once, demo-style)
  useEffect(() => {
    const onScroll = async () => {
      if (isLoadingMoreRef.current || !hasMore) return;
      const nearBottom =
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 200;
      if (nearBottom) {
        isLoadingMoreRef.current = true;
        try {
          if (!nextCursor) return setHasMore(false);
          const res = await listRounds(undefined, nextCursor, 20);
          // На клиенте уникализируем по id, чтобы не было дублей
          const existingIds = new Set(rounds.map((r) => r.id));
          const merged = [
            ...rounds,
            ...res.items.filter((r) => !existingIds.has(r.id)),
          ];
          dispatch(setRounds(merged));
          setHasMore(Boolean(res.nextCursor));
          setNextCursor(res.nextCursor);
        } finally {
          isLoadingMoreRef.current = false;
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [dispatch, hasMore, rounds, nextCursor]);

  const canCreate = authRole === "admin";

  const onCreateRound = async () => {
    try {
      await createRound();
      notifications.show({ color: "green", message: "Раунд создан" });
      await loadRounds();
    } catch {
      notifications.show({ color: "red", message: "Ошибка создания раунда" });
    }
  };

  return { rounds, loading, canCreate, onCreateRound };
}
