import { exportShortlistedCSV } from '@/app/actions'

export async function GET() {
  const csv = await exportShortlistedCSV()
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="shortlisted.csv"'
    }
  })
}


