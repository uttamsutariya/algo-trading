import app from "./app.js";
import { connectDatabase } from "./config/database.js";
import { TradeQueueManager } from "./queue/TradeQueueManager.js";
import { RolloverQueueManager } from "./queue/RolloverQueueManager.js";

const port = process.env.PORT || 3200;

// Initialize server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Initialize trade queue manager
    const tradeQueueManager = TradeQueueManager.getInstance();
    console.log("TradeQueueManager initialized");

    // Initialize rollover queue manager
    const rolloverQueueManager = RolloverQueueManager.getInstance();
    console.log("RolloverQueueManager initialized");

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
