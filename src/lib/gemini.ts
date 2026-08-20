import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai'

const globalForGemini = globalThis as unknown as { gemini: GoogleGenerativeAI | undefined }

export const gemini =
  globalForGemini.gemini ??
  new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

if (process.env.NODE_ENV !== 'production') globalForGemini.gemini = gemini

// Helper to get a model instance — use flash for speed/free tier friendliness.
// Uses the "-latest" aliases (not a dated version) since Google retires dated
// Gemini model versions on a rolling basis and pinning one 404s once retired.
export function getModel(modelName: 'gemini-flash-latest' | 'gemini-flash-lite-latest' = 'gemini-flash-lite-latest') {
  return gemini.getGenerativeModel({ model: modelName })
}

// The free-tier flash models intermittently return 503 "high demand" —
// Google's own error message calls it usually temporary, so retry a couple
// times with backoff before surfacing a failure.
export async function generateWithRetry(
  model: GenerativeModel,
  request: Parameters<GenerativeModel['generateContent']>[0],
  retries = 2,
) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await model.generateContent(request)
    } catch (e) {
      const is503 = e instanceof Error && /503|UNAVAILABLE|high demand/i.test(e.message)
      if (!is503 || attempt >= retries) throw e
      await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt))
    }
  }
}
