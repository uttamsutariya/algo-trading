import { Router } from "express";
const router = Router();

import { viewAllFyersBrokers, addBroker, updateBroker } from "../controllers/brokers.controller.js";

router.get("/view/brokers", viewAllFyersBrokers);
router.post("/add/brokers", addBroker);
router.put("/update/brokers/:id", updateBroker);

export default router;
