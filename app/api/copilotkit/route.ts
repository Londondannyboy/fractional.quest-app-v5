import { NextRequest, NextResponse } from "next/server";
import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  GoogleGenerativeAIAdapter,
} from "@copilotkit/runtime";

// Agent endpoint URL - no trailing slash per CopilotKit examples
const AGENT_URL = process.env.AGENT_URL || "http://localhost:8000/copilotkit";

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

    // Use remoteEndpoints (not remoteActions) per CopilotKit examples
    const runtime = new CopilotRuntime({
      remoteEndpoints: [
        {
          url: AGENT_URL,
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
