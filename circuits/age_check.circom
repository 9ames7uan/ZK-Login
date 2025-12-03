pragma circom 2.0.0;

// 引入 circomlib 的比較器 (Comparators)
// 注意：node_modules 路徑要正確
include "../node_modules/circomlib/circuits/comparators.circom";

template AgeCheck() {
    // ============================================
    // 1. 定義輸入 (Inputs)
    // ============================================
    
    // Private Inputs (隱私資料：只有使用者知道)
    signal input birthYear; 
    signal input secretSalt; // 隨機亂數，防止暴力破解 (本範例暫未用於 Hash，僅作保留)

    // Public Inputs (公開資料：驗證者/伺服器知道)
    signal input currentYear;
    signal input ageThreshold; // 例如：18

    // Output (輸出：1 代表通過，0 代表失敗)
    signal output isAdult;

    // ============================================
    // 2. 邏輯運算 (Logic)
    // ============================================

    // 計算年齡: age = currentYear - birthYear
    signal age;
    age <== currentYear - birthYear;

    // 檢查: age >= ageThreshold
    // 我們使用 GreaterEqThan(n) 模板，n 是位元數。
    // 7 bits 足夠表示 0-127 歲
    component ge = GreaterEqThan(7); 
    
    ge.in[0] <== age;
    ge.in[1] <== ageThreshold;

    // 將比較結果輸出
    isAdult <== ge.out;

    // ============================================
    // 3. 強制約束 (Constraints) - 選用
    // ============================================
    // 如果希望「未滿 18 歲連 Proof 都產生不了」，可以加上這行：
    // isAdult === 1;
}

// 定義 Main Component
// public inputs 宣告哪些變數是公開的 (Verifier 必須知道 currentYear 和門檻)
component main {public [currentYear, ageThreshold]} = AgeCheck();