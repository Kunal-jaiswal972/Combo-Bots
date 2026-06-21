export function parseStoredCredentials(raw: unknown): {
  username: string;
  password: string;
  server: string;
} {
  if (typeof raw !== "object" || raw === null) {
    return { username: "", password: "", server: "" };
  }

  const record = raw as Record<string, unknown>;
  return {
    username: typeof record.username === "string" ? record.username : "",
    password: typeof record.password === "string" ? record.password : "",
    server: typeof record.server === "string" ? record.server : "",
  };
}
