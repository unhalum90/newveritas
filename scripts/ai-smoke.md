Quick AI smoke tests

- Run: `bash veritas/scripts/ai-smoke.sh`
- Requires env vars: `OPENAI_API_KEY`, `GOOGLE_API_KEY` (optional for builder, used for scoring/experiments)

Notes

- Gemini preview/Vertex-only models may require OAuth instead of API keys. If you see `CREDENTIALS_MISSING` or `ACCESS_TOKEN_SCOPE_INSUFFICIENT`, prefer an API-key compatible model like `gemini-2.5-flash` / `gemini-2.5-pro` from `GET /v1beta/models`, or use Vertex AI with service account / OAuth.
- OpenAI Images currently works with `model: "gpt-image-1"`; other strings (e.g. `"gpt-image-1.5"`) may not be accepted by the API.

