import express from "express";
import { runCode } from "../controllers/execute.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protect, runCode);

export default router;