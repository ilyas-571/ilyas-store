import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
const envPath = path.resolve(__dirname, "../../.env");
const env: Record<string, string> = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*["']?(.*?)["']?\s*$/i);
    if (match) {
      env[match[1]] = match[2].trim();
    }
  }
}

const DATABASE_URL = env.DATABASE_URL;
const RENDER_API_KEY = env.RENDER_API_KEY;
const VERCEL_TOKEN = env.VERCEL_TOKEN;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL is missing in .env");
  process.exit(1);
}

if (!RENDER_API_KEY) {
  console.error("❌ RENDER_API_KEY is missing in .env");
  process.exit(1);
}

if (!VERCEL_TOKEN) {
  console.error("❌ VERCEL_TOKEN is missing in .env");
  process.exit(1);
}

async function renderRequest(endpoint: string, options: any = {}) {
  const url = `https://api.render.com/v1${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Authorization": `Bearer ${RENDER_API_KEY}`,
      "Accept": "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Render API Error [${response.status}]: ${text}`);
  }

  return response.json();
}

async function main() {
  try {
    console.log("🚀 Starting deployment automation...");

    // 1. Get Render Owner ID
    console.log("🔍 Fetching Render owner details...");
    const owners = await renderRequest("/owners?limit=20");
    if (!owners || owners.length === 0) {
      throw new Error("No owners found on your Render account.");
    }
    const ownerId = owners[0].owner.id;
    console.log(`✅ Found Render owner ID: ${ownerId}`);

    // 2. Check if API service already exists, if not, create it
    console.log("🔍 Checking existing Render services...");
    const services = await renderRequest(`/services?limit=100&ownerId=${ownerId}`);
    let apiService = services.find((s: any) => s.service.name === "ilyas-store-api");

    if (apiService) {
      console.log(`✅ Existing service found: ${apiService.service.id}`);
      apiService = apiService.service;
    } else {
      console.log("🏗️ Creating new Render Web Service 'ilyas-store-api'...");
      const servicePayload = {
        type: "web_service",
        name: "ilyas-store-api",
        ownerId,
        repo: "https://github.com/ilyas-571/ilyas-store.git",
        branch: "main",
        rootDir: "artifacts/api-server",
        autoDeploy: "yes",
        serviceDetails: {
          env: "node",
          plan: "free",
          envVars: [
            { key: "DATABASE_URL", value: DATABASE_URL },
            { key: "SESSION_SECRET", value: "ilyas-store-prod-session-secret-key-999" },
            { key: "PORT", value: "5000" },
            { key: "NODE_ENV", value: "production" }
          ],
          envSpecificDetails: {
            buildCommand: "cd ../.. && pnpm install && pnpm --filter @workspace/api-server run build",
            startCommand: "node dist/index.mjs"
          }
        }
      };

      const creationResult = await renderRequest("/services", {
        method: "POST",
        body: JSON.stringify(servicePayload),
      });
      apiService = creationResult.service || creationResult;
      console.log(`✅ Render Web Service created successfully! Service ID: ${apiService.id}`);
    }

    const renderUrl = apiService.url || `https://${apiService.name}.onrender.com`;
    console.log(`🌐 Render API Server URL: ${renderUrl}`);

    // 3. Deploy Frontend on Vercel
    const frontendDir = path.resolve(__dirname, "../../artifacts/ilyas-store");
    console.log(`📦 Deploying frontend on Vercel from: ${frontendDir}`);

    // Create or unlink if necessary, then add environment variable
    try {
      console.log("🧹 Removing existing environment variables on Vercel if any...");
      execSync(`npx vercel env rm VITE_API_URL production preview development --token ${VERCEL_TOKEN} --yes`, {
        cwd: frontendDir,
        stdio: "ignore",
      });
    } catch (e) {
      // Ignore if not exists
    }

    console.log(`➕ Adding VITE_API_URL environment variable to Vercel pointing to Render: ${renderUrl}`);
    execSync(`npx vercel env add VITE_API_URL ${renderUrl} production preview development --token ${VERCEL_TOKEN}`, {
      cwd: frontendDir,
      stdio: "inherit",
    });

    console.log("🚀 Running Vercel deployment (this may take 1-2 minutes)...");
    const vercelOutput = execSync(`npx vercel --prod --token ${VERCEL_TOKEN} --yes`, {
      cwd: frontendDir,
      encoding: "utf-8",
    });

    console.log("Vercel CLI Output:");
    console.log(vercelOutput);

    // Extract Vercel URL
    const vercelUrlMatch = vercelOutput.match(/https:\/\/[a-zA-Z0-9-]+\.vercel\.app/);
    if (!vercelUrlMatch) {
      throw new Error("Could not parse Vercel deployment URL from CLI output.");
    }
    const vercelUrl = vercelUrlMatch[0];
    console.log(`✅ Vercel Frontend deployed successfully! URL: ${vercelUrl}`);

    // 4. Update Render Environment Variables with Vercel URL (CORS)
    console.log(`🔄 Updating Render service variables to allow CORS from: ${vercelUrl}`);
    const currentEnvVars = await renderRequest(`/services/${apiService.id}/env-vars`);
    
    // Merge or update CORS_ORIGIN
    const updatedEnvVars = currentEnvVars.map((v: any) => v.envVar).filter((v: any) => v.key !== "CORS_ORIGIN");
    updatedEnvVars.push({ key: "CORS_ORIGIN", value: vercelUrl });

    await renderRequest(`/services/${apiService.id}/env-vars`, {
      method: "PUT",
      body: JSON.stringify(updatedEnvVars),
    });
    console.log("✅ Render environment variables updated successfully!");

    // 5. Trigger redeploy on Render
    console.log("🔄 Triggering redeploy on Render to apply CORS settings...");
    await renderRequest(`/services/${apiService.id}/deploys`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    console.log("✅ Redeploy triggered!");

    console.log("\n=======================================================");
    console.log("🎉 DEPLOYMENT AUTOMATION COMPLETED SUCCESSFULLY!");
    console.log(`🛒 Storefront (Frontend): ${vercelUrl}`);
    console.log(`⚡ API Backend: ${renderUrl}`);
    console.log("=======================================================\n");

  } catch (error) {
    console.error("❌ Deployment failed with error:", error);
    process.exit(1);
  }
}

main();
