import { Router } from "express";
import { viewAllInstruments } from "../controllers/instruments.controller";

const router = Router();

router.get("/", viewAllInstruments);

export default router;
