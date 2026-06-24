# Auto Code Redeemer v2 — Implementation Plan

> User docs: **[README.md](./README.md)** · Agent rules: **[AGENTS.md](./AGENTS.md)** · Restructure (Phases 1–5 complete): **[Restructure.md](./Restructure.md)**

## Phase 1 — CAPTCHA Portal (noVNC) ⏳ NOT STARTED

> **Goal:** When the MAL bot hits a CAPTCHA or login challenge on Azure, pause the workflow and send the active adapter (Telegram DM or CLI) a short-lived URL. Opening the URL shows a live, interactive view of the Chrome window running on the server via noVNC. The user solves the CAPTCHA or completes login, the bot detects login success, and resumes automatically.

### How it works end-to-end

```
Azure Docker container
  Xvfb :99  ←  virtual display (started by entrypoint.sh before Node.js)
  Chrome (DISPLAY=:99, no --headless flag)

  [when login failure / CAPTCHA detected in malLogin.ts]
    x11vnc      captures Xvfb :99 → VNC on port 5900
    websockify  bridges VNC → WebSocket + serves noVNC HTML on port 6080
    cloudflared tunnels port 6080 → public HTTPS URL

    URL sent to adapter → Telegram DM or CLI print
    User opens URL → sees Chrome window → interacts
    Bot polls getLoggedInMalUsername() every 5s
    Login confirmed → portal tears down, bot resumes
    Timeout (2 min) → falls back to manualLoginToMal
```

### Step 1.1 — Dockerfile: add display stack

**Build**

- [ ] Add to runtime `apt-get install`: `xvfb x11vnc novnc python3-websockify`
- [ ] Download `cloudflared` binary (amd64) into `/usr/local/bin/`
- [ ] Change `ENV HEADLESS=true` → `ENV HEADLESS=false` (Xvfb replaces headless mode)
- [ ] Create `docker-entrypoint.sh` (project root):
  ```sh
  #!/bin/sh
  Xvfb :99 -screen 0 1280x800x24 &
  export DISPLAY=:99
  sleep 1
  exec node dist/index.js "$@"
  ```
- [ ] Replace `CMD ["node", "dist/index.js"]` with `ENTRYPOINT ["/entrypoint.sh"]` in Dockerfile
- [ ] `COPY docker-entrypoint.sh /entrypoint.sh` + `chmod +x`

**Verify**

- [ ] `docker compose build` succeeds
- [ ] `docker compose up` starts without errors; Chrome launches with DISPLAY=:99

---

### Step 1.2 — Chrome launcher: inherit DISPLAY

File: `src/tools/browser/launch/launcher.ts`

**Build**

- [ ] In `spawnChrome`, add explicit `env: { ...process.env }` to the spawn options so `DISPLAY=:99` flows from the entrypoint into the Chrome child process

**Verify**

- [ ] `npm run typecheck` passes
- [ ] In container, Chrome window visible via x11vnc (spot-check with `x11vnc -display :99`)

---

### Step 1.3 — New service: `src/services/captcha-portal/`

**Build**

- [ ] `processManager.ts` — spawn/kill helpers:
  - `startX11vnc(display, vncPort)` → `ChildProcess`
  - `startWebsockify(vncPort, wsPort, noVncWebDir)` → `ChildProcess`
  - `killAll(procs)` → void
- [ ] `tunnelClient.ts`:
  - `startTunnel(localPort)` → `Promise<{ url: string; kill: () => void }>`
  - Spawns `cloudflared tunnel --url http://localhost:6080`
  - Parses tunnel URL from stderr (regex: `/https:\/\/[a-z0-9-]+\.trycloudflare\.com/`)
- [ ] `captchaPortal.ts` — main orchestrator:
  ```ts
  interface CaptchaPortalHandle {
    url: string;
    waitForResolution(
      pollFn: () => Promise<boolean>,
      pollIntervalMs?: number,
      timeoutMs?: number,
    ): Promise<"resolved" | "timeout">;
    close(): void;
  }
  async function openCaptchaPortal(): Promise<CaptchaPortalHandle>
  ```
  Internally: start x11vnc + websockify → start cloudflared → build noVNC URL → return handle.

  noVNC URL format:
  `${tunnelUrl}/vnc_lite.html?host=${tunnelHost}&port=443&encrypt=1&autoconnect=1`
- [ ] `index.ts` — barrel exporting `openCaptchaPortal`, `CaptchaPortalHandle`

**Verify**

- [ ] `npm run typecheck` passes
- [ ] Manual test: call `openCaptchaPortal()` in container, open returned URL in browser, Chrome window visible and interactive

---

### Step 1.4 — Bot integration: `malLogin.ts`

**Build**

- [ ] After `autoLoginToMal` + re-check returns username null, and before `manualLoginToMal`, add portal branch:
  ```ts
  if (process.env.DISPLAY) {
    const portal = await openCaptchaPortal();
    prompt.warn(`Login failed or CAPTCHA detected. Open this link:\n${portal.url}`);
    const result = await portal.waitForResolution(
      async () => (await getLoggedInMalUsername(page)) !== null,
      5_000,
      120_000,
    );
    portal.close();
    if (result === "resolved") return;
    prompt.warn("Portal timed out. Falling back to manual login.");
  }
  await manualLoginToMal(page, prompt);
  ```
- [ ] Portal is skipped on Windows local dev (`DISPLAY` not set) — existing flow unchanged

**Verify**

- [ ] `npm run typecheck` passes
- [ ] Local dev (no DISPLAY): login works as before, no portal spawned
- [ ] Container: failed login triggers portal URL in Telegram / CLI; user can solve in browser

---

### File tree

```
src/services/captcha-portal/
├── processManager.ts     spawn/kill x11vnc + websockify
├── tunnelClient.ts       cloudflared wrapper, URL parsing
├── captchaPortal.ts      openCaptchaPortal(), CaptchaPortalHandle
└── index.ts              barrel

docker-entrypoint.sh      new — Xvfb startup + exec node
Dockerfile                modified — new apt packages, cloudflared, entrypoint
```

Files modified:
- `src/tools/browser/launch/launcher.ts` — explicit `env: { ...process.env }` in spawnChrome
- `src/bots/mal-friend-request-sender/functions/malLogin.ts` — portal trigger after failed auto-login

### What does NOT change

| | Notes |
|--|--|
| Chrome headless flags | Already conditional on `options.headless` — no change |
| Adapter/bot interface | `prompt.warn()` used to send URL — no new PromptPort methods |
| Session persistence | Chrome user-data-dir already persists cookies |
| Local dev (Windows) | `DISPLAY` not set → portal skipped, manual login unchanged |

---

## Roadmap — Input adapters


| Adapter                           | Status     |
| --------------------------------- | ---------- |
| Terminal CLI (Run now + Schedule) | ✅ Complete |
| Telegram bot                      | ✅ Complete |
| REST API                          | 🔮 Future  |
| Discord bot                       | 🔮 Future  |


---

## Future TODO

- workflow based bot for code redeem
-- log out for bot as well
-- check log in same as mal bot

- scheduler should run independent and process many tasks for many bots and users at once 

- authentication
- each bot session should have an account tied to a browser only and user have to first log in into the service then use any bot
-- same account can't be logined before terminating existing session
-- sessin terminate when user send stop from telegram etc and add one stop in cli adapter as well (exit can be refactored to terminate bot session not the entire program)

### Email reporting

- [ ] `src/infrastructure/reporting/emailReporter.ts`
- [ ] Subscribe to `WorkflowEvent` on event bus (post-run hook)

---


