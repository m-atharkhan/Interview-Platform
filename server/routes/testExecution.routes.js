import express from "express";
import { runTests } from "../controllers/testExecution.controller.js";

const router = express.Router();

router.post("/", runTests);

export default router;