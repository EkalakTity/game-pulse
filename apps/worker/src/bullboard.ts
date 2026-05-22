import express from "express";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { ingestQueue, publishQueue, scheduleQueue, mediaQueue, aiQueue, webhookQueue, translateQueue, videoQueue } from "./queues/definitions";

const BULL_BOARD_PORT = parseInt(process.env["PORT"] ?? process.env["BULL_BOARD_PORT"] ?? "3001", 10);
const BASE_PATH = "/queues";

export function startBullBoard() {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath(BASE_PATH);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const queues: any[] = [
    new BullMQAdapter(ingestQueue),
    new BullMQAdapter(publishQueue),
    new BullMQAdapter(scheduleQueue),
    new BullMQAdapter(mediaQueue),
    new BullMQAdapter(aiQueue),
    new BullMQAdapter(webhookQueue),
    new BullMQAdapter(translateQueue),
    new BullMQAdapter(videoQueue),
  ];

  createBullBoard({ queues, serverAdapter });

  const app = express();
  app.use(BASE_PATH, serverAdapter.getRouter());

  const server = app.listen(BULL_BOARD_PORT, () => {
    console.log(`[BullBoard] Queue monitor running at http://localhost:${BULL_BOARD_PORT}${BASE_PATH}`);
  });
  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`[BullBoard] Port ${BULL_BOARD_PORT} in use — dashboard unavailable`);
    } else {
      console.error("[BullBoard] Server error:", err.message);
    }
  });
}
