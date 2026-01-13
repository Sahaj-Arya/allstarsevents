import { initApp } from "./app.js";

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    const app = await initApp();
    app.listen(PORT, () => console.log(`API listening on :${PORT}`));
  } catch (err) {
    console.error("Failed to start server", err);
    process.exit(1);
  }
}

start();
