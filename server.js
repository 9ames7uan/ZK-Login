const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const ZKLoginSDK = require("./index"); // Import your SDK

const app = express();
const port = 3000;

// Initialize SDK
const zkLogin = new ZKLoginSDK();

// Middleware
app.use(cors());
app.use(bodyParser.json());

console.log("🍺 Starting ZK-Bar Backend...");

/**
 * API Endpoint: /verify
 * The "Digital Bouncer". Receives a proof and decides entry.
 */
app.post("/verify", async (req, res) => {
  try {
    const { proof, publicSignals } = req.body;

    if (!proof || !publicSignals) {
      return res.status(400).json({
        success: false,
        message: "Missing proof or signals.",
      });
    }

    console.log("🔍 Received proof verification request...");

    // 1. Verify the proof using our SDK
    const isValid = await zkLogin.verifyProof(proof, publicSignals);

    // 2. Check business logic (e.g., is Adult?)
    // publicSignals[0] is 'isAdult' (1 or 0)
    const isAdult = publicSignals[0] === "1";

    if (isValid && isAdult) {
      console.log("✅ User is verified and adult. Entry granted.");
      return res.status(200).json({
        success: true,
        message: "Welcome to ZK-Bar! Here is your entrance ticket.",
        token: "beer-token-" + Date.now(), // Mock session token
      });
    } else {
      console.log("⛔ Verification failed or underage.");
      return res.status(403).json({
        success: false,
        message: "Entry Denied. Invalid proof or underage.",
      });
    }
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`
    =============================================
    🍷 ZK-Bar Server is running on port ${port}
    👉 POST http://localhost:3000/verify
    =============================================
    `);
});
