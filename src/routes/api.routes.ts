import { Router } from "express";
import {
  createSession,
  runCode,
  getExecutionStatus,
} from "../controllers/session.controller";

const router = Router();

router.post("/code-sessions", createSession);

router.post("/code-sessions/:sessionId/run", runCode);

router.get("/executions/:executionId", getExecutionStatus);

export default router;
