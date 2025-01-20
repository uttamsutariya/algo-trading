import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDatabase } from "./config/database";
import strategyRoutes from "./routes/strategy.routes";

// Load environment variables
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3200;

app.use(cors());
app.use(express.json());

// Basic health check route
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

// Use the strategy routes
app.use("/api/strategies", strategyRoutes);

// Initialize server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();

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
