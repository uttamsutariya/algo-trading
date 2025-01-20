import { Router } from "express";
import {
  createStrategy,
  updateStrategy,
  viewAllStrategies,
  viewStrategy,
  deleteStrategy
} from "../controllers/strategy.controller";

const router = Router();

// POST route for creating a strategy
router.post("/create", createStrategy);
router.put("/update/:id", updateStrategy);
router.get("/view", viewAllStrategies);
router.get("/view/:id", viewStrategy);
router.delete("/delete/:id", deleteStrategy);

export default router;
