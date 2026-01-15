/**
 * Seed StudyLab Demo Submissions
 * 
 * Creates batch submissions for a StudyLab activity about French Driving Test (Code de la Route)
 * with varied AI feedback for demonstrating class analytics at scale.
 * 
 * Usage: DEMO_SEED=1 node scripts/seed-studylab-demo.mjs --yes --activity-id <UUID>
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

// Focus areas based on the driving test notes
const focusAreaPool = [
    "Needs to solidify understanding of 'priority at the right' rules",
    "Should focus on recognizing specific signs that indicate the presence or absence of 'priority at the right'",
    "Could improve recognition of sign shapes and their meanings (round=prohibition, triangle=danger)",
    "Struggles with understanding when solid white lines allow passing",
    "Needs more practice with road line types and passing rules",
    "Should review the meaning of yellow temporary signs vs permanent signs",
    "Could benefit from reviewing blue obligation signs",
    "Needs to understand pedestrian crossing rules better",
    "Should review the 50-150 meter warning distance for signs",
    "Struggles with understanding intersection priority on dirt roads",
    "Needs to distinguish between dashed and solid line rules",
    "Could improve understanding of sign placement and anticipation",
];

const strengthPool = [
    "Understands that signs indicate priority on the road",
    "Recognizes that signs provide early warnings for dangers, speed changes, and environmental shifts",
    "Identifies the critical role of signs and lines in ensuring driver safety",
    "Correctly explains the concept of priority at intersections",
    "Shows good understanding of sign color meanings",
    "Demonstrates knowledge of basic road line types",
    "Can articulate the purpose of road signs clearly",
    "Uses specific examples from the notes to support explanations",
    "Shows logical reasoning about traffic rules",
    "Connects sign shapes to their function (triangle = warning)",
];

const summaryTemplates = [
    "The student demonstrates a strong understanding of road signs and lines, recognizing their importance in conveying priority and providing early warnings for safety. However, they identified '{focusArea}' as their biggest area of confusion.",
    "Good grasp of basic traffic sign concepts. The student explained the purpose of signs clearly but needs more practice with {focusArea}.",
    "Solid foundational knowledge of the Code de la Route. The conversation revealed some gaps in understanding {focusArea}.",
    "The student shows developing understanding of road rules. While they grasped the basics of priority and sign meanings, {focusArea} remains a challenge.",
    "Excellent recall of sign shapes and their meanings. The student articulated concepts well but would benefit from reviewing {focusArea}.",
];

// Conversation templates for the chat transcript
function generateConversation(studentLevel) {
    const conversations = {
        high: [
            { role: "ai", content: "I see you've taken some great notes on different road signs, their shapes, colors, and meanings, as well as road line colors and what they indicate. What do you think is the most important purpose of all these signs and lines on the road?" },
            { role: "user", content: "The importance of the signs is to make sure that you understand whether you have priority or not have priority in the particular situation." },
            { role: "ai", content: "I see in your notes you've highlighted the crucial aspect of priority, which is indeed a key function of road signs. Beyond just priority, what other critical information do signs and lines convey that ensures everyone's safety on the road?" },
            { role: "user", content: "Signs allow you to see from a very far distance away either danger or changes in the speed or changes in the environment for the driving." },
            { role: "ai", content: "That's an excellent point! Signs and lines are indeed designed for early warning, allowing drivers to anticipate dangers, speed changes, or environmental shifts well in advance. What is the biggest or most difficult question you still have about this concept?" },
            { role: "user", content: "I'm still confused about when I have priority at the right versus when I need to yield." },
        ],
        mid: [
            { role: "ai", content: "Looking at your notes about road signs and road lines, what would you say is the main purpose of having different shapes for different signs?" },
            { role: "user", content: "The shapes help you know what kind of message the sign is giving, like triangles mean danger." },
            { role: "ai", content: "That's correct! Triangle shapes indicate danger or warning. Can you tell me about the other shapes you've noted and what they mean?" },
            { role: "user", content: "Round signs are for prohibitions or orders, and rectangles give information." },
            { role: "ai", content: "Good! You've got the basic shapes down. Now, what about the colors - what do yellow signs indicate versus blue signs?" },
            { role: "user", content: "I think yellow means temporary, but I'm not sure about blue." },
        ],
        low: [
            { role: "ai", content: "Let's start with what you've written in your notes. Can you explain what 'priority at the right' means?" },
            { role: "user", content: "It means you have to let cars from the right go first at intersections." },
            { role: "ai", content: "That's the basic idea! But are there situations where this rule doesn't apply?" },
            { role: "user", content: "I'm not sure, maybe when there's a sign?" },
            { role: "ai", content: "Yes, signs can change the priority rules. What about road lines - can you tell me the difference between solid and dashed lines?" },
            { role: "user", content: "Solid lines mean you can't cross them, I think." },
        ],
    };
    return conversations[studentLevel];
}

function pickRandom(array, count = 1) {
    const shuffled = [...array].sort(() => Math.random() - 0.5);
    return count === 1 ? shuffled[0] : shuffled.slice(0, count);
}

function loadEnvFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, "utf8");
    content.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) return;
        const [rawKey, ...rest] = trimmed.split("=");
        const key = rawKey.trim();
        if (process.env[key]) return;
        const rawValue = rest.join("=").trim();
        const value = rawValue.replace(/^["']|["']$/g, "");
        process.env[key] = value;
    });
}

function getArgValue(flag) {
    const idx = process.argv.findIndex((arg) => arg === flag);
    if (idx === -1) return null;
    return process.argv[idx + 1] ?? null;
}

function hasFlag(flag) {
    return process.argv.includes(flag);
}

async function main() {
    if (process.env.NODE_ENV === "production") {
        throw new Error("Refusing to seed demo data when NODE_ENV=production.");
    }

    const allowSeed = hasFlag("--yes") || process.env.DEMO_SEED === "1";
    if (!allowSeed) {
        console.log("StudyLab demo seeding is disabled.");
        console.log("Run with: DEMO_SEED=1 node scripts/seed-studylab-demo.mjs --yes --activity-id <UUID>");
        process.exit(1);
    }

    loadEnvFile(path.join(repoRoot, ".env.local"));
    loadEnvFile(path.join(repoRoot, ".env"));

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.");
    }

    const activityId = getArgValue("--activity-id");
    if (!activityId) {
        throw new Error("Missing --activity-id argument. Provide the StudyLab activity UUID.");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });

    // Fetch the activity
    const { data: activity, error: activityError } = await supabase
        .from("formative_activities")
        .select("id, title, teacher_id")
        .eq("id", activityId)
        .single();

    if (activityError || !activity) {
        throw new Error(`Activity not found: ${activityError?.message || activityId}`);
    }

    console.log(`Found activity: ${activity.title} (${activity.id})`);

    // Find all assignments for this activity
    const { data: assignments } = await supabase
        .from("formative_assignments")
        .select("class_id")
        .eq("activity_id", activityId);

    if (!assignments || assignments.length === 0) {
        throw new Error("No class assignments found for this activity. Assign it to a class first.");
    }

    const classIds = assignments.map((a) => a.class_id);
    console.log(`Activity is assigned to ${classIds.length} class(es)`);

    // Fetch students from assigned classes
    const { data: students, error: studentsError } = await supabase
        .from("students")
        .select("id, first_name, last_name, class_id")
        .in("class_id", classIds);

    if (studentsError || !students?.length) {
        throw new Error(`No students found in assigned classes: ${studentsError?.message}`);
    }

    console.log(`Found ${students.length} students to create submissions for`);

    // Check for existing submissions to avoid duplicates
    const { data: existingSubmissions } = await supabase
        .from("formative_submissions")
        .select("student_id")
        .eq("activity_id", activityId);

    const existingStudentIds = new Set((existingSubmissions || []).map((s) => s.student_id));
    const newStudents = students.filter((s) => !existingStudentIds.has(s.id));

    if (newStudents.length === 0) {
        console.log("All students already have submissions. Use --force to replace.");
        if (!hasFlag("--force")) {
            process.exit(0);
        }
        // Delete existing submissions if --force
        await supabase.from("formative_submissions").delete().eq("activity_id", activityId);
        console.log("Deleted existing submissions. Recreating...");
    }

    const studentsToSeed = hasFlag("--force") ? students : newStudents;
    console.log(`Creating ${studentsToSeed.length} submissions...`);

    // Generate varied submissions
    const now = Date.now();
    const submissions = [];

    studentsToSeed.forEach((student, index) => {
        // Distribute scores: ~30% high (4), ~50% mid (3), ~20% low (1-2)
        let level, score;
        if (index < studentsToSeed.length * 0.3) {
            level = "high";
            score = 4;
        } else if (index < studentsToSeed.length * 0.8) {
            level = "mid";
            score = 3;
        } else {
            level = "low";
            score = Math.random() > 0.5 ? 2 : 1;
        }

        const selfRating = Math.floor(Math.random() * 3) + 2 + (level === "high" ? 1 : 0); // 2-5
        const strengths = pickRandom(strengthPool, 2 + Math.floor(Math.random() * 2));
        const focusAreas = pickRandom(focusAreaPool, 1 + Math.floor(Math.random() * 2));
        const summaryTemplate = pickRandom(summaryTemplates);
        const summary = summaryTemplate.replace("{focusArea}", focusAreas[0].toLowerCase());
        const history = generateConversation(level);

        const submittedAt = new Date(now - index * 3600_000 - Math.random() * 7200_000).toISOString(); // Spread over hours

        submissions.push({
            activity_id: activityId,
            student_id: student.id,
            status: "submitted",
            submitted_at: submittedAt,
            submission_data: {
                history,
                selfRating,
                grading: {
                    score,
                    summary,
                    feedback: {
                        strengths,
                        improvements: focusAreas,
                    },
                },
            },
        });
    });

    // Insert all submissions
    const { data: createdSubmissions, error: insertError } = await supabase
        .from("formative_submissions")
        .upsert(submissions, { onConflict: "activity_id,student_id" })
        .select("id, student_id");

    if (insertError) {
        throw new Error(`Failed to create submissions: ${insertError.message}`);
    }

    console.log(`\n✅ Successfully created ${createdSubmissions.length} StudyLab submissions!`);
    console.log(`\nClass Analytics will now show:`);
    console.log(`  - ${createdSubmissions.length} submissions scored`);
    console.log(`  - Varied confidence scores (self-ratings)`);
    console.log(`  - Aggregated focus areas from AI feedback`);
    console.log(`\nView at: /activities/studylab/${activityId}/analytics`);
}

main().catch((error) => {
    console.error("Seed failed:", error.message ?? error);
    process.exit(1);
});
