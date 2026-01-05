import { NextRequest } from "next/server";
import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  copilotKitEndpoint,
  EmptyAdapter,
} from "@copilotkit/runtime";

// Use EmptyAdapter since we're routing to external Pydantic AI agent
const llmAdapter = new EmptyAdapter();

// Agent endpoint URL - local dev or production
const AGENT_URL = process.env.AGENT_URL || "http://localhost:8000/copilotkit";

export const POST = async (req: NextRequest) => {
  const runtime = new CopilotRuntime({
    remoteEndpoints: [
      copilotKitEndpoint({
        url: AGENT_URL,
      }),
    ],
  });

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter: llmAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
