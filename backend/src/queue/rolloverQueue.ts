import { Queue } from "bullmq";
import redisConfig from "../config/redis.config";

// Create a queue for rollover jobs
const rolloverQueue = new Queue("rolloverQueue", { connection: redisConfig.redis });

export default rolloverQueue;
