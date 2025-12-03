const snarkjs = require("snarkjs");
const fs = require("fs");
const path = require("path");

async function run() {
  console.log("🚀 Starting ZK-Login Flow Test...");

  // =========================================================
  // 0. 設定路徑 (Configuration)
  // =========================================================
  // __dirname 代表當前檔案所在的資料夾 (tests/)
  // 我們往上一層 (../) 去找 build 資料夾
  const wasmPath = path.join(__dirname, "../build/age_check_js/age_check.wasm");
  const zkeyPath = path.join(__dirname, "../build/circuit_final.zkey");
  const vkeyPath = path.join(__dirname, "../build/verification_key.json");

  // =========================================================
  // 1. [使用者端] 產生證明 (Client Side)
  // =========================================================
  console.log("\n👤 [Client] Generating Proof locally...");

  // 模擬情境：使用者 25 歲 (出生於 2000)，門檻是 18 歲
  const currentYear = 2025;
  const birthYear = 2000;
  const ageThreshold = 18;

  // 準備輸入給電路的資料
  const input = {
    birthYear: birthYear,
    secretSalt: "123456789", // 亂數種子
    currentYear: currentYear,
    ageThreshold: ageThreshold,
  };

  const startTime = Date.now();

  // 核心魔法：產生 Proof
  // publicSignals 會包含 [已成年(1), 2025, 18] -> 絕對沒有出生年份！
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    input,
    wasmPath,
    zkeyPath
  );

  const endTime = Date.now();
  console.log(`✅ Proof Generated in ${endTime - startTime}ms`);
  console.log("   Public Signals:", publicSignals);

  // 檢查第一個輸出訊號是否為 1
  if (publicSignals[0] === "1") {
    console.log("   -> Result: User claims to be Adult.");
  } else {
    console.log("   -> Result: User is NOT an Adult.");
  }

  // =========================================================
  // 2. [網路傳輸] (Network)
  // =========================================================
  // 在真實 App 中，這裡會把 proof 和 publicSignals 發送給伺服器
  // 伺服器永遠不會收到 'birthYear'

  // =========================================================
  // 3. [伺服器端] 驗證證明 (Server Side)
  // =========================================================
  console.log("\n🏢 [Server] Verifying Proof...");

  // 讀取伺服器保管的驗證金鑰 (Verification Key)
  const vKey = JSON.parse(fs.readFileSync(vkeyPath));

  // 進行驗證
  const verified = await snarkjs.groth16.verify(vKey, publicSignals, proof);

  if (verified) {
    console.log("🎉 Verification SUCCEEDED!");
    console.log(
      "   We confirmed the user is 18+ without knowing their birth year."
    );
  } else {
    console.log("❌ Verification FAILED!");
    console.log("   The proof is invalid or tampered with.");
  }

  // =========================================================
  // 4. 結束程式
  // =========================================================
  console.log("\n🏁 Test finished. Exiting process...");
  process.exit(0); // <--- 這一行解決了卡住的問題
}

// 執行主程式，若有錯誤則印出並離開
run().catch((error) => {
  console.error("❌ Error occurred:", error);
  process.exit(1);
});
