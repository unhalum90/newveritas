import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const DEFAULT_SET_KEY = "ccss-ela-literacy";
const DEFAULT_SET_TITLE = "Common Core State Standards - ELA/Literacy";
const DEFAULT_SET_SUBJECT = "ELA";
const DEFAULT_SET_JURISDICTION = "US";
const DEFAULT_SET_ORGANIZATION = "CCSSO/NGA";
const DEFAULT_SET_VERSION = "2010";

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

function chunkArray(list, size) {
  const chunks = [];
  for (let i = 0; i < list.length; i += size) {
    chunks.push(list.slice(i, i + size));
  }
  return chunks;
}

function buildNode(entry) {
  const code = typeof entry.id === "string" ? entry.id.trim() : "";
  if (!code) return null;
  const description = typeof entry.description === "string" ? entry.description.trim() : "";
  const isSubstandard = /\.[a-z]$/.test(code);
  return {
    code,
    title: code,
    description: description || null,
    node_type: isSubstandard ? "substandard" : "standard",
    parent_code: isSubstandard ? code.replace(/\.[a-z]$/, "") : null,
  };
}

async function main() {
  loadEnvFile(path.join(repoRoot, ".env.local"));
  loadEnvFile(path.join(repoRoot, ".env"));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.");
  }

  const filePath = getArgValue("--file") || path.join(repoRoot, "ccss.json");
  const setKey = getArgValue("--set-key") || DEFAULT_SET_KEY;
  const setTitle = getArgValue("--set-title") || DEFAULT_SET_TITLE;
  const setSubject = getArgValue("--set-subject") || DEFAULT_SET_SUBJECT;
  const setJurisdiction = getArgValue("--set-jurisdiction") || DEFAULT_SET_JURISDICTION;
  const setOrganization = getArgValue("--set-organization") || DEFAULT_SET_ORGANIZATION;
  const setVersion = getArgValue("--set-version") || DEFAULT_SET_VERSION;

  if (!fs.existsSync(filePath)) {
    throw new Error(`CCSS file not found: ${filePath}`);
  }

  const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!Array.isArray(raw)) {
    throw new Error("Expected ccss.json to be an array of standards.");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: setRow, error: setError } = await supabase
    .from("standards_sets")
    .upsert(
      {
        key: setKey,
        title: setTitle,
        subject: setSubject,
        jurisdiction: setJurisdiction,
        organization: setOrganization,
        version: setVersion,
        description: null,
        active: true,
      },
      { onConflict: "key" },
    )
    .select("id")
    .single();

  if (setError || !setRow) {
    throw new Error(setError?.message ?? "Unable to upsert standards set.");
  }

  const nodes = raw.map(buildNode).filter(Boolean);
  if (!nodes.length) {
    throw new Error("No valid standards nodes found.");
  }

  const rows = nodes.map((node) => ({
    set_id: setRow.id,
    code: node.code,
    title: node.title,
    description: node.description,
    node_type: node.node_type,
    parent_code: node.parent_code,
    metadata: null,
  }));

  const chunks = chunkArray(rows, 500);
  for (let i = 0; i < chunks.length; i += 1) {
    const chunk = chunks[i];
    const { error } = await supabase
      .from("standards_nodes")
      .upsert(chunk, { onConflict: "set_id,code" });
    if (error) {
      throw new Error(error.message);
    }
    console.log(`Imported ${Math.min((i + 1) * 500, rows.length)} / ${rows.length} standards`);
  }
}

main().catch((error) => {
  console.error("Import failed:", error.message);
  process.exit(1);
});
