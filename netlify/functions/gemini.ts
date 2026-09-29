/**
 * @fileoverview Netlify Serverless Function for Gemini AI proxying.
 * Ensures full portability when deployed to Netlify (e.g. branch Netlify in chessworth/Resume).
 * Exposes actions for: create-task, guide-task, daily-plan, priority-audit, and quota-status.
 * Includes rate limit & 429 resource exhaustion handling with exact reset time calculation.
 * @packageDocumentation
 */

import { GoogleGenAI, Type } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

function calculateNextUtcMidnight(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));
}

function formatCountdown(target: Date): string {
  const diffMs = target.getTime() - Date.now();
  if (diffMs <= 0) return 'momentarily';
  const totalMins = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMins / 60);
  const minutes = totalMins % 60;
  return hours > 0 ? `${hours} hours and ${minutes} minutes` : `${minutes} minutes`;
}

export const handler = async (event: any) => {
  if (event.httpMethod === 'GET') {
    const nextReset = calculateNextUtcMidnight();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        resetTime: nextReset.toISOString(),
        resetsInFormatted: formatCountdown(nextReset),
        dailyLimit: 1500,
      }),
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  if (!ai) {
    return {
      statusCode: 503,
      body: JSON.stringify({
        error: 'GEMINI_API_KEY environment variable is not configured on Netlify.',
      }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');

    // Robust action resolution: from payload body, query params, or URL path suffix
    const pathAction = event.path ? event.path.split('/').filter(Boolean).pop() : '';
    const queryAction = event.queryStringParameters?.action;
    const action = body.action || queryAction || (pathAction !== 'gemini' ? pathAction : '');

    const { prompt, task, tasks, availableBuckets = [], breakIntoMicrotasks = false } = body;

    if (action === 'create-task') {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: `You are the Jarvis Task Optimization Engine AI.
Analyze the user's natural language task request and produce a complete, calibrated task profile.
Return structured JSON:
- title: string
- notes: string
- category: one of ["Work", "Personal", "Strategic Life", "Health", "Finance", "Operations", "Education"]
- importance: 1 to 5
- urgency: 1 to 5
- impact: 1 to 5
- effort: 1 to 5
- dueDate: ISO 8601 date string or null
- estimatedDurationMinutes: integer
- cognitiveStrain: "LOW" | "MODERATE" | "HIGH" | "EXTREME"
- megaBucket: string or null
- microtasks: string array of 3-6 steps if user requested breakdown, else []`,
          responseMimeType: 'application/json',
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
            required: ['title', 'importance', 'urgency', 'impact', 'effort', 'category'],
          },
        },
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, data: parsed }),
      };
    }

    if (action === 'guide-task') {
      const promptGuide = `Provide a surgical, high-velocity execution guide for this task:
Title: "${task?.title}"
Category: "${task?.category || 'Work'}"
Importance: ${task?.importance}/5
Urgency: ${task?.urgency}/5
Impact: ${task?.impact || 3}/5
Effort: ${task?.effort || 3}/5
Notes: "${task?.notes || 'None'}"
User explicitly requested micro-tasks breakdown: ${breakIntoMicrotasks ? 'YES' : 'NO'}

Return structured JSON:
- taskTitle: string
- overview: 2-3 sentence strategic executive summary of how to tackle this efficiently
- keyObjectives: array of 2-4 critical success criteria
- phases: array of 2-4 phases, each with phaseName (string), durationMinutes (integer), actions (array of strings)
- pitfallsToAvoid: array of 2-3 common traps or distractions
- microtasks: array of 3-7 bite-sized atomic subtasks that can be individually executed and checked off (always include if breakIntoMicrotasks is true).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: promptGuide,
        config: {
          responseMimeType: 'application/json',
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
                  required: ['phaseName', 'durationMinutes', 'actions'],
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
            required: ['taskTitle', 'overview', 'phases', 'microtasks'],
          },
        },
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, data: parsed }),
      };
    }

    if (action === 'daily-plan') {
      const taskSummaries = (tasks || []).map((t: any) => ({
        id: t.id,
        title: t.title,
        importance: t.importance,
        urgency: t.urgency,
        impact: t.impact,
        effort: t.effort,
        dueDate: t.dueDate,
        estimatedMinutes: t.estimatedDurationMinutes || 45,
        cognitiveStrain: t.cognitiveStrain || 'MODERATE',
        megaBucket: t.megaBucket,
      }));

      const planPrompt = `You are the Jarvis Strategic Scheduler.
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

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: planPrompt,
        config: {
          responseMimeType: 'application/json',
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
                  required: ['taskId', 'title', 'blockLabel', 'focusMinutes', 'rationale'],
                },
              },
              restRecommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['summary', 'schedule'],
          },
        },
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, data: parsed }),
      };
    }

    if (action === 'priority-audit') {
      const taskSummaries = (tasks || []).map((t: any) => ({
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

      const auditPrompt = `You are the Jarvis Priority Calibration Auditor.
Audit the following tasks to identify logical misalignments, deadline conflicts, or priority distortions:
Tasks:
${JSON.stringify(taskSummaries, null, 2)}

Return structured JSON:
- healthScore: integer from 0 to 100
- executiveSummary: concise overview of matrix health
- anomaliesFound: integer
- findings: array of items:
  - taskId: string
  - title: string
  - severity: "HIGH" | "MEDIUM" | "LOW"
  - issueDescription: string explanation
  - recommendedAdjustment: string explanation
  - suggestedImportance: integer 1-5 (nullable)
  - suggestedUrgency: integer 1-5 (nullable)
  - suggestedImpact: integer 1-5 (nullable)
  - suggestedEffort: integer 1-5 (nullable)`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: auditPrompt,
        config: {
          responseMimeType: 'application/json',
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
                  required: ['taskId', 'title', 'severity', 'issueDescription', 'recommendedAdjustment'],
                },
              },
            },
            required: ['healthScore', 'executiveSummary', 'findings'],
          },
        },
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, data: parsed }),
      };
    }

    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: `Unknown action "${action}"` }),
    };
  } catch (error: any) {
    const errStr = String(error?.message || error || '');
    const is429 = error?.status === 429 || error?.code === 429 || /RESOURCE_EXHAUSTED|429|quota|rate limit/i.test(errStr);

    if (is429) {
      const nextReset = calculateNextUtcMidnight();
      return {
        statusCode: 429,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Daily free AI token/request quota exhausted.',
          isRateLimit: true,
          exhausted: true,
          resetTime: nextReset.toISOString(),
          resetsInFormatted: formatCountdown(nextReset),
          message: `Daily free personal AI token limit reached. Quota resets in ${formatCountdown(nextReset)} at 12:00 AM UTC.`,
        }),
      };
    }

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'Internal Server Error', isRateLimit: false }),
    };
  }
};
