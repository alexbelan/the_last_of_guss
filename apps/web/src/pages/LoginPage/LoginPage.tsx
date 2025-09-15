import { Button, Card, Stack, TextInput, Title } from "@mantine/core";
import { useLoginPage } from "./hooks/useLoginPage";

export function LoginPage() {
  const { username, setUsername, password, setPassword, loading, onSubmit } =
    useLoginPage();

  return (
    <Stack align="center" mt="xl">
      <Card w={380} withBorder>
        <Title order={3} mb="md">
          Войти
        </Title>
        <Stack>
          <TextInput
            label="Имя пользователя"
            value={username}
            onChange={(e) => setUsername(e.currentTarget.value)}
          />
          <TextInput
            label="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
          />
          <Button loading={loading} onClick={onSubmit}>
            Войти
          </Button>
        </Stack>
      </Card>
    </Stack>
  );
}
