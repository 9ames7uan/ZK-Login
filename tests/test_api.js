// A client script that talks to the ZK-Bar Server
const snarkjs = require("snarkjs");
const path = require("path");

// Native fetch (Node 18+)
// If using older node, you might need 'node-fetch'
// But since we installed nodejs20, this works out of the box.

async function clientFlow() {
  console.log("👤 [Client] Generating Proof on device...");

  const wasmPath = path.join(__dirname, "../build/age_check_js/age_check.wasm");
  const zkeyPath = path.join(__dirname, "../build/circuit_final.zkey");

  // 1. Generate Proof locally
  const input = {
    birthYear: 2000, // 25 years old
    secretSalt: "999999",
    currentYear: 2025,
    ageThreshold: 18,
  };

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    input,
    wasmPath,
    zkeyPath
  );

  console.log("📡 [Client] Sending Proof to ZK-Bar Server...");

  // 2. Send to Server
  try {
    const response = await fetch("http://localhost:3000/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proof, publicSignals }),
    });

    const result = await response.json();

    console.log("\n📬 Server Response:");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Connection Error:", error);
  }
}

clientFlow();
