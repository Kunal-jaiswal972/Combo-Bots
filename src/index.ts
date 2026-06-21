import { registerShutdownHandlers } from "@/shared/tools/browser.js";
import { runApplication } from "@/bootstrap/runApplication.js";
import { loadEnvFile } from "@/shared/utils/env/loadEnv.js";
import { logger } from "@/shared/utils.js";

loadEnvFile();
registerShutdownHandlers();

const main = runApplication();

main.catch((error) => {
  const cause = error instanceof Error ? error : new Error(String(error));
  logger.error("Fatal error:", cause);
  process.exitCode = 1;
});
