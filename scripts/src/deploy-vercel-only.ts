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
const VERCEL_TOKEN = env.VERCEL_TOKEN;
const VERCEL_SCOPE = "khanedit8-5795s-projects";

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL is missing in .env");
  process.exit(1);
}

if (!VERCEL_TOKEN) {
  console.error("❌ VERCEL_TOKEN is missing in .env");
  process.exit(1);
}

function runCommand(command: string, cwd: string) {
  console.log(`🏃 Running: ${command} in ${cwd}`);
  return execSync(command, { cwd, encoding: "utf-8" });
}

function addVercelEnv(key: string, value: string, cwd: string) {
  try {
    execSync(`npx vercel env rm ${key} production --token ${VERCEL_TOKEN} --scope ${VERCEL_SCOPE} --yes`, {
      cwd,
      stdio: "ignore",
    });
  } catch (e) {
    // Ignore if not exists
  }
  console.log(`🏃 Adding environment variable ${key} to production...`);
  execSync(`npx vercel env add ${key} production --token ${VERCEL_TOKEN} --scope ${VERCEL_SCOPE}`, {
    cwd,
    input: value,
    stdio: ["pipe", "ignore", "inherit"],
  });
}

async function main() {
  try {
    console.log("🚀 Starting Vercel-Only Deployment Automator...");

    const apiDir = path.resolve(__dirname, "../../artifacts/api-server");
    const frontendDir = path.resolve(__dirname, "../../artifacts/ilyas-store");

    // === STEP 1: Deploy API Server to Vercel ===
    console.log("\n--- STEP 1: Deploying API Server ---");
    console.log("🔗 Linking API Server project on Vercel...");
    runCommand(`npx vercel link --yes --token ${VERCEL_TOKEN} --scope ${VERCEL_SCOPE}`, apiDir);

    console.log("⚙️ Setting up environment variables for API Server on Vercel...");
    addVercelEnv("DATABASE_URL", DATABASE_URL, apiDir);
    addVercelEnv("SESSION_SECRET", "ilyas-store-prod-session-secret-key-999", apiDir);
    addVercelEnv("PORT", "5000", apiDir);
    addVercelEnv("NODE_ENV", "production", apiDir);

    console.log("🚀 Launching API Server deployment on Vercel...");
    const apiDeployOutput = runCommand(`npx vercel --prod --token ${VERCEL_TOKEN} --scope ${VERCEL_SCOPE} --yes`, apiDir);
    console.log(apiDeployOutput);

    const apiURLMatch = apiDeployOutput.match(/https:\/\/[a-zA-Z0-9-]+\.vercel\.app/);
    if (!apiURLMatch) {
      throw new Error("Could not find Vercel deployment URL for API Server");
    }
    const apiURL = apiURLMatch[0];
    console.log(`✅ API Server is live at: ${apiURL}`);

    // === STEP 2: Deploy Frontend to Vercel ===
    console.log("\n--- STEP 2: Deploying Frontend ---");
    console.log("🔗 Linking Frontend project on Vercel...");
    runCommand(`npx vercel link --yes --token ${VERCEL_TOKEN} --scope ${VERCEL_SCOPE}`, frontendDir);

    console.log("⚙️ Setting up environment variables for Frontend on Vercel...");
    addVercelEnv("VITE_API_URL", apiURL, frontendDir);

    console.log("🚀 Launching Frontend deployment on Vercel...");
    const frontendDeployOutput = runCommand(`npx vercel --prod --token ${VERCEL_TOKEN} --scope ${VERCEL_SCOPE} --yes`, frontendDir);
    console.log(frontendDeployOutput);

    const frontendURLMatch = frontendDeployOutput.match(/https:\/\/[a-zA-Z0-9-]+\.vercel\.app/);
    if (!frontendURLMatch) {
      throw new Error("Could not find Vercel deployment URL for Frontend");
    }
    const frontendURL = frontendURLMatch[0];
    console.log(`✅ Frontend is live at: ${frontendURL}`);

    // === STEP 3: Configure CORS on API Server ===
    console.log("\n--- STEP 3: Configuring CORS on API Server ---");
    console.log(`⚙️ Setting CORS_ORIGIN on API Server to: ${frontendURL}`);
    addVercelEnv("CORS_ORIGIN", frontendURL, apiDir);

    console.log("🚀 Redeploying API Server to apply CORS changes...");
    const apiRedeployOutput = runCommand(`npx vercel --prod --token ${VERCEL_TOKEN} --scope ${VERCEL_SCOPE} --yes`, apiDir);
    console.log(apiRedeployOutput);

    console.log("\n=======================================================");
    console.log("🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!");
    console.log(`🛒 Storefront (Frontend): ${frontendURL}`);
    console.log(`⚡ API Backend: ${apiURL}`);
    console.log("=======================================================\n");

  } catch (error) {
    console.error("❌ Deployment failed with error:", error);
    process.exit(1);
  }
}

main();
