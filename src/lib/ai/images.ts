function requireEnv(name: string) {
  const v = process.env[name];
  if (v) return v;
  // Common aliases (people often paste keys under different env names).
  if (name === "GOOGLE_API_KEY") {
    const alt = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_KEY;
    if (alt) return alt;
  }
  throw new Error(`Missing ${name}.`);
}

function getOpenAiImageModel() {
  const configured = process.env.OPENAI_IMAGE_MODEL?.trim();
  if (!configured) return "gpt-image-1";
  // Be forgiving about non-existent version suffixes (e.g. "gpt-image-1.5").
  if (configured.startsWith("gpt-image-1.")) return "gpt-image-1";
  return configured;
}

async function openaiGenerateImageBytes(prompt: string, count: number) {
  const apiKey = requireEnv("OPENAI_API_KEY");
  const configuredModel = getOpenAiImageModel();

  const doRequest = async (body: Record<string, unknown>) => {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = (await res.json().catch(() => null)) as
      | {
          error?: { message?: unknown };
          data?: Array<{ b64_json?: unknown; url?: unknown }>;
        }
      | null;

    if (!res.ok) {
      const msg = typeof data?.error?.message === "string" ? data.error.message : "OpenAI image request failed.";
      throw new Error(msg);
    }

    return data;
  };

  // Some orgs/projects reject `response_format`. Requesting URLs is the most compatible,
  // and we can fetch bytes from the URLs if needed.
  const data = await doRequest({
    model: configuredModel,
    prompt,
    n: count,
    size: "1024x1024",
  });

  const outputs = data?.data ?? [];
  const buffers: Buffer[] = [];
  for (const item of outputs) {
    const b64 = item?.b64_json;
    if (typeof b64 === "string" && b64) {
      buffers.push(Buffer.from(b64, "base64"));
      continue;
    }
    // Fallback: if the API returns URLs, fetch them.
    const url = item?.url;
    if (typeof url === "string" && url) {
      const imgRes = await fetch(url);
      if (!imgRes.ok) continue;
      buffers.push(Buffer.from(await imgRes.arrayBuffer()));
    }
  }

  if (!buffers.length) throw new Error("OpenAI image response missing bytes.");
  return buffers;
}

async function geminiGenerateImageBytes(prompt: string, count: number) {
  const apiKey = requireEnv("GOOGLE_API_KEY");
  const model = process.env.GEMINI_IMAGE_MODEL || "imagen-3.0-generate-002";

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateImages?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      prompt: { text: prompt },
      imageParameters: { sampleCount: count, aspectRatio: "1:1" },
    }),
  });

  const data = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) {
    const msg =
      typeof (data as { error?: { message?: unknown } } | null)?.error?.message === "string"
        ? ((data as { error?: { message?: string } }).error?.message as string)
        : "Gemini image request failed.";
    throw new Error(msg);
  }

  const images = (data as { generatedImages?: Array<{ bytesBase64Encoded?: unknown }> } | null)?.generatedImages ?? [];
  const buffers: Buffer[] = [];
  for (const img of images) {
    const b64 = img?.bytesBase64Encoded;
    if (typeof b64 === "string" && b64) buffers.push(Buffer.from(b64, "base64"));
  }
  if (!buffers.length) throw new Error("Gemini image response missing bytes.");
  return buffers;
}

export async function generateImageBytes(prompt: string, count: number) {
  // Prefer OpenAI if configured (fast path to "works now").
  if (process.env.OPENAI_API_KEY) return openaiGenerateImageBytes(prompt, count);
  return geminiGenerateImageBytes(prompt, count);
}
