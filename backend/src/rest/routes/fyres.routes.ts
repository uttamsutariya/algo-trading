import { Router } from "express";
import { fyersLogin, fyersCallback } from "../controllers/fyresAuth.controller";

const router = Router();

// Route to redirect user to Fyers login
router.get("/login", fyersLogin);

// Callback route to handle Fyers response after user login
router.get("/callback", fyersCallback);

export default router;
