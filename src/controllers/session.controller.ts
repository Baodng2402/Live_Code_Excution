import { Request, Response } from "express";
import { prisma } from "../config/db";
import { codeQueue } from "../config/queue";
import {
  MAX_CODE_SIZE,
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
} from "../constants/runtime";

interface ExecutionJobData {
  executionId: string;
  code: string;
  language: SupportedLanguage;
}

const isSupportedLanguage = (language: unknown): language is SupportedLanguage =>
  typeof language === "string" &&
  SUPPORTED_LANGUAGES.includes(language as SupportedLanguage);

export const runCode = async (
  req: Request<{ sessionId: string }>,
  res: Response,
) => {
  const { sessionId } = req.params;
  const { code, language } = req.body as {
    code?: unknown;
    language?: unknown;
  };

  if (!code || !language) {
    res.status(400).json({ error: "Code and language are required" });
    return;
  }

  if (!isSupportedLanguage(language)) {
    res.status(400).json({ error: "Unsupported language" });
    return;
  }

  if (typeof code !== "string" || code.length > MAX_CODE_SIZE) {
    res.status(400).json({ error: "Code is too large or invalid" });
    return;
  }

  try {
    const session = await prisma.codeSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const execution = await prisma.execution.create({
      data: {
        sessionId,
        code,
        language,
        status: "QUEUED",
      },
    });

    await codeQueue.add("execute-code", {
      executionId: execution.id,
      code,
      language,
    });

    res.json({
      execution_id: execution.id,
      status: "QUEUED",
    });
  } catch (error) {
    console.error("RunCode Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createSession = async (req: Request, res: Response) => {
  try {
    const session = await prisma.codeSession.create({
      data: { status: "ACTIVE" },
    });
    res.json({ session_id: session.id, status: session.status });
  } catch (error) {
    console.error("CreateSession Error:", error);
    res.status(500).json({ error: "Failed to create session" });
  }
};

export const getExecutionStatus = async (
  req: Request<{ executionId: string }>,
  res: Response,
) => {
  const { executionId } = req.params;

  try {
    const execution = await prisma.execution.findUnique({
      where: { id: executionId },
    });

    if (!execution) {
      res.status(404).json({ error: "Execution not found" });
      return;
    }

    res.json(execution);
  } catch (error) {
    console.error("GetStatus Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
