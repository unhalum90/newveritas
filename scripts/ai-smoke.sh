#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "== OpenAI text =="
OPENAI_TEXT_MODEL="${OPENAI_TEXT_MODEL:-gpt-5-mini-2025-08-07}"
curl -sS https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer ${OPENAI_API_KEY:?set OPENAI_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"model\":\"${OPENAI_TEXT_MODEL}\",\"response_format\":{\"type\":\"json_object\"},\"messages\":[{\"role\":\"user\",\"content\":\"Return ONLY JSON: {\\\"ok\\\":true}\"}]}" \
  | head -n 40

echo
echo "== OpenAI image =="
OPENAI_IMAGE_MODEL="${OPENAI_IMAGE_MODEL:-gpt-image-1}"
curl -sS https://api.openai.com/v1/images/generations \
  -H "Authorization: Bearer ${OPENAI_API_KEY:?set OPENAI_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"model\":\"${OPENAI_IMAGE_MODEL}\",\"prompt\":\"a simple red apple on a white table, studio lighting\",\"n\":1,\"size\":\"1024x1024\"}" \
  | head -n 40

echo
echo "== Gemini (API key) models list =="
curl -sS "https://generativelanguage.googleapis.com/v1beta/models?key=${GOOGLE_API_KEY:?set GOOGLE_API_KEY}" \
  | head -n 40

echo
echo "== Gemini (API key) generateContent =="
GEMINI_TEXT_MODEL="${GEMINI_TEXT_MODEL:-gemini-2.5-flash}"
curl -sS "https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TEXT_MODEL}:generateContent?key=${GOOGLE_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"role":"user","parts":[{"text":"Reply with exactly: OK"}]}]}' \
  | head -n 80
