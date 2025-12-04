pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/comparators.circom";
// [FIXED] 改用標準 MiMC 版，而非 Sponge 版
include "../node_modules/circomlib/circuits/eddsamimc.circom"; 
include "../node_modules/circomlib/circuits/mimc.circom";

template AgeCheck() {
    // ============================================
    // 1. 定義輸入 (Inputs)
    // ============================================
    
    // --- Private Inputs ---
    signal input birthYear; 
    signal input signatureR8x;
    signal input signatureR8y;
    signal input signatureS;

    // --- Public Inputs ---
    signal input currentYear;
    signal input ageThreshold; 
    signal input pubKeyAx; 
    signal input pubKeyAy;

    // Output
    signal output isAdult;

    // ============================================
    // 2. 驗證數位簽章 (Signature Verification)
    // ============================================
    
    // 步驟 A: Hash 訊息 (MiMC7)
    component hasher = MiMC7(91); 
    hasher.x_in <== birthYear;
    hasher.k <== 0; 

    // 步驟 B: 驗證簽章
    // [FIXED] 改用 EdDSAMiMCVerifier (對應 JS 的 signMiMC)
    component verifier = EdDSAMiMCVerifier();
    
    verifier.enabled <== 1;
    verifier.Ax <== pubKeyAx;
    verifier.Ay <== pubKeyAy;
    verifier.S <== signatureS;
    verifier.R8x <== signatureR8x;
    verifier.R8y <== signatureR8y;
    verifier.M <== hasher.out;

    // ============================================
    // 3. 邏輯運算 (年齡檢查)
    // ============================================

    signal age;
    age <== currentYear - birthYear;

    component ge = GreaterEqThan(7); 
    ge.in[0] <== age;
    ge.in[1] <== ageThreshold;

    isAdult <== ge.out;
}

component main {public [currentYear, ageThreshold, pubKeyAx, pubKeyAy]} = AgeCheck();