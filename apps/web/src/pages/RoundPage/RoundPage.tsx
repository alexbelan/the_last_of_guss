import {
  Button,
  Card,
  Group,
  Image,
  Loader,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import guss from "../../assets/guss.png";
import { useRoundPage } from "./hooks/useRoundPage";

export function RoundPage() {
  const {
    token,
    myStats,
    roundMeta,
    loading,
    pressed,
    finishedStats,
    status,
    countdown,
    onTap,
    initialLoading,
  } = useRoundPage();

  return (
    <Stack>
      <Title order={3}>Раунд</Title>
      <Card withBorder>
        <Stack gap={6}>
          <Group justify="space-between">
            <Text fw={600}>
              {status === "cooldown" && "Cooldown"}
              {status === "active" && "Раунд активен!"}
              {status === "finished" && "Раунд завершен"}
              {status === "unknown" && "Раунд"}
            </Text>
            <Text c="dimmed">{token ? "Имя игрока" : "Гость"}</Text>
          </Group>
          {initialLoading ? (
            <Text c="dimmed">Загрузка...</Text>
          ) : roundMeta ? (
            <>
              <Text>Start: {new Date(roundMeta.startAt).toLocaleString()}</Text>
              <Text>End: {new Date(roundMeta.endAt).toLocaleString()}</Text>
            </>
          ) : null}
        </Stack>
      </Card>

      <Stack align="center" gap={8}>
        <Image
          src={guss}
          alt="tap-duck"
          w={240}
          style={{
            cursor: token && status === "active" ? "pointer" : "not-allowed",
            transform: pressed ? "scale(0.95)" : "scale(1)",
            transition: "transform 120ms ease",
            opacity: token && status === "active" ? 1 : 0.6,
          }}
          onClick={() => !loading && token && status === "active" && onTap()}
        />
        <Group>
          <Button
            disabled={!token || status !== "active"}
            loading={loading}
            onClick={onTap}
          >
            Тапнуть
          </Button>
          {!token && <Text c="dimmed">Войдите, чтобы тапать</Text>}
        </Group>
        {initialLoading && (
          <Group justify="center" py="sm">
            <Loader size="sm" />
            <Text c="dimmed">Загрузка...</Text>
          </Group>
        )}
      </Stack>

      {status === "cooldown" && (
        <Text ta="center" c="dimmed">
          До начала раунда {countdown}
        </Text>
      )}
      {status === "active" && (
        <Stack gap={4} align="center">
          <Text ta="center">До конца осталось: {countdown}</Text>
          {myStats && (
            <>
              <Text ta="center">Очки раунда — {myStats.round_points}</Text>
              <Text ta="center">Мои очки — {myStats.my_points}</Text>
            </>
          )}
        </Stack>
      )}
      {status === "finished" && finishedStats && (
        <Card withBorder>
          <Stack gap={6}>
            <Text>Всего очков: {finishedStats.totals.totalPoints}</Text>
            {finishedStats.winner && (
              <Text>
                Победитель — {finishedStats.winner.username} (
                {finishedStats.winner.points})
              </Text>
            )}
            <Text>Мои очки: {finishedStats.my?.points ?? 0}</Text>
          </Stack>
        </Card>
      )}
    </Stack>
  );
}
