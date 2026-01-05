import { NextRequest } from "next/server";
import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  GoogleGenerativeAIAdapter,
} from "@copilotkit/runtime";

// Use Google Gemini as the LLM
const serviceAdapter = new GoogleGenerativeAIAdapter({
  model: "gemini-2.0-flash",
});

// Agent endpoint URL
const AGENT_URL = process.env.AGENT_URL || "http://localhost:8000/copilotkit/";

export const POST = async (req: NextRequest) => {
  const runtime = new CopilotRuntime({
    remoteActions: [
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

  return handleRequest(req);
};
