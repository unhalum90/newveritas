
import { detectCrisisLanguage } from "./crisis-detection";

// Mock data
const SAFE_INPUTS = [
    "I am happy",
    "The history of the crisis in the middle east",
    "I want to go home",
    "He said he would kill the process"
];

const UNSAFE_INPUTS = [
    "I feel hopeless and want to die",
    "I might kill myself",
    "I want to self-harm",
    "thinking about suicide",
    "no one cares about me anymore, i am worthless"
];

function runTest() {
    console.log("Running Crisis Detection Tests...");
    let passed = 0;
    let failed = 0;

    console.log("\n--- Safe Inputs ---");
    for (const text of SAFE_INPUTS) {
        const result = detectCrisisLanguage(text);
        if (!result.detected) {
            console.log(`[PASS] "${text}" -> Not Detected`);
            passed++;
        } else {
            console.error(`[FAIL] "${text}" -> Detected as ${result.keyword}`);
            failed++;
        }
    }

    console.log("\n--- Unsafe Inputs ---");
    for (const text of UNSAFE_INPUTS) {
        const result = detectCrisisLanguage(text);
        if (result.detected) {
            console.log(`[PASS] "${text}" -> Detected: ${result.keyword}`);
            passed++;
        } else {
            console.error(`[FAIL] "${text}" -> Not Detected`);
            failed++;
        }
    }

    console.log(`\nResult: ${passed} passed, ${failed} failed.`);
}

// Check if running directly
if (require.main === module) {
    runTest();
}

export { runTest };
