import { Router } from "express";
import { viewAllInstruments, viewAllFyersBrokers, updateInstruments } from "../controllers/instruments.controller";

const router = Router();

router.get("/instruments", viewAllInstruments);
router.get("/brokers", viewAllFyersBrokers);
router.post("/instruments/update", updateInstruments);

export default router;
