import { isRouteErrorResponse, useRouteError, Link } from "react-router-dom";
import { Button, Stack, Text, Title } from "@mantine/core";

export function RootErrorBoundary() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : (error as Error | undefined)?.message || "Unknown error";

  return (
    <Stack align="center" py="xl">
      <Title order={2}>Ошибка</Title>
      <Text c="red">{message}</Text>
      <Button component={Link} to="/" variant="light">
        На главную
      </Button>
    </Stack>
  );
}
