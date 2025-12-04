const { buildEddsa, buildMimc7 } = require("circomlibjs");
const fs = require("fs");
const path = require("path");

async function main() {
  // 1. 初始化密碼學庫
  const eddsa = await buildEddsa();
  const mimc = await buildMimc7();

  // 2. 模擬政府 (Issuer) 生成金鑰
  const prvKey = Buffer.from(
    "0001020304050607080900010203040506070809000102030405060708090001",
    "hex"
  );
  const pubKey = eddsa.prv2pub(prvKey);

  console.log("🏛️  Government Public Key (Ax, Ay):");
  console.log("   Ax:", eddsa.F.toString(pubKey[0]));
  console.log("   Ay:", eddsa.F.toString(pubKey[1]));

  // 3. 準備要簽署的資料
  const birthYear = 2000;

  // [FIXED] 關鍵修改在這裡！
  // 原本: mimc.multiHash([birthYear]) -> 這是 Sponge 模式，跟電路不合
  // 修改: mimc.hash(birthYear, 0)     -> 這是 Block Cipher 模式 (x_in=birthYear, k=0)，跟電路一致
  const messageHash = mimc.hash(birthYear, 0);

  // 4. 進行簽章 (Sign)
  // 使用 signMiMC 簽署 Hash 過的訊息
  const signature = eddsa.signMiMC(prvKey, messageHash);

  console.log("\n✍️  Signed Identity for Birth Year:", birthYear);
  console.log("   Signature (R8x):", eddsa.F.toString(signature.R8[0]));
  console.log("   Signature (R8y):", eddsa.F.toString(signature.R8[1]));
  console.log("   Signature (S):", signature.S.toString());

  // 5. 輸出 JSON
  const output = {
    pubKey: [eddsa.F.toString(pubKey[0]), eddsa.F.toString(pubKey[1])],
    signature: {
      R8: [
        eddsa.F.toString(signature.R8[0]),
        eddsa.F.toString(signature.R8[1]),
      ],
      S: signature.S.toString(),
    },
    birthYear: birthYear,
  };

  fs.writeFileSync(
    path.join(__dirname, "../tests/identity_card.json"),
    JSON.stringify(output, null, 2)
  );
  console.log("\n✅ Identity Card issued to tests/identity_card.json");
}

main();
