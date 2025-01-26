import dotenv from "dotenv";
dotenv.config();

import express, { Express, Request, Response } from "express";
import cors from "cors";
import { connectDatabase } from "./config/database";
import strategyRoutes from "./rest/routes/strategy.routes";
import instrumentsRoutes from "./rest/routes/instruments.routes";
import { webhookController } from "./rest/controllers/webhook.controller";
import { TradeTaskWorker } from "./queue/TradeTaskWorker";

import "./cron/instrumentsUpdate"; // Import the cron job to update symbols daily

const app: Express = express();
const port = process.env.PORT || 3200;

app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/strategies", strategyRoutes);
app.use("/api/instruments", instrumentsRoutes);
app.use("/api/webhook", webhookController); // webhook processor

// Initialize server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Initialize trade task worker
    const tradeWorker = new TradeTaskWorker();
    await tradeWorker
      .start()
      .then(() => {
        console.log("TradeTaskWorker started");
      })
      .catch((error) => {
        console.error("Failed to start trade worker:", error);
        process.exit(1);
      });

    // Start listening for requests
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;
