import { runApplication } from "@/bootstrap/runApplication";
import { installShutdownHandlers } from "@/bootstrap/shutdown";
import { loadEnvFile, logger } from "@/utils";

loadEnvFile();
installShutdownHandlers();

const main = runApplication();

main.catch((error) => {
  const cause = error instanceof Error ? error : new Error(String(error));
  logger.error("Fatal error:", cause);
  process.exitCode = 1;
});
