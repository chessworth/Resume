/**
 * @fileoverview Express Full-Stack Server & Gemini AI Proxy for Jarvis Task Matrix.
 * Provides server-side Gemini API execution with telemetry headers,
 * proxy endpoints for task proposal generation, step-by-step guides,
 * daily schedule planning, and priority calibration audits.
 * Mounts Vite dev middleware in development mode and serves static build in production.
 * @packageDocumentation
 */

import express, { Request, Response } from "express";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Initialize GoogleGenAI client with mandatory aistudio-build User-Agent header
const apiKey = process.env.GEMINI_API_KEY || "";
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

/**
 * Server-side Daily Quota and Free Tier Rate Limit Management.
 * Standard Gemini 3.8 Flash Free Tier: 15 RPM, 1,500 RPD, 1,000,000 TPM.
 */
const DAILY_LIMIT = parseInt(
  process.env.DAILY_GEMINI_REQUEST_LIMIT || "1500",
  10,
);
let serverQuota = {
  dateUtc: new Date().toISOString().split("T")[0],
  requestCount: 0,
  dailyLimit: DAILY_LIMIT,
};

function checkAndResetServerQuota(): void {
  const currentUtc = new Date().toISOString().split("T")[0];
  if (serverQuota.dateUtc !== currentUtc) {
    serverQuota = {
      dateUtc: currentUtc,
      requestCount: 0,
      dailyLimit: DAILY_LIMIT,
    };
  }
}

function calculateNextUtcMidnight(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0,
      0,
    ),
  );
}

function formatCountdown(target: Date): string {
  const diffMs = target.getTime() - Date.now();
  if (diffMs <= 0) return "momentarily";
  const totalMins = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMins / 60);
  const minutes = totalMins % 60;
  return hours > 0
    ? `${hours} hours and ${minutes} minutes`
    : `${minutes} minutes`;
}

function checkQuotaGate(res: Response): boolean {
  checkAndResetServerQuota();
  if (serverQuota.requestCount >= serverQuota.dailyLimit) {
    const nextReset = calculateNextUtcMidnight();
    res.status(429).json({
      error: "Daily free AI token/request quota exhausted.",
      isRateLimit: true,
      exhausted: true,
      resetTime: nextReset.toISOString(),
      resetsInFormatted: formatCountdown(nextReset),
      dailyLimit: serverQuota.dailyLimit,
      usedToday: serverQuota.requestCount,
      message: `Daily free personal AI token limit reached (${serverQuota.requestCount}/${serverQuota.dailyLimit} requests). Quota resets at 12:00 AM UTC (in ${formatCountdown(nextReset)}).`,
    });
    return false;
  }
  return true;
}

function recordServerRequest(): void {
  checkAndResetServerQuota();
  serverQuota.requestCount += 1;
}

function handleGeminiError(
  error: any,
  res: Response,
  defaultMessage: string,
): void {
  console.error(`[Jarvis Server Error] ${defaultMessage}:`, error);
  const errStr = String(error?.message || error || "");
  const is429 =
    error?.status === 429 ||
    error?.code === 429 ||
    /RESOURCE_EXHAUSTED|429|quota|rate limit/i.test(errStr);

  if (is429) {
    const nextReset = calculateNextUtcMidnight();
    res.status(429).json({
      error: "Daily free AI token/request quota exhausted.",
      isRateLimit: true,
      exhausted: true,
      resetTime: nextReset.toISOString(),
      resetsInFormatted: formatCountdown(nextReset),
      dailyLimit: serverQuota.dailyLimit,
      usedToday: serverQuota.requestCount,
      message: `You have reached your daily free quota for Gemini AI. Requests will reset in ${formatCountdown(nextReset)} at 12:00 AM UTC.`,
    });
    return;
  }

  res.status(500).json({
    error: error?.message || defaultMessage,
    isRateLimit: false,
  });
}

/**
 * Validates availability of Gemini API client.
 */
function ensureGeminiClient(res: Response): boolean {
  if (!ai) {
    res.status(503).json({
      error:
        "GEMINI_API_KEY is not configured on the server. Please set GEMINI_API_KEY in your environment secrets.",
    });
    return false;
  }
  return true;
}

/**
 * Primary and Fallback model identifiers configured for high-demand failover.
 */
const PRIMARY_MODEL = process.env.PRIMARY_GEMINI_MODEL || "gemini-3.8-flash";
const FALLBACK_MODEL =
  process.env.FALLBACK_GEMINI_MODEL || "gemini-3.1-flash-lite";

interface GenerateOptions {
  contents: string;
  systemInstruction?: string;
  responseSchema?: Record<string, any>;
  responseMimeType?: string;
}

interface GenerateResult {
  text: string;
  modelUsed: string;
  isFallback: boolean;
}

/**
 * Checks whether an encountered error indicates high traffic, capacity depletion, or transient rate limits.
 */
function isHighDemandError(error: any): boolean {
  const status = error?.status || error?.code || error?.statusCode;
  const msg = String(error?.message || error || "");
  return (
    status === 503 ||
    status === 429 ||
    status === 500 ||
    /high demand|overloaded|capacity|resource_exhausted|quota|rate limit|temporarily unavailable|unavailable|503|429/i.test(
      msg,
    )
  );
}

/**
 * Executes Gemini structured content generation against PRIMARY_MODEL with seamless failover
 * to FALLBACK_MODEL (gemini-3.1-flash-lite) if high demand or capacity constraints are detected.
 */
async function generateContentWithFallback(
  options: GenerateOptions,
): Promise<GenerateResult> {
  const {
    contents,
    systemInstruction,
    responseSchema,
    responseMimeType = "application/json",
  } = options;

  const config: Record<string, any> = {
    responseMimeType,
  };
  if (systemInstruction) {
    config.systemInstruction = systemInstruction;
  }
  if (responseSchema) {
    config.responseSchema = responseSchema;
  }

  // Attempt 1: Execute with Primary Model
  try {
    const response = await ai!.models.generateContent({
      model: PRIMARY_MODEL,
      contents,
      config,
    });
    return {
      text: response.text?.trim() || "",
      modelUsed: PRIMARY_MODEL,
      isFallback: false,
    };
  } catch (primaryError: any) {
    console.warn(
      `[Jarvis Server] Primary model (${PRIMARY_MODEL}) error:`,
      primaryError?.message || primaryError,
    );

    // If error indicates high demand / capacity exhaustion, trigger secondary fallback model
    if (isHighDemandError(primaryError)) {
      console.info(
        `[Jarvis Server] High demand detected on ${PRIMARY_MODEL}. Activating fallback model: ${FALLBACK_MODEL}...`,
      );
      try {
        const fallbackResponse = await ai!.models.generateContent({
          model: FALLBACK_MODEL,
          contents,
          config,
        });
        return {
          text: fallbackResponse.text?.trim() || "",
          modelUsed: FALLBACK_MODEL,
          isFallback: true,
        };
      } catch (fallbackError: any) {
        console.error(
          `[Jarvis Server] Fallback model (${FALLBACK_MODEL}) also failed:`,
          fallbackError,
        );
        throw fallbackError;
      }
    }

    throw primaryError;
  }
}

/**
 * GET /api/gemini/quota-status
 * Exposes server-side quota metrics and reset countdowns.
 */
app.get("/api/gemini/quota-status", (_req: Request, res: Response) => {
  checkAndResetServerQuota();
  const nextReset = calculateNextUtcMidnight();
  res.json({
    success: true,
    data: {
      requestCount: serverQuota.requestCount,
      dailyLimit: serverQuota.dailyLimit,
      remaining: Math.max(0, serverQuota.dailyLimit - serverQuota.requestCount),
      isExhausted: serverQuota.requestCount >= serverQuota.dailyLimit,
      resetTime: nextReset.toISOString(),
      resetsInFormatted: formatCountdown(nextReset),
      resetsAtUtc: "00:00 UTC",
    },
  });
});

/**
 * POST /api/gemini/create-task
 * Interprets natural language prompt into a structured task specification.
 */
app.post("/api/gemini/create-task", async (req: Request, res: Response) => {
  if (!ensureGeminiClient(res)) return;
  if (!checkQuotaGate(res)) return;

  try {
    const { prompt, availableBuckets = [] } = req.body;
    if (!prompt || typeof prompt !== "string") {
      res.status(400).json({ error: 'Missing or invalid "prompt" parameter.' });
      return;
    }

    const systemPrompt = `You are the Jarvis Task Optimization Engine AI.
Analyze the user's natural language task request and produce a complete, calibrated task profile.
Return structured JSON matching this schema:
- title: concise, action-oriented task name (string)
- notes: supplementary context or checklist (string)
- category: one of ["Work", "Personal", "Strategic Life", "Health", "Finance", "Operations", "Education"]
- importance: integer 1 to 5 (1=Trivial, 2=Minor, 3=Medium, 4=High, 5=Vital/Crucial)
- urgency: integer 1 to 5 (1=Deferred, 2=Flexible, 3=Standard, 4=Pressing, 5=Immediate/Emergency)
- impact: integer 1 to 5 (1=Negligible, 2=Low, 3=Moderate, 4=High Leverage, 5=Transformative)
- effort: integer 1 to 5 (1=Minimal/Quick, 2=Light, 3=Moderate, 4=Heavy, 5=Intense/Exhaustive)
- dueDate: ISO 8601 date string if a deadline or relative time was mentioned, otherwise null
- estimatedDurationMinutes: estimated focus duration in minutes (e.g., 15, 30, 45, 60, 90, 120)
- cognitiveStrain: one of ["LOW", "MODERATE", "HIGH", "EXTREME"]
- megaBucket: optional grouping bucket name. If the task relates to one of these available buckets [${availableBuckets.join(", ")}], pick it, or suggest a new 1-2 word bucket name if relevant, or null
- microtasks: string array of 3-6 discrete, atomic sub-steps if the user asked to break it down, otherwise empty array [].
Current time context: ${new Date().toISOString()}`;

    const result = await generateContentWithFallback({
      contents: prompt,
      systemInstruction: systemPrompt,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          notes: { type: Type.STRING },
          category: { type: Type.STRING },
          importance: { type: Type.INTEGER },
          urgency: { type: Type.INTEGER },
          impact: { type: Type.INTEGER },
          effort: { type: Type.INTEGER },
          dueDate: { type: Type.STRING, nullable: true },
          estimatedDurationMinutes: { type: Type.INTEGER },
          cognitiveStrain: { type: Type.STRING },
          megaBucket: { type: Type.STRING, nullable: true },
          microtasks: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: [
          "title",
          "importance",
          "urgency",
          "impact",
          "effort",
          "category",
        ],
      },
    });

    recordServerRequest();
    const parsed = JSON.parse(result.text || "{}");
    res.json({
      success: true,
      data: parsed,
      meta: {
        modelUsed: result.modelUsed,
        isFallback: result.isFallback,
      },
    });
  } catch (error: any) {
    handleGeminiError(error, res, "Failed to process task generation");
  }
});

/**
 * POST /api/gemini/guide-task
 * Generates an in-depth execution guide and roadmap for an existing task.
 */
app.post("/api/gemini/guide-task", async (req: Request, res: Response) => {
  if (!ensureGeminiClient(res)) return;
  if (!checkQuotaGate(res)) return;

  try {
    const { task, breakIntoMicrotasks = false } = req.body;
    if (!task || !task.title) {
      res.status(400).json({ error: "Missing or invalid task object." });
      return;
    }

    const prompt = `Provide a surgical, high-velocity execution guide for this task:
Title: "${task.title}"
Category: "${task.category || "Work"}"
Importance: ${task.importance}/5
Urgency: ${task.urgency}/5
Impact: ${task.impact || 3}/5
Effort: ${task.effort || 3}/5
Notes: "${task.notes || "None"}"
User explicitly requested micro-tasks breakdown: ${breakIntoMicrotasks ? "YES" : "NO"}

Return structured JSON:
- taskTitle: string
- overview: 2-3 sentence strategic executive summary of how to tackle this efficiently
- keyObjectives: array of 2-4 critical success criteria
- phases: array of 2-4 phases, each with phaseName (string), durationMinutes (integer), actions (array of strings)
- pitfallsToAvoid: array of 2-3 common traps or distractions
- microtasks: array of 3-7 bite-sized atomic subtasks that can be individually executed and checked off (always include if breakIntoMicrotasks is true).`;

    const result = await generateContentWithFallback({
      contents: prompt,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          taskTitle: { type: Type.STRING },
          overview: { type: Type.STRING },
          keyObjectives: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          phases: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                phaseName: { type: Type.STRING },
                durationMinutes: { type: Type.INTEGER },
                actions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ["phaseName", "durationMinutes", "actions"],
            },
          },
          pitfallsToAvoid: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          microtasks: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ["taskTitle", "overview", "phases", "microtasks"],
      },
    });

    recordServerRequest();
    const parsed = JSON.parse(result.text || "{}");
    res.json({
      success: true,
      data: parsed,
      meta: {
        modelUsed: result.modelUsed,
        isFallback: result.isFallback,
      },
    });
  } catch (error: any) {
    handleGeminiError(error, res, "Failed to generate task guide");
  }
});

/**
 * POST /api/gemini/daily-plan
 * Suggestion 4: Evaluates active tasks and generates an optimal sequence for the day.
 */
app.post("/api/gemini/daily-plan", async (req: Request, res: Response) => {
  if (!ensureGeminiClient(res)) return;
  if (!checkQuotaGate(res)) return;

  try {
    const { tasks = [] } = req.body;
    if (!Array.isArray(tasks) || tasks.length === 0) {
      res
        .status(400)
        .json({ error: "No active tasks provided for scheduling." });
      return;
    }

    const taskSummaries = tasks.map((t) => ({
      id: t.id,
      title: t.title,
      importance: t.importance,
      urgency: t.urgency,
      impact: t.impact,
      effort: t.effort,
      dueDate: t.dueDate,
      estimatedMinutes: t.estimatedDurationMinutes || 45,
      cognitiveStrain: t.cognitiveStrain || "MODERATE",
      megaBucket: t.megaBucket,
    }));

    const prompt = `You are the Jarvis Strategic Scheduler.
Analyze the user's active tasks and design an optimal daily deep work sequence adhering to cognitive ergonomics:
- Place High Strain / High Impact / Q1 tasks during morning peak ultradian cycles (90 min blocks).
- Schedule Quick Wins (Impact 5, Effort 1) as momentum builders or post-rest boosters.
- Defer low impact / high effort tasks.
- Include proportional rest intervals.

Active Tasks:
${JSON.stringify(taskSummaries, null, 2)}

Return structured JSON:
- summary: high-level strategic reasoning for today's cadence
- totalEstimatedMinutes: integer
- schedule: array of blocks in sequence:
  - taskId: corresponding task id (string)
  - title: task title (string)
  - blockLabel: e.g. "Block 1: Deep Work Apex (09:00 - 10:30)" (string)
  - focusMinutes: integer
  - rationale: why this task is positioned here (string)
- restRecommendations: array of 2-3 brief biological recovery tips between deep work bouts.`;

    const result = await generateContentWithFallback({
      contents: prompt,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          totalEstimatedMinutes: { type: Type.INTEGER },
          schedule: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                taskId: { type: Type.STRING },
                title: { type: Type.STRING },
                blockLabel: { type: Type.STRING },
                focusMinutes: { type: Type.INTEGER },
                rationale: { type: Type.STRING },
              },
              required: [
                "taskId",
                "title",
                "blockLabel",
                "focusMinutes",
                "rationale",
              ],
            },
          },
          restRecommendations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ["summary", "schedule"],
      },
    });

    recordServerRequest();
    const parsed = JSON.parse(result.text || "{}");
    res.json({
      success: true,
      data: parsed,
      meta: {
        modelUsed: result.modelUsed,
        isFallback: result.isFallback,
      },
    });
  } catch (error: any) {
    handleGeminiError(error, res, "Failed to generate schedule");
  }
});

/**
 * POST /api/gemini/priority-audit
 * Suggestion 5: Priority Calibration Audit - analyzes tasks for discrepancies and misclassifications.
 */
app.post("/api/gemini/priority-audit", async (req: Request, res: Response) => {
  if (!ensureGeminiClient(res)) return;
  if (!checkQuotaGate(res)) return;

  try {
    const { tasks = [] } = req.body;
    if (!Array.isArray(tasks) || tasks.length === 0) {
      res.status(400).json({ error: "No active tasks provided for audit." });
      return;
    }

    const taskSummaries = tasks.map((t) => ({
      id: t.id,
      title: t.title,
      importance: t.importance,
      urgency: t.urgency,
      impact: t.impact,
      effort: t.effort,
      dueDate: t.dueDate,
      estimatedMinutes: t.estimatedDurationMinutes,
      category: t.category,
    }));

    const prompt = `You are the Jarvis Priority Calibration Auditor.
Audit the following tasks to identify logical misalignments, deadline conflicts, or priority distortions:
Examples of issues:
1. Imminent deadline (today/tomorrow) but urgency rated <= 2.
2. Low impact (1-2) with high effort (4-5) wrongly prioritized as Q1 or high importance.
3. High impact (4-5) with low effort (1-2) (Quick Win) neglected in Q4 or low urgency.
4. Overloaded daily workload (> 8 hours of high strain).

Tasks:
${JSON.stringify(taskSummaries, null, 2)}

Return structured JSON:
- healthScore: integer from 0 to 100 (100 = perfectly calibrated matrix)
- executiveSummary: concise overview of matrix health
- anomaliesFound: integer
- findings: array of items:
  - taskId: string
  - title: string
  - severity: "HIGH" | "MEDIUM" | "LOW"
  - issueDescription: string explanation of what is misaligned
  - recommendedAdjustment: string explanation of the fix
  - suggestedImportance: integer 1-5 (nullable)
  - suggestedUrgency: integer 1-5 (nullable)
  - suggestedImpact: integer 1-5 (nullable)
  - suggestedEffort: integer 1-5 (nullable)`;

    const result = await generateContentWithFallback({
      contents: prompt,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          healthScore: { type: Type.INTEGER },
          executiveSummary: { type: Type.STRING },
          anomaliesFound: { type: Type.INTEGER },
          findings: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                taskId: { type: Type.STRING },
                title: { type: Type.STRING },
                severity: { type: Type.STRING },
                issueDescription: { type: Type.STRING },
                recommendedAdjustment: { type: Type.STRING },
                suggestedImportance: { type: Type.INTEGER, nullable: true },
                suggestedUrgency: { type: Type.INTEGER, nullable: true },
                suggestedImpact: { type: Type.INTEGER, nullable: true },
                suggestedEffort: { type: Type.INTEGER, nullable: true },
              },
              required: [
                "taskId",
                "title",
                "severity",
                "issueDescription",
                "recommendedAdjustment",
              ],
            },
          },
        },
        required: ["healthScore", "executiveSummary", "findings"],
      },
    });

    recordServerRequest();
    const parsed = JSON.parse(result.text || "{}");
    res.json({
      success: true,
      data: parsed,
      meta: {
        modelUsed: result.modelUsed,
        isFallback: result.isFallback,
      },
    });
  } catch (error: any) {
    handleGeminiError(error, res, "Failed to conduct audit");
  }
});

// Vite middleware or static serving
const isProd = process.env.NODE_ENV === "production";
const PORT = parseInt(process.env.PORT || "3000", 10);

async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== "true" },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Jarvis Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
