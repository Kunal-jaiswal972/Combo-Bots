import { installShutdownHandlers } from "@/bootstrap/shutdown";
import { runApplication } from "@/bootstrap/runApplication";
import { loadEnvFile } from "@/utils/env/loadEnv";
import { logger } from "@/utils";

loadEnvFile();
installShutdownHandlers();

const main = runApplication();

main.catch((error) => {
  const cause = error instanceof Error ? error : new Error(String(error));
  logger.error("Fatal error:", cause);
  process.exitCode = 1;
});
