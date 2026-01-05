import { NextRequest, NextResponse } from "next/server";
import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  GoogleGenerativeAIAdapter,
} from "@copilotkit/runtime";

// Agent endpoint URL - must have trailing slash
const AGENT_URL = process.env.AGENT_URL || "http://localhost:8000/copilotkit/";

// Log the AGENT_URL for debugging
console.log("[CopilotKit] Using AGENT_URL:", AGENT_URL);

export const POST = async (req: NextRequest) => {
  try {
    // Check if Google API key is set
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      console.error("[CopilotKit] ERROR: GOOGLE_GENERATIVE_AI_API_KEY is not set!");
      return NextResponse.json(
        { error: "LLM API key not configured" },
        { status: 500 }
      );
    }
    console.log("[CopilotKit] Google API key is set (length:", apiKey.length, ")");

    // Use Google Gemini as the LLM
    const serviceAdapter = new GoogleGenerativeAIAdapter({
      model: "gemini-2.0-flash",
    });

    const runtime = new CopilotRuntime({
      remoteActions: [
        {
          url: AGENT_URL,
        },
      ],
      // Add local actions as a fallback to debug if actions work at all
      actions: () => [
        {
          name: "get_job_count",
          description: "Get the total count of available fractional executive jobs. Use this when users ask how many jobs are available.",
          parameters: [],
          handler: async () => {
            try {
              // Call the Railway agent's stats endpoint
              const res = await fetch(AGENT_URL.replace("/copilotkit/", "/api/stats"));
              const data = await res.json();
              return `We currently have ${data.total_jobs} fractional executive jobs available, including ${data.remote_jobs} remote opportunities.`;
            } catch (e) {
              console.error("[CopilotKit] Stats fetch error:", e);
              return "We have many fractional executive opportunities available. Ask me about CFO, CMO, or CTO roles!";
            }
          },
        },
      ],
    });

    const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
      runtime,
      serviceAdapter,
      endpoint: "/api/copilotkit",
    });

    console.log("[CopilotKit] Handling request...");
    const response = await handleRequest(req);
    console.log("[CopilotKit] Response status:", response.status);
    return response;
  } catch (error) {
    console.error("[CopilotKit] ERROR in POST handler:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
};
