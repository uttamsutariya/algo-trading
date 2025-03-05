import app from "./app";
import { connectDatabase } from "./config/database";
import { TradeTaskWorker } from "./queue/TradeTaskWorker";

const port = process.env.PORT || 3200;

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
