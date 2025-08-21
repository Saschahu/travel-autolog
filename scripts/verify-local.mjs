import { readFileSync, existsSync } from "fs";
import { execSync } from "child_process";

// Check capacitor.config.ts basic syntax
try {
  const configContent = readFileSync("./capacitor.config.ts", "utf8").toString();
  // Basic validation that config exists and has required fields
  if (!configContent.includes('com.lovable.travelautolog')) {
    console.error("❌ capacitor.config.ts missing correct appId");
    process.exit(1);
  }
} catch (e) {
  console.error("❌ capacitor.config.ts nicht lesbar:", e.message);
  process.exit(1);
}

// Check android assets config
const assetCfgPath = "./android/app/src/main/assets/capacitor.config.json";
if (existsSync(assetCfgPath)) {
  const asset = JSON.parse(readFileSync(assetCfgPath, "utf8"));
  if (asset?.server?.url) {
    console.error("❌ server.url in android assets!");
    process.exit(1);
  }
}

// Check dist exists
if (!existsSync("./dist/index.html")) {
  console.error("❌ dist fehlt – bitte `npm run build`.");
  process.exit(1);
}

// Check assets sync
if (existsSync("./android/app/src/main/assets/public/index.html")) {
  const d1 = readFileSync("./dist/index.html", "utf8");
  const d2 = readFileSync("./android/app/src/main/assets/public/index.html", "utf8");
  if (d1 !== d2) {
    console.error("❌ assets unterscheiden sich (dist ≠ android assets/public).");
    process.exit(1);
  }
}

console.log("✅ Lokalmodus ok: keine server.url, Assets identisch, dist vorhanden.");