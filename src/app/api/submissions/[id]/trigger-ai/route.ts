import { NextResponse } from 'next/server'
import { triggerAIReviewForSubmission } from '@/app/actions'

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params
    const id = Number(idParam)
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ ok: false, error: 'Invalid submission id' }, { status: 400 })
    }
    const res = await triggerAIReviewForSubmission(id)
    return NextResponse.json(res)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
