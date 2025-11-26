#!/usr/bin/env node
import fs from "fs";
import path from "path";

const argKey = process.argv.find((arg) => arg.startsWith("--key="));
const keyFromArg = argKey ? argKey.split("=").slice(1).join("=") : undefined;
const key = keyFromArg || process.env.MAPS_KEY || process.env.GOOGLE_MAPS_API_KEY;

if (!key) {
  console.error(
    "No API key provided. Pass --key=<your_key> or set MAPS_KEY / GOOGLE_MAPS_API_KEY in the environment.",
  );
  process.exit(1);
}

const envPath = path.join(process.cwd(), ".env.local");
let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";

const upsertEnvVar = (content, name, value) => {
  const regex = new RegExp(`^${name}=.*$`, "m");
  if (regex.test(content)) {
    return content.replace(regex, `${name}=${value}`);
  }
  const suffix = content.endsWith("\n") || content.length === 0 ? "" : "\n";
  return `${content}${suffix}${name}=${value}\n`;
};

envContent = upsertEnvVar(envContent, "VITE_GOOGLE_MAPS_API_KEY", key);
envContent = upsertEnvVar(envContent, "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", key);

fs.writeFileSync(envPath, envContent, "utf8");
console.log(`Saved Google Maps API key to ${envPath}.`);
console.log("VITE_GOOGLE_MAPS_API_KEY and NEXT_PUBLIC_GOOGLE_MAPS_API_KEY are now set for local runs.");
