/**
 * Script to check actual Gmail tool schemas from Composio
 * Run with: npx tsx scripts/check-gmail-schemas.ts
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { getComposioClient } from "../app/api/connections/services/client";

async function checkGmailSchemas() {
  console.log("Fetching Gmail tools from Composio...\n");
  
  const client = getComposioClient();
  
  // Get all Gmail tools
  const tools = await client.tools.getRawComposioTools({ 
    toolkits: ["gmail"], 
    limit: 100 
  }) as Array<{
    slug?: string;
    name?: string;
    displayName?: string;
    description?: string;
    inputParameters?: Record<string, unknown>;
    outputParameters?: Record<string, unknown>;
    parameters?: { properties?: Record<string, unknown> };
  }>;
  
  console.log(`Found ${tools.length} Gmail tools\n`);
  
  // Look for specific tools we care about
  const targetTools = [
    "GMAIL_LIST_EMAILS",
    "GMAIL_FETCH_EMAILS", 
    "GMAIL_GET_MAIL",
    "GMAIL_SEND_EMAIL",
    "GMAIL_CREATE_DRAFT",
  ];
  
  for (const tool of tools) {
    const toolId = tool.slug || tool.name || "";
    
    // Check if this is one of our target tools or contains relevant keywords
    const isTarget = targetTools.some(t => toolId.toUpperCase().includes(t.replace("GMAIL_", "")));
    const isListOrSend = toolId.toUpperCase().includes("LIST") || 
                         toolId.toUpperCase().includes("SEND") ||
                         toolId.toUpperCase().includes("FETCH") ||
                         toolId.toUpperCase().includes("GET_MAIL");
    
    if (isTarget || isListOrSend) {
      console.log("=".repeat(80));
      console.log(`TOOL: ${toolId}`);
      console.log(`Name: ${tool.displayName || tool.name}`);
      console.log(`Description: ${tool.description?.slice(0, 100)}...`);
      console.log("");
      
      // Input Parameters
      console.log("INPUT PARAMETERS:");
      const inputParams = tool.inputParameters || tool.parameters?.properties || {};
      if (Object.keys(inputParams).length === 0) {
        console.log("  (none)");
      } else {
        console.log(JSON.stringify(inputParams, null, 2));
      }
      console.log("");
      
      // Output Parameters
      console.log("OUTPUT PARAMETERS:");
      const outputParams = tool.outputParameters || {};
      if (Object.keys(outputParams).length === 0) {
        console.log("  (none or not specified)");
      } else {
        console.log(JSON.stringify(outputParams, null, 2));
      }
      console.log("");
    }
  }
  
  // Also list all Gmail tool names for reference
  console.log("=".repeat(80));
  console.log("ALL GMAIL TOOLS:");
  for (const tool of tools) {
    const toolId = tool.slug || tool.name || "";
    console.log(`  - ${toolId}`);
  }
}

checkGmailSchemas().catch(console.error);

