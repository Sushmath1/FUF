import { NextRequest } from 'next/server'

import { ok, err, serverErr } from '@/lib/apiHelpers'
import { getModel, generateWithRetry } from '@/lib/gemini'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rateLimit'

type ThemeResult = {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  bgColor: string
  surfaceColor: string
  fontStyle: string
  moodText: string
  particleStyle: string
}

const isThemeResult = (value: unknown): value is ThemeResult => {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>

  return (
    typeof v.primaryColor === 'string' &&
    typeof v.secondaryColor === 'string' &&
    typeof v.accentColor === 'string' &&
    typeof v.bgColor === 'string' &&
    typeof v.surfaceColor === 'string' &&
    typeof v.fontStyle === 'string' &&
    typeof v.moodText === 'string' &&
    typeof v.particleStyle === 'string'
  )
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const authedCollege = session?.user?.role === 'college' ? session.user.id : null

    const limiterKey = authedCollege
      ? `theme-gen:${authedCollege}`
      : `theme-gen-public:${request.headers.get('x-forwarded-for') ?? 'unknown'}`

    if (!rateLimit(limiterKey, 10, 3600000).success) {
      return err('Too many theme generations. Try again later.', 429)
    }

    const body = (await request.json()) as { description?: unknown; collegeId?: unknown }
    const description = typeof body.description === 'string' ? body.description : ''
    const collegeId = typeof body.collegeId === 'string' ? body.collegeId : ''

    if (!description) return err('Description required', 400)
    if (description.length > 300) return err('Description too long', 400)
    if (authedCollege && collegeId && authedCollege !== collegeId) return err('Forbidden', 403)

    const model = getModel('gemini-flash-lite-latest')

    const result = await generateWithRetry(model, {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Generate a realistic, cohesive UI color palette for a college fest with this description: "${description}".

Guidelines for realistic colors:
- Colors should look like they belong together, like a professional brand palette, not random bright hex codes
- Primary and secondary colors should be complementary or analogous on the color wheel, not clashing
- The background must be a soft, light, slightly warm or cool neutral (think cream, soft white, pale blue-grey) — never pure white, never harsh
- The surface color should be a very subtle variation of the background (barely different, like a card sitting on a page)
- Accent color should be used sparingly — a small pop of contrast, not another dominant color
- Think of real design systems: Stripe, Airbnb, Notion — muted, tasteful, not saturated neon
- Avoid pure primary colors like #FF0000 or #00FF00 — use realistic tinted versions instead

Respond ONLY with valid JSON in exactly this shape, no markdown formatting, no code fences, no extra text:
{
  "primaryColor": "#hexcode",
  "secondaryColor": "#hexcode",
  "accentColor": "#hexcode",
  "bgColor": "#hexcode",
  "surfaceColor": "#hexcode",
  "fontStyle": "modern",
  "moodText": "3-5 word tagline",
  "particleStyle": "dots"
}
fontStyle must be one of: monospace, serif, modern, futuristic, traditional
particleStyle must be one of: dots, stars, sparks, petals, bubbles`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.5,
        responseMimeType: 'application/json',
      },
    })

    let theme: unknown
    try {
      theme = JSON.parse(result.response.text())
    } catch {
      return err('Theme generation failed — invalid response format', 500)
    }

    if (!isThemeResult(theme)) {
      return err('Theme generation failed', 500)
    }

    const hexRegex = /^#[0-9A-Fa-f]{6}$/
    const colorFields: Array<keyof ThemeResult> = [
      'primaryColor',
      'secondaryColor',
      'accentColor',
      'bgColor',
      'surfaceColor',
    ]

    for (const field of colorFields) {
      if (!hexRegex.test(theme[field])) return err('AI returned invalid color format', 500)
    }

    if (authedCollege && collegeId) {
      await prisma.college.update({
        where: { id: collegeId },
        data: {
          themeDescription: description,
          primaryColor: theme.primaryColor,
          secondaryColor: theme.secondaryColor,
          accentColor: theme.accentColor,
          bgColor: theme.bgColor,
          surfaceColor: theme.surfaceColor,
          fontStyle: theme.fontStyle,
          moodText: theme.moodText,
          particleStyle: theme.particleStyle,
        },
      })
    }

    return ok({ theme, description })
  } catch (e) {
    return serverErr(e)
  }
}

