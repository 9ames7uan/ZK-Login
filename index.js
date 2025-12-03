/**
 * ZK-Login SDK
 * A simple wrapper around snarkjs and circom artifacts
 */
const snarkjs = require("snarkjs");
const path = require("path");
const fs = require("fs");

class ZKLoginSDK {
  constructor(options = {}) {
    // 允許使用者自訂 wasm 和 zkey 的路徑，若沒給則使用預設 build 目錄
    this.wasmPath =
      options.wasmPath ||
      path.join(__dirname, "./build/age_check_js/age_check.wasm");
    this.zkeyPath =
      options.zkeyPath || path.join(__dirname, "./build/circuit_final.zkey");
    this.vkeyPath =
      options.vkeyPath || path.join(__dirname, "./build/verification_key.json");
  }

  /**
   * 前端功能：產生證明
   * @param {number} birthYear - 使用者的出生年份 (私密)
   * @param {number} currentYear - 當前年份 (公開)
   * @param {number} ageThreshold - 年齡門檻 (公開)
   * @returns {Object} { proof, publicSignals }
   */
  async generateProof(birthYear, currentYear = 2025, ageThreshold = 18) {
    const input = {
      birthYear: birthYear,
      secretSalt: "123456789", // 實務上這裡應該生成隨機數
      currentYear: currentYear,
      ageThreshold: ageThreshold,
    };

    try {
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        this.wasmPath,
        this.zkeyPath
      );
      return { proof, publicSignals };
    } catch (error) {
      console.error("Proof generation failed:", error);
      throw new Error("Failed to generate proof. Check inputs.");
    }
  }

  /**
   * 後端功能：驗證證明
   * @param {Object} proofData - 包含 proof 和 publicSignals
   * @returns {boolean} isValid
   */
  async verifyProof(proof, publicSignals) {
    try {
      // 讀取 Verification Key
      const vKey = JSON.parse(fs.readFileSync(this.vkeyPath));
      const verified = await snarkjs.groth16.verify(vKey, publicSignals, proof);
      return verified;
    } catch (error) {
      console.error("Verification failed:", error);
      return false;
    }
  }
}

module.exports = ZKLoginSDK;
