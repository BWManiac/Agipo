import { Composio } from "@composio/core";

/**
 * Canonical Test Script for Composio SDK
 * 
 * Usage: 
 * export COMPOSIO_API_KEY=ak_UhNaEoKBdAz2W4MosrSY 
 * npx tsx _docs/_tasks/7-composio-spike.ts
 */

async function run() {
    // 1. Setup & Auth
    const apiKey = process.env.COMPOSIO_API_KEY || "ak_UhNaEoKBdAz2W4MosrSY";
    if (!apiKey) { console.error("❌ Missing API Key"); process.exit(1); }

    const client = new Composio({ apiKey });
    const userId = "spike_test_user_final_v3";
    const appSlug = "gmail"; // This works as authConfigId for default integrations

    console.log(`\n🔹 Initializing Composio Client...`);
    console.log(`   User ID: ${userId}`);
    console.log(`   App: ${appSlug}`);

    try {
        // 2. Test Connection Initiation (Correct Syntax: Positional Args)
        console.log("\n--- Connection Initiation Test ---");
        
        // The signature is initiate(userId, authConfigId, options)
        const connection = await client.connectedAccounts.initiate(
            userId,
            appSlug,
            {
                redirectUri: "http://localhost:3000/callback"
            }
        );

        console.log("✅ Connection URL Generated:");
        console.log(`   👉 ${connection.redirectUrl}`);

        // 3. Test Listing Connections
        console.log("\n--- Listing Connections ---");
        const connections = await client.connectedAccounts.list({
            userIds: [userId]
        });

        console.log(`✅ Found ${connections.items.length} connections for user.`);

    } catch (e: any) {
        console.error("\n❌ Error Encountered:");
        console.error("   Message:", e.message);
        if (e.cause) {
            console.dir(e.cause, { depth: 3, colors: true });
        }
    }
}

run();
