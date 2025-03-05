import { Worker } from "bullmq";
import { getOpenOrders, closeAllPositions, findNextContract, openNewPositions } from "../utils/tradeFunctions";
import redisConfig from "../config/redis.config";
import { FyersBroker } from "../brokersApi/FyersBroker";
import brokerConfig from "../config/broker.config";

// Create a FyersBroker instance using credentials
const broker = FyersBroker.getInstance(brokerConfig.fyers);

// ✅ Create a worker to process rollover jobs
const rolloverWorker = new Worker(
  "rolloverQueue",
  async (job) => {
    console.log(job, "job...");
    const strategy = job.data.strategy;

    if (!strategy) {
      console.error("❌ No strategy data found in job.");
      return;
    }

    console.log(`🚀 Executing rollover job for strategy: ${strategy.name}`);

    // ✅ Fetch open positions
    const openPositions = await getOpenOrders(broker, strategy._id);
    if (!openPositions.length) {
      console.log(`⚠️ No open positions found for strategy ${strategy.name}`);
      return;
    }

    // ✅ Close positions
    await closeAllPositions(broker, openPositions, strategy._id);

    // ✅ Find the next contract
    const nextSymbol = await findNextContract(strategy.symbol);
    if (!nextSymbol) {
      console.log(`⚠️ No next contract found for strategy ${strategy.name}`);
      return;
    }

    // ✅ Reopen positions with the new contract
    await openNewPositions(broker, openPositions, nextSymbol);

    console.log(`✅ Rollover completed successfully for strategy: ${strategy.name}`);
  },
  { connection: redisConfig.redis }
);
