import { NextRequest } from 'next/server'

import { ok, err, serverErr } from '@/lib/apiHelpers'
import { anthropic } from '@/lib/anthropic'
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

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      tools: [
        {
          name: 'generate_theme',
          description: 'Generate a complete UI color theme from a description',
          input_schema: {
            type: 'object',
            properties: {
              primaryColor: { type: 'string', description: 'Main accent color as hex e.g. #06b6d4' },
              secondaryColor: { type: 'string', description: 'Secondary accent as hex' },
              accentColor: { type: 'string', description: 'Small highlights as hex' },
              bgColor: { type: 'string', description: 'Page background hex - must be very dark for dark theme' },
              surfaceColor: { type: 'string', description: 'Card/surface background hex - slightly lighter than bg' },
              fontStyle: { type: 'string', enum: ['monospace', 'serif', 'modern', 'futuristic', 'traditional'] },
              moodText: { type: 'string', description: 'Short 3-5 word tagline matching the vibe e.g. Hack the future' },
              particleStyle: { type: 'string', enum: ['dots', 'stars', 'sparks', 'petals', 'bubbles'] },
            },
            required: [
              'primaryColor',
              'secondaryColor',
              'accentColor',
              'bgColor',
              'surfaceColor',
              'fontStyle',
              'moodText',
              'particleStyle',
            ],
          },
        },
      ],
      tool_choice: { type: 'tool', name: 'generate_theme' },
      messages: [
        {
          role: 'user',
          content: `Generate a dark-theme UI color palette for a college fest with this description: "${description}".\nThe background must be very dark (near black). The primary color should be vivid and match the vibe. Make it look impressive and modern.`,
        },
      ],
    })

    const toolResult = response.content.find((block) => block.type === 'tool_use')
    if (!toolResult || toolResult.type !== 'tool_use' || !isThemeResult(toolResult.input)) {
      return err('Theme generation failed', 500)
    }

    const theme = toolResult.input

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

