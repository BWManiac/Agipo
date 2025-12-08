import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { getComposioClient } from "@/app/api/connections/services/composio";

// Step definitions
const navigateToUrl = createStep({
  id: "11IU9f9Xc4knMtwwJrnHi",
  inputSchema: z.object({}),
  outputSchema: z.object({}),
  execute: async ({ inputData, runtimeContext }) => {
    const client = getComposioClient();
    const connections = runtimeContext.get("connections") as Record<string, string> | undefined;
    const connectionId = connections?.["browser_tool"];
    const result = await client.tools.execute(
      "BROWSER_TOOL_NAVIGATE",
      {
        arguments: inputData,
        connectedAccountId: connectionId,
        dangerouslySkipVersionCheck: true
      }
    );
    if (!result.successful) {
      throw new Error(result.error || "Tool execution failed");
    }
    return result.data;
  }
});
const fetchWebpageContent = createStep({
  id: "vEIob8NhK-Cvh9Hq5Im11",
  inputSchema: z.object({}),
  outputSchema: z.object({}),
  execute: async ({ inputData, runtimeContext }) => {
    const client = getComposioClient();
    const connections = runtimeContext.get("connections") as Record<string, string> | undefined;
    const connectionId = connections?.["browser_tool"];
    const result = await client.tools.execute(
      "BROWSER_TOOL_FETCH_WEBPAGE",
      {
        arguments: inputData,
        connectedAccountId: connectionId,
        dangerouslySkipVersionCheck: true
      }
    );
    if (!result.successful) {
      throw new Error(result.error || "Tool execution failed");
    }
    return result.data;
  }
});
const sendEmail = createStep({
  id: "3qHrkky6fkTFw1iLsHJLt",
  inputSchema: z.object({}),
  outputSchema: z.object({}),
  execute: async ({ inputData, runtimeContext }) => {
    const client = getComposioClient();
    const connections = runtimeContext.get("connections") as Record<string, string> | undefined;
    const connectionId = connections?.["gmail"];
    const result = await client.tools.execute(
      "GMAIL_SEND_EMAIL",
      {
        arguments: inputData,
        connectedAccountId: connectionId,
        dangerouslySkipVersionCheck: true
      }
    );
    if (!result.successful) {
      throw new Error(result.error || "Tool execution failed");
    }
    return result.data;
  }
});

// Workflow composition
export const summarizeSiteEmailWorkflow = createWorkflow({
  id: "wf-MSKSYrCZ-Tfc",
  inputSchema: z.object({
  URL: z.string(),
  "Email Address": z.string()
}),
  outputSchema: z.any()
})
  .map(async ({ inputData, getStepResult }) => {
    return {
      url: inputData["URL"]
    };
  })
  .then(navigateToUrl)
  .map(async ({ inputData, getStepResult }) => {
    return {
      url: getStepResult("11IU9f9Xc4knMtwwJrnHi")?.data.navigatedUrl
    };
  })
  .then(fetchWebpageContent)
  .map(async ({ inputData, getStepResult }) => {
    return {
      recipient_email: inputData["Email Address"],
      body: getStepResult("vEIob8NhK-Cvh9Hq5Im11")?.data.content,
      subject: getStepResult("vEIob8NhK-Cvh9Hq5Im11")?.data.url
    };
  })
  .then(sendEmail)
  .commit();

// Metadata for runtime
export const workflowMetadata = {
  "requiredConnections": [
    "browser_tool",
    "gmail"
  ],
  "stepCount": 3
};