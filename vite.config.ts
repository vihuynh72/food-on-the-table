import { defineConfig, type PluginOption, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import type { IncomingMessage, ServerResponse } from "http";
import placeDetailsHandler from "./api/place-details";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isDevelopment = mode === "development";
  const env = loadEnv(mode, process.cwd(), "");
  // Prefer the dedicated server key; the browser Maps key should be referrer-restricted
  const googleApiKey = env.PLACE_DETAILS_API_KEY || env.VITE_GOOGLE_MAPS_API_KEY;

  const devApiProxy: PluginOption | undefined = isDevelopment
    ? {
        name: "dev-place-details-proxy",
        configureServer(server) {
          server.middlewares.use("/api/place-details", async (req: IncomingMessage, res: ServerResponse) => {
            try {
              const webRequest = await convertNodeRequestToWeb(req);
              const response = await placeDetailsHandler(webRequest, googleApiKey);
              res.statusCode = response.status;
              response.headers.forEach((value, key) => {
                res.setHeader(key, value);
              });
              const body = Buffer.from(await response.arrayBuffer());
              res.end(body);
            } catch (error) {
              console.error("Local place-details proxy failed", error);
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(
                JSON.stringify({
                  error: "Local place-details proxy failed",
                  message: error instanceof Error ? error.message : String(error),
                }),
              );
            }
          });
        },
      }
    : undefined;

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [react(), isDevelopment && componentTagger(), devApiProxy].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});

async function convertNodeRequestToWeb(req: IncomingMessage): Promise<Request> {
  const body = await readRequestBody(req);
  const headers = new Headers();
  Object.entries(req.headers).forEach(([key, value]) => {
    if (value === undefined) return;
    headers.set(key, Array.isArray(value) ? value.join(", ") : value);
  });

  const origin = `http://${req.headers.host ?? "localhost"}`;
  const url = new URL(req.url ?? "/api/place-details", origin);

  return new Request(url, {
    method: req.method,
    headers,
    body: req.method && ["GET", "HEAD"].includes(req.method) ? undefined : body,
  });
}

function readRequestBody(req: IncomingMessage): Promise<string | undefined> {
  if (!req.method || ["GET", "HEAD"].includes(req.method)) {
    return Promise.resolve(undefined);
  }

  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      resolve(data);
    });
    req.on("error", (err) => {
      reject(err);
    });
  });
}
