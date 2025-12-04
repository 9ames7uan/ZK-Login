const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const ZKLoginSDK = require("./index");

const app = express();
const port = 3000;
const zkLogin = new ZKLoginSDK();

app.use(cors());
app.use(bodyParser.json());

// [新增] 1. 設定靜態檔案目錄 (用來放網頁)
app.use(express.static("public"));

// [新增] 2. 開放 build 資料夾，讓瀏覽器可以下載 .wasm 和 .zkey
app.use("/build", express.static("build"));

console.log("🍺 Starting ZK-Bar Backend & Web Server...");

// [新增] 3. 模擬「連接錢包」API
// 前端呼叫這個 API 來取得我們剛才生成的 "政府簽名身分證"
app.get("/api/identity", (req, res) => {
  try {
    const identityPath = path.join(__dirname, "tests/identity_card.json");
    if (!fs.existsSync(identityPath)) {
      return res
        .status(404)
        .json({
          error:
            "Identity card not found. Run 'node scripts/government_issue.js' first.",
        });
    }
    const identity = JSON.parse(fs.readFileSync(identityPath));
    res.json(identity);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * API: 驗證 Proof
 */
app.post("/verify", async (req, res) => {
  try {
    const { proof, publicSignals } = req.body;
    console.log("🔍 Received verification request...");

    // 驗證 Proof
    const isValid = await zkLogin.verifyProof(proof, publicSignals);

    // 檢查是否成年 (publicSignals[0] is 'isAdult')
    const isAdult = publicSignals[0] === "1";

    if (isValid && isAdult) {
      console.log("✅ Verified: User is Adult.");
      // 模擬隨機產生一個入場 Token
      const token =
        "ZK-PASS-" + Math.random().toString(36).substring(7).toUpperCase();
      return res.status(200).json({ success: true, token: token });
    } else {
      console.log("⛔ Verification Failed.");
      return res
        .status(403)
        .json({ success: false, message: "Invalid Proof or Underage" });
    }
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`
    =============================================
    🍷 ZK-Bar Demo is live!
    👉 Open Browser: http://localhost:3000
    =============================================
    `);
});
