const { getOpenOrders, closeAllPositions, findNextContract, openNewPositions } = require("../utils/tradeFunctions");

export async function scheduleRolloverJob(strategy: any) {
  const rollOverDate: Date = new Date(strategy.rolloverOn);
  const currentDate: Date = new Date();
  if (rollOverDate <= currentDate) {
    console.log(`Skipping scheduling for strategy ${strategy.name} as rollOverOn date has already passed.`);
    return;
  }

  const timeUntilRollover = rollOverDate.getTime() - currentDate.getTime();

  setTimeout(async () => {
    console.log(`Executing rollover job for strategy: ${strategy.name}`);

    // Fetch only relevant open positions.....................................

    const openPositions = await getOpenOrders(strategy._id);

    if (!openPositions.length) {
      console.log(`No open positions found for strategy ${strategy.name}`);
      return;
    }

    // Close positions....................................................

    await closeAllPositions(openPositions, strategy._id);

    // Find the next contract...........................................

    const nextSymbol = await findNextContract(strategy.symbol);
    if (!nextSymbol) {
      console.log(`No next contract found for strategy ${strategy.name}`);
      return;
    }

    // Reopen positions with new contract................................

    await openNewPositions(openPositions, nextSymbol);

    console.log(`Rollover completed for strategy: ${strategy.name}`);
  }, timeUntilRollover);
}
