import { Router } from "express";
import { viewAllInstruments, getFyersBrokers } from "../controllers/instruments.controller";

const router = Router();

router.get("/instruments", viewAllInstruments);
router.get("/brokers", getFyersBrokers);

export default router;
