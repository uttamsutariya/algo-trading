import { FyersBroker } from "../brokersApi/FyersBroker";
import { connectDatabase } from "../config/database";

// _id of the broker in the database
const BROKER_ID = "684e6fb98b569a1a0d413c53";

async function main() {
  try {
    await connectDatabase();

    console.log("Testing FyersBroker with new initialization pattern...");

    const broker = await FyersBroker.create(BROKER_ID);

    await getFunds(broker);
    // await getOrderBook(broker);
    // await placeOrder(broker);
    // await testTokenRefresh(broker);

    console.log("Testing completed successfully!");
  } catch (error) {
    console.error("Testing failed:", error);
  } finally {
    process.exit(0);
  }
}

async function placeOrder(broker: FyersBroker) {
  console.log("Testing order placement...");
  // const orderResponse = await broker.placeOrder({
  //   symbol: "NSE:NIFTY25JULFUT",
  //   qty: 1,
  //   side: "buy"
  // });

  // console.log("Order Response:", orderResponse);
}

async function getOrderBook(broker: FyersBroker) {
  console.log("Testing order book retrieval...");
  const orderBook = await broker.getOrderBook();
  console.log("Order Book:", orderBook);
}

async function testTokenRefresh(broker: FyersBroker) {
  console.log("Testing token refresh...");
  try {
    const newToken = await broker.getNewToken();
    console.log("New Token:", newToken);
  } catch (error) {
    console.error("Token refresh failed:", error);
  }
}

async function getFunds(broker: FyersBroker) {
  console.log("Testing funds retrieval...");
  const funds = await broker.getFunds();
  console.log("Funds:", funds);
}

main();
