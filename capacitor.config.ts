import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.geneloai.app",
  appName: "Geneloai",
  webDir: "dist/client",
  server: {
    androidScheme: "https",
    // For live-reload against the deployed site, uncomment:
    // url: "https://geneloai.lovable.app",
    // cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
