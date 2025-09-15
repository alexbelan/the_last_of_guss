import { Outlet, Link, useNavigate } from "react-router-dom";
import { AppShell, Group, Button, Text } from "@mantine/core";
import { useAppDispatch } from "@/store/index";
import { logout, useAuthRole, useAuthUsername } from "@/store/slices/auth";

export function AppLayout() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const authUsername = useAuthUsername();
  const authRole = useAuthRole();

  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Group justify="space-between" px="md" h="100%">
          <Group>
            <Link to="/rounds">
              <Text fw={700}>The Last of Guss</Text>
            </Link>
          </Group>
          <Group>
            {authUsername ? (
              <>
                <Text>
                  {authUsername} ({authRole})
                </Text>
                <Button
                  size="xs"
                  variant="light"
                  onClick={() => {
                    dispatch(logout());
                    navigate("/login");
                  }}
                >
                  Выйти
                </Button>
              </>
            ) : (
              <Button size="xs" component={Link} to="/login">
                Войти
              </Button>
            )}
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
