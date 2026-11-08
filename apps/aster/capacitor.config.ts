import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl =
  process.env.CAPACITOR_SERVER_URL ??
  "https://aster-portfolio-ledger.senapati-jyotirmay.chatgpt.site";

const config: CapacitorConfig = {
  appId: "app.aster.portfolio",
  appName: "Aster Portfolio",
  webDir: "mobile",
  ...(serverUrl
    ? {
        server: {
          url: serverUrl,
          cleartext: false,
          androidScheme: "https",
        },
      }
    : {}),
};

export default config;
