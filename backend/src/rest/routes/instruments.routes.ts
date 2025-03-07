import { Router } from "express";
import { viewAllInstruments, viewAllFyersBrokers } from "../controllers/instruments.controller";

const router = Router();

router.get("/instruments", viewAllInstruments);
router.get("/brokers", viewAllFyersBrokers);

export default router;
