import { buildApp } from './app.js';
import { loadConfig } from './config.js';

async function main(): Promise<void> {
  const cfg = loadConfig();
  const app = await buildApp();
  try {
    await app.listen({ port: cfg.PORT, host: cfg.HOST });
    app.log.info(`API listening on http://${cfg.HOST}:${cfg.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

void main();
