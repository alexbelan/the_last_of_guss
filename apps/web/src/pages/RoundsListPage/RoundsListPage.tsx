import { Button, Card, Group, Loader, Stack, Text, Title } from "@mantine/core";
import { Link } from "react-router-dom";
import { useRoundsListPage } from "./hooks/useRoundsListPage";

export function RoundsListPage() {
  const { rounds, loading, canCreate, onCreateRound, serverNow } =
    useRoundsListPage();

  function formatCountdown(ms: number) {
    if (ms < 0) ms = 0;
    const sec = Math.floor(ms / 1000);
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>Список раундов</Title>
        {canCreate && (
          <Button onClick={onCreateRound} loading={loading} disabled={loading}>
            Создать раунд
          </Button>
        )}
      </Group>
      <Stack>
        {loading && rounds.length === 0 && (
          <Group justify="center" py="lg">
            <Loader size="sm" />
            <Text c="dimmed">Загрузка...</Text>
          </Group>
        )}
        {rounds.map((round) => {
          const now = serverNow ?? new Date();
          const start = new Date(round.startAt);
          const end = new Date(round.endAt);
          const isCooldown = now < start;
          const isActive = now >= start && now < end;
          const statusLabel = isCooldown
            ? "Cooldown"
            : isActive
            ? "Активен"
            : "Завершен";
          const countdown = isCooldown
            ? formatCountdown(start.getTime() - now.getTime())
            : isActive
            ? formatCountdown(end.getTime() - now.getTime())
            : null;

          return (
            <Card key={round.id} withBorder>
              <Stack gap={4}>
                <Text>
                  <b>Round ID:</b>{" "}
                  <Link to={`/rounds/${round.id}`}>{round.id}</Link>
                </Text>
                <Text>Start: {new Date(round.startAt).toLocaleString()}</Text>
                <Text>End: {new Date(round.endAt).toLocaleString()}</Text>
                <Text c="dimmed">Статус: {statusLabel}</Text>
                {countdown && (
                  <Text c="dimmed">
                    {isCooldown ? "До начала: " : "До конца: "}
                    {countdown}
                  </Text>
                )}
              </Stack>
            </Card>
          );
        })}
        {!loading && rounds.length === 0 && (
          <Text c="dimmed">Раундов пока нет</Text>
        )}
      </Stack>
    </Stack>
  );
}
