import { Router } from "express";
import { viewAllInstruments, updateInstruments } from "../controllers/instruments.controller";

const router = Router();

router.get("/instruments", viewAllInstruments);
router.post("/instruments/update", updateInstruments);

export default router;
