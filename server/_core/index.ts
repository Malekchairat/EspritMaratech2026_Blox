import "dotenv/config";
import net from "net";
import { createApp } from "./createApp";
import { serveStatic, setupVite } from "./vite";

const { app, server } = createApp();

async function startServer() {
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  async function isPortAvailable(port: number): Promise<boolean> {
    return new Promise(resolve => {
      const testServer = net.createServer();
      testServer.listen(port, () => testServer.close(() => resolve(true)));
      testServer.on("error", () => resolve(false));
    });
  }

  async function findAvailablePort(startPort = 3001): Promise<number> {
    for (let port = startPort; port < startPort + 20; port++) {
      if (await isPortAvailable(port)) return port;
    }
    throw new Error(`No available port found starting from ${startPort}`);
  }

  const port = await findAvailablePort(3001);
  server.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
