import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import executeRoutes from "./routes/execute.routes.js";
import testRoutes from "./routes/testExecution.routes.js";
import questionRoutes from "./routes/question.routes.js";

import authRoutes from "./routes/auth.routes.js";
import interviewRoutes from "./routes/innterview.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/interviews",interviewRoutes);
app.use("/api/execute", executeRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/questions", questionRoutes);

app.use(errorHandler);

export default app;