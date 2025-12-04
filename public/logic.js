let myIdentity = null;

// 1. 初始化：網頁載入時，先去跟 Server 拿「模擬身分證」
window.onload = async () => {
  try {
    const res = await fetch("/api/identity");
    const data = await res.json();

    if (data.error) {
      document.getElementById("id-info").innerText = "Error: " + data.error;
      document.getElementById("btn-prove").disabled = true;
      return;
    }

    myIdentity = data;
    document.getElementById(
      "id-info"
    ).innerText = `Birth Year: ${myIdentity.birthYear} (Hidden)\nStatus: Valid Signature`;
  } catch (err) {
    console.error(err);
    document.getElementById("id-info").innerText = "Failed to load ID wallet.";
  }
};

// 2. 核心功能：產生並驗證
async function generateAndVerify() {
  const btn = document.getElementById("btn-prove");
  const status = document.getElementById("status-text");

  if (!myIdentity) return;

  try {
    // UI 更新
    btn.disabled = true;
    btn.innerText = "CALCULATING PROOF...";
    status.innerText = "🔒 Generating Zero-Knowledge Proof in browser...";
    status.style.color = "#ec7e42";

    // 準備輸入 (跟測試腳本一模一樣)
    const input = {
      birthYear: myIdentity.birthYear,
      signatureR8x: myIdentity.signature.R8[0],
      signatureR8y: myIdentity.signature.R8[1],
      signatureS: myIdentity.signature.S,
      currentYear: 2025,
      ageThreshold: 18,
      pubKeyAx: myIdentity.pubKey[0],
      pubKeyAy: myIdentity.pubKey[1],
    };

    // --- ZK Magic Happens Here ---
    // 瀏覽器端下載 .wasm 和 .zkey 並運算
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      "/build/age_check_js/age_check.wasm",
      "/build/circuit_final.zkey"
    );

    status.innerText = "📡 Sending Proof to Verifier...";

    // 發送給後端驗證
    const verifyRes = await fetch("/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proof, publicSignals }),
    });

    const result = await verifyRes.json();

    if (result.success) {
      // 成功：切換畫面
      document.getElementById("login-screen").classList.add("hidden");
      document.getElementById("success-screen").classList.remove("hidden");
      document.getElementById("token-display").innerText = result.token;
    } else {
      // 失敗
      status.innerText = "❌ Verification Failed: " + result.message;
      status.style.color = "red";
      btn.disabled = false;
      btn.innerText = "TRY AGAIN";
    }
  } catch (err) {
    console.error(err);
    status.innerText = "❌ Error: " + err.message;
    btn.disabled = false;
    btn.innerText = "TRY AGAIN";
  }
}
