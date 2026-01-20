import { Worker } from "bullmq";
import { prisma } from "./config/db";
import { redisConnection } from "./config/queue";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import {
  LANGUAGE_EXECUTION,
  SupportedLanguage,
} from "./constants/runtime";

interface JobData {
  executionId: string;
  code: string;
  language: SupportedLanguage;
}

const runScript = (
  cmd: string,
  args: string[],
): Promise<{ stdout: string; stderr: string; exitCode: number | null }> => {
  return new Promise((resolve, reject) => {
    const childProcess = spawn(cmd, args);
    let stdout = "";
    let stderr = "";

    const timer = setTimeout(() => {
      childProcess.kill();
      reject(new Error("Timeout: Execution exceeded 5 seconds"));
    }, 5000);

    childProcess.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    childProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    childProcess.on("close", (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, exitCode: code });
    });

    childProcess.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
};

const tempDir = path.join(__dirname, "../temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const worker = new Worker<JobData>(
  "code-execution",
  async (job) => {
    const { executionId, code, language } = job.data;
    console.log(` Processing job: ${executionId} (${language})`);

    const runtime = LANGUAGE_EXECUTION[language];

    if (!runtime) {
      await prisma.execution.update({
        where: { id: executionId },
        data: { status: "FAILED", stderr: `Unsupported language: ${language}` },
      });
      return;
    }

    await prisma.execution.update({
      where: { id: executionId },
      data: { status: "RUNNING" },
    });

    const fileName = path.join(tempDir, `${executionId}.${runtime.ext}`);

    fs.writeFileSync(fileName, code);

    try {
      const start = Date.now();

      const result = await runScript(runtime.cmd, [fileName]);
      const executionTime = Date.now() - start;
      const exitCode = result.exitCode ?? 0;
      const status = exitCode === 0 ? "COMPLETED" : "FAILED";
      const stderrOutput =
        exitCode === 0
          ? result.stderr
          : result.stderr || `Process exited with code ${exitCode}`;

      await prisma.execution.update({
        where: { id: executionId },
        data: {
          status,
          stdout: result.stdout,
          stderr: stderrOutput,
          executionTime,
        },
      });

      console.log(`${status}: ${executionId} in ${executionTime}ms`);
    } catch (err: any) {
      const errorMessage = err.message || "Unknown error";
      const status = errorMessage.includes("Timeout") ? "TIMEOUT" : "FAILED";

      await prisma.execution.update({
        where: { id: executionId },
        data: {
          status,
          stderr: errorMessage,
        },
      });

      console.log(`❌ ${status}: ${executionId} - ${errorMessage}`);
    } finally {
      if (fs.existsSync(fileName)) {
        fs.unlinkSync(fileName);
      }
    }
  },
  { connection: redisConnection as any },
);

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

const shutdown = async () => {
  console.log("Shutting down worker...");
  await worker.close();
  await redisConnection.quit();
  await prisma.$disconnect();
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log("Worker started and listening for jobs...");
