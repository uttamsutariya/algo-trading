import { Router } from "express";
import { viewAllInstruments, getFyersBrokers } from "../controllers/instruments.controller";

const router = Router();

router.get("/Instruments", viewAllInstruments);
router.get("/Brokers", getFyersBrokers);

export default router;
