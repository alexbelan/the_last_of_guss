import { Button, Card, Group, Loader, Stack, Text, Title } from "@mantine/core";
import { Link } from "react-router-dom";
import { useRoundsListPage } from "./hooks/useRoundsListPage";

export function RoundsListPage() {
  const { rounds, loading, canCreate, onCreateRound } = useRoundsListPage();

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
        {rounds.map((round) => (
          <Card key={round.id} withBorder>
            <Stack gap={4}>
              <Text>
                <b>Round ID:</b>{" "}
                <Link to={`/rounds/${round.id}`}>{round.id}</Link>
              </Text>
              <Text>Start: {new Date(round.startAt).toLocaleString()}</Text>
              <Text>End: {new Date(round.endAt).toLocaleString()}</Text>
              <Text c="dimmed">
                Статус:{" "}
                {(() => {
                  const now = new Date();
                  const start = new Date(round.startAt);
                  const end = new Date(round.endAt);
                  if (now < start) return "Cooldown";
                  if (now >= start && now < end) return "Активен";
                  return "Завершен";
                })()}
              </Text>
            </Stack>
          </Card>
        ))}
        {!loading && rounds.length === 0 && (
          <Text c="dimmed">Раундов пока нет</Text>
        )}
      </Stack>
    </Stack>
  );
}
