import { Button, Group, Stack, Text, Title } from "@mantine/core";
import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <Stack align="center" py="xl">
      <Title order={2}>Страница не найдена</Title>
      <Text c="dimmed">Похоже, вы перешли по несуществующему адресу.</Text>
      <Group>
        <Button component={Link} to="/" variant="light">
          На главную
        </Button>
      </Group>
    </Stack>
  );
}
