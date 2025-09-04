import { NextResponse } from 'next/server'
import { triggerAIReviewForSubmission } from '@/app/actions'
import { z } from 'zod'

const paramsSchema = z.object({ id: z.coerce.number().int().positive() })

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params
    const parsed = paramsSchema.safeParse({ id: idParam })
    if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid submission id' }, { status: 400 })
    const res = await triggerAIReviewForSubmission(parsed.data.id)
    return NextResponse.json(res)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
