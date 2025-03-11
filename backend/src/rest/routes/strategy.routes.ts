import { Router } from "express";
import {
  createStrategy,
  updateStrategy,
  viewAllStrategies,
  viewStrategy,
  deleteStrategy
} from "../controllers/strategy.controller";
import { rollover } from "../controllers/rollover.controller";

const router = Router();

// POST route for creating a strategy
router.post("/create", createStrategy);
router.put("/update/:id", updateStrategy);
router.get("/view", viewAllStrategies);
router.get("/view/:id", viewStrategy);
router.delete("/delete/:id", deleteStrategy);
router.post("/rollover/:strategyId", rollover);

export default router;
