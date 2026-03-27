import express from "express";
import {
  createInterview,
  endInterview,
  getInterview
} from "../controllers/interview.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/create",protect,createInterview);
router.get("/:roomId",protect,getInterview);
router.patch("/:roomId/end", protect, endInterview);

export default router;