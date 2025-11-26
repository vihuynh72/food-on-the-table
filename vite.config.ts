import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    /**
     * Expose a Next.js-style public env var for teams migrating from Next to Vite.
     * This lets DonationMap read `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` if present,
     * while still supporting the standard `VITE_GOOGLE_MAPS_API_KEY`.
     */
    define: {
      __NEXT_PUBLIC_GOOGLE_MAPS_API_KEY__: JSON.stringify(env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY),
    },
  };
});
