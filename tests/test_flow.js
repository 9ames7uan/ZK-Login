const snarkjs = require("snarkjs");
const fs = require("fs");
const path = require("path");

// 引入剛剛生成的「政府身分證」
const identity = require("./identity_card.json");

async function run() {
  console.log("🚀 Starting ZK-Login (Phase 2: Digital Signature) Test...");

  // =========================================================
  // 0. 設定路徑
  // =========================================================
  const wasmPath = path.join(__dirname, "../build/age_check_js/age_check.wasm");
  // 注意：我們用的是 circuit_final.zkey (這是包含 Power 14 的新 Key)
  const zkeyPath = path.join(__dirname, "../build/circuit_final.zkey");
  const vkeyPath = path.join(__dirname, "../build/verification_key.json");

  // =========================================================
  // 1. [使用者端] 產生證明
  // =========================================================
  console.log("\n👤 [Client] Loading Government ID & Generating Proof...");
  console.log(`   -> Identity: Born in ${identity.birthYear}`);
  console.log(`   -> Signature: Verified by Government Key`);

  // 準備輸入 (嚴格對應 age_check.circom)
  const input = {
    birthYear: identity.birthYear,
    signatureR8x: identity.signature.R8[0],
    signatureR8y: identity.signature.R8[1],
    signatureS: identity.signature.S,
    currentYear: 2025,
    ageThreshold: 18,
    pubKeyAx: identity.pubKey[0],
    pubKeyAy: identity.pubKey[1],
  };

  const startTime = Date.now();

  // Generate Proof
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    input,
    wasmPath,
    zkeyPath
  );

  const endTime = Date.now();
  console.log(`✅ Proof Generated in ${endTime - startTime}ms`);

  // publicSignals 的順序取決於電路編譯，通常 main 的 public input 會排在前面
  // 我們只關心 output (isAdult)，通常它會在 signals 的最後或是最前，取決於 Circom 版本
  // 但驗證時 snarkjs 會自動處理對應關係
  console.log("   Public Signals:", publicSignals);

  // =========================================================
  // 2. [伺服器端] 驗證證明
  // =========================================================
  console.log("\n🏢 [Server] Verifying Proof (checking Signature + Age)...");

  const vKey = JSON.parse(fs.readFileSync(vkeyPath));
  const verified = await snarkjs.groth16.verify(vKey, publicSignals, proof);

  if (verified) {
    console.log("🎉 Verification SUCCEEDED!");
    console.log("   SYSTEM SECURE: User has valid Gov ID AND is over 18.");
  } else {
    console.log("❌ Verification FAILED!");
  }

  process.exit(0);
}

run().catch((error) => {
  console.error("❌ Error occurred:", error);
  process.exit(1);
});
