import api from "./client";

export async function login(username: string, password: string) {
  const { data } = await api.post("/auth/login", { username, password });
  return data as {
    accessToken: string;
    user: { username: string; role: "admin" | "survivor" | "banned" };
  };
}

export async function me() {
  const { data } = await api.get("/auth/me");
  return data as {
    user: { username: string; role: "admin" | "survivor" | "banned" };
  };
}
