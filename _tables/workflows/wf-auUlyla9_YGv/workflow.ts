import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { getComposioClient } from "@/app/api/connections/services/composio";

// Step definitions
const navigateToUrl = createStep({
  id: "hxoEFHJL21nAkQfLsnFAY",
  inputSchema: z.object({}),
  outputSchema: z.object({}),
  execute: async ({ inputData, runtimeContext }) => {
    const client = getComposioClient();
    const connections = runtimeContext.get("connections") as Record<string, string> | undefined;
    const connectionId = connections?.["browser_tool"];
    const userId = runtimeContext.get("userId") as string | undefined;
    const result = await client.tools.execute(
      "BROWSER_TOOL_NAVIGATE",
      {
        arguments: inputData,
        connectedAccountId: connectionId,
        userId,
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
  id: "BDHS3ZinvIN94tv0l35Sx",
  inputSchema: z.object({}),
  outputSchema: z.object({}),
  execute: async ({ inputData, runtimeContext }) => {
    const client = getComposioClient();
    const connections = runtimeContext.get("connections") as Record<string, string> | undefined;
    const connectionId = connections?.["browser_tool"];
    const userId = runtimeContext.get("userId") as string | undefined;
    const result = await client.tools.execute(
      "BROWSER_TOOL_FETCH_WEBPAGE",
      {
        arguments: inputData,
        connectedAccountId: connectionId,
        userId,
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
  id: "4Ouop5jvsC8YbJIek-Qna",
  inputSchema: z.object({}),
  outputSchema: z.object({}),
  execute: async ({ inputData, runtimeContext }) => {
    const client = getComposioClient();
    const connections = runtimeContext.get("connections") as Record<string, string> | undefined;
    const connectionId = connections?.["gmail"];
    const userId = runtimeContext.get("userId") as string | undefined;
    const result = await client.tools.execute(
      "GMAIL_SEND_EMAIL",
      {
        arguments: inputData,
        connectedAccountId: connectionId,
        userId,
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
export const sendSiteContentToEmailWorkflow = createWorkflow({
  id: "wf-auUlyla9_YGv",
  inputSchema: z.object({
  "Email Address": z.string(),
  "Website URL": z.string()
}),
  outputSchema: z.any()
})
  .map(async ({ inputData, getStepResult }) => {
    return {
      url: inputData["Website URL"]
    };
  })
  .then(navigateToUrl)
  .map(async ({ inputData, getStepResult }) => {
    return {
      url: getStepResult("hxoEFHJL21nAkQfLsnFAY")?.navigatedUrl
    };
  })
  .then(fetchWebpageContent)
  .map(async ({ inputData, getStepResult }) => {
    return {
      recipient_email: inputData["Email Address"],
      subject: getStepResult("BDHS3ZinvIN94tv0l35Sx")?.title,
      body: getStepResult("BDHS3ZinvIN94tv0l35Sx")?.content
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