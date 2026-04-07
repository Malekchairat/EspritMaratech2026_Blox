import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import express, { type Request, type Response } from "express";
import { createApp } from "../server/_core/createApp";

const { app } = createApp();

// Serve built frontend static files
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPublic = path.resolve(__dirname, "../dist/public");
app.use(express.static(distPublic));
app.use("*", (_req: Request, res: Response) => {
  res.sendFile(path.join(distPublic, "index.html"));
});

export default app;
