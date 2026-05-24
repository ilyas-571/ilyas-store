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

const workspaceRoot = path.resolve(__dirname, "../..");

function runCommand(command: string, cwd: string = workspaceRoot) {
  console.log(`🏃 Running: ${command} in ${cwd}`);
  return execSync(command, { cwd, encoding: "utf-8" });
}

function runVercelLink(projectName: string) {
  console.log(`🔗 Linking project "${projectName}" on Vercel...`);
  try {
    runCommand(`npx vercel link --yes --token ${VERCEL_TOKEN} --scope ${VERCEL_SCOPE} --project ${projectName}`);
  } catch (err) {
    console.log("⚠️ Link command exited with warning (possibly GitHub connection prompt). Checking if link file was created...");
    const projectJsonPath = path.join(workspaceRoot, ".vercel/project.json");
    if (!fs.existsSync(projectJsonPath)) {
      throw new Error(`Failed to link project "${projectName}": .vercel/project.json was not created.`);
    }
    console.log("✅ .vercel/project.json exists, continuing!");
  }
}

async function vercelApiRequest(endpoint: string, options: any = {}) {
  const url = `https://api.vercel.com${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Authorization": `Bearer ${VERCEL_TOKEN}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Vercel API Error [${response.status}]: ${text}`);
  }

  return response.json();
}

async function configureVercelProject(settings: { rootDirectory: string; installCommand?: string | null; buildCommand?: string | null; outputDirectory?: string | null; framework?: string | null }) {
  const projectJsonPath = path.join(workspaceRoot, ".vercel/project.json");
  if (!fs.existsSync(projectJsonPath)) {
    throw new Error(".vercel/project.json not found. Did the link command fail?");
  }

  const projectConfig = JSON.parse(fs.readFileSync(projectJsonPath, "utf-8"));
  const projectId = projectConfig.projectId;
  const teamId = projectConfig.orgId.startsWith("team_") ? projectConfig.orgId : undefined;

  console.log(`🔧 Configuring Vercel project ${projectId} settings...`, settings);
  const queryParam = teamId ? `?teamId=${teamId}` : "";
  
  await vercelApiRequest(`/v9/projects/${projectId}${queryParam}`, {
    method: "PATCH",
    body: JSON.stringify(settings),
  });
  console.log(`✅ Vercel project settings configured successfully!`);
}

function cleanVercelConfig() {
  const dotVercelDir = path.join(workspaceRoot, ".vercel");
  if (fs.existsSync(dotVercelDir)) {
    console.log("🧹 Cleaning up local .vercel configuration directory...");
    fs.rmSync(dotVercelDir, { recursive: true, force: true });
  }
}

function addVercelEnv(key: string, value: string) {
  try {
    runCommand(`npx vercel env rm ${key} production --token ${VERCEL_TOKEN} --scope ${VERCEL_SCOPE} --yes`);
  } catch (e) {
    // Ignore if not exists
  }
  console.log(`🏃 Adding environment variable ${key} to production...`);
  execSync(`npx vercel env add ${key} production --token ${VERCEL_TOKEN} --scope ${VERCEL_SCOPE}`, {
    cwd: workspaceRoot,
    input: value,
    stdio: ["pipe", "ignore", "inherit"],
  });
}

async function main() {
  try {
    console.log("🚀 Starting Vercel-Only Deployment Automator (Monorepo Workspace Mode)...");

    // === STEP 1: Deploy API Server to Vercel ===
    console.log("\n--- STEP 1: Deploying API Server ---");
    cleanVercelConfig();
    runVercelLink("ilyas-store-api");

    console.log("🔧 Configuring monorepo settings for API Server project...");
    await configureVercelProject({
      rootDirectory: "artifacts/api-server",
      installCommand: "pnpm install --ignore-scripts",
      buildCommand: "",
      outputDirectory: null,
      framework: null
    });

    console.log("⚙️ Setting up environment variables for API Server on Vercel...");
    addVercelEnv("DATABASE_URL", DATABASE_URL);
    addVercelEnv("SESSION_SECRET", "ilyas-store-prod-session-secret-key-999");
    addVercelEnv("PORT", "5000");
    addVercelEnv("NODE_ENV", "production");

    console.log("🚀 Launching API Server deployment on Vercel...");
    const apiDeployOutput = runCommand(`npx vercel --prod --token ${VERCEL_TOKEN} --scope ${VERCEL_SCOPE} --yes`);
    console.log(apiDeployOutput);

    const apiURLMatch = apiDeployOutput.match(/https:\/\/[a-zA-Z0-9-]+\.vercel\.app/);
    if (!apiURLMatch) {
      throw new Error("Could not find Vercel deployment URL for API Server");
    }
    const apiURL = apiURLMatch[0];
    console.log(`✅ API Server is live at: ${apiURL}`);

    // === STEP 2: Deploy Frontend to Vercel ===
    console.log("\n--- STEP 2: Deploying Frontend ---");
    cleanVercelConfig();
    runVercelLink("ilyas-store");

    console.log("🔧 Configuring monorepo settings for Frontend project...");
    await configureVercelProject({
      rootDirectory: "artifacts/ilyas-store",
      installCommand: "pnpm install --ignore-scripts",
      buildCommand: "pnpm run build",
      outputDirectory: null, // Vite default is dist/public as configured in vercel.json
      framework: "vite"
    });

    console.log("⚙️ Setting up environment variables for Frontend on Vercel...");
    addVercelEnv("VITE_API_URL", apiURL);

    console.log("🚀 Launching Frontend deployment on Vercel...");
    const frontendDeployOutput = runCommand(`npx vercel --prod --token ${VERCEL_TOKEN} --scope ${VERCEL_SCOPE} --yes`);
    console.log(frontendDeployOutput);

    const frontendURLMatch = frontendDeployOutput.match(/https:\/\/[a-zA-Z0-9-]+\.vercel\.app/);
    if (!frontendURLMatch) {
      throw new Error("Could not find Vercel deployment URL for Frontend");
    }
    const frontendURL = frontendURLMatch[0];
    console.log(`✅ Frontend is live at: ${frontendURL}`);

    // === STEP 3: Configure CORS on API Server ===
    console.log("\n--- STEP 3: Configuring CORS on API Server ---");
    cleanVercelConfig();
    runVercelLink("ilyas-store-api");

    console.log(`⚙️ Setting CORS_ORIGIN on API Server to: ${frontendURL}`);
    addVercelEnv("CORS_ORIGIN", frontendURL);

    console.log("🚀 Redeploying API Server to apply CORS changes...");
    const apiRedeployOutput = runCommand(`npx vercel --prod --token ${VERCEL_TOKEN} --scope ${VERCEL_SCOPE} --yes`);
    console.log(apiRedeployOutput);

    // Clean up configuration directories to keep project pristine
    cleanVercelConfig();

    console.log("\n=======================================================");
    console.log("🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!");
    console.log(`🛒 Storefront (Frontend): ${frontendURL}`);
    console.log(`⚡ API Backend: ${apiURL}`);
    console.log("=======================================================\n");

  } catch (error) {
    cleanVercelConfig();
    console.error("❌ Deployment failed with error:", error);
    process.exit(1);
  }
}

main();
