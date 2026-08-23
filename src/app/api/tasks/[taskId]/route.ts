import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase'
import { z } from 'zod'

const paramsSchema = z.object({ taskId: z.coerce.number().int().positive() })

const updateTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().default(''),
  domain: z.string().min(1),
  subdomain: z.string().min(1),
  deadline: z.string().min(1).transform((val) => {
    // Always ensure time is set to 23:59 (end of day) for consistency
    if (val && !val.includes('T')) {
      // Date-only input: set to end of day
      return `${val}T23:59:59.999Z`
    } else if (val && val.includes('T') && !val.includes('Z')) {
      // DateTime input without timezone: add UTC timezone
      return `${val}Z`
    }
    return val
  }),
  estimated_duration: z.string().optional().default(''),
  requirements: z.string().optional().default(''),
  deliverables: z.string().optional().default(''),
  image_url: z.union([z.string(), z.null()]).optional().transform(v => v || null),
  submissionFields: z.array(z.object({
    field_name: z.string(),
    field_type: z.string(),
    field_label: z.string(),
    field_description: z.string().optional(),
    is_required: z.boolean().default(false),
    field_options: z.record(z.string(), z.unknown()).optional(),
    validation_rules: z.record(z.string(), z.unknown()).optional(),
    display_order: z.number().default(0)
  })).optional().default([])
})

export async function GET(_: Request, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const { taskId: idParam } = await params
    const parsed = paramsSchema.safeParse({ taskId: idParam })
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 })
    }

    const supabase = await createSupabaseServer()
    const { data: task, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', parsed.data.taskId)
      .single()

    if (error) {
      console.error('Error fetching task:', error)
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error in task API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const { taskId: idParam } = await params
    const parsed = paramsSchema.safeParse({ taskId: idParam })
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 })
    }

    const body = await request.json()
    console.log('Received request body:', JSON.stringify(body, null, 2))
    
    const validatedData = updateTaskSchema.safeParse(body)
    if (!validatedData.success) {
      console.error('Validation failed:', validatedData.error.issues)
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: validatedData.error.issues 
      }, { status: 400 })
    }

    const supabase = await createSupabaseServer()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    
    if (profileError || !profile?.is_admin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
    }

    const { taskId } = parsed.data
    const { submissionFields, ...taskData } = validatedData.data

    // Update the task (let database triggers handle updated_at automatically)
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update(taskData)
      .eq('id', taskId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating task:', updateError)
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
    }

    // Update submission fields if provided (even if empty, to allow clearing)
    if (Array.isArray(submissionFields)) {
      // Delete all existing submission fields for this task
      const { error: deleteError } = await supabase
        .from('submission_fields')
        .delete()
        .eq('task_id', taskId)

      if (deleteError) {
        console.error('Error deleting existing submission fields:', deleteError)
        // Don't fail the entire operation
      }

      if (submissionFields.length > 0) {
        // Insert new submission fields
        const fieldsToInsert = submissionFields.map(field => ({
          task_id: taskId,
          field_name: field.field_name,
          field_type: field.field_type,
          field_label: field.field_label,
          field_description: field.field_description,
          is_required: field.is_required,
          field_options: field.field_options || null,
          validation_rules: field.validation_rules || null,
          display_order: field.display_order
        }))

        const { error: fieldsError } = await supabase
          .from('submission_fields')
          .insert(fieldsToInsert)

        if (fieldsError) {
          console.error('Error updating submission fields:', fieldsError)
          // Don't fail the entire operation
        }
      }
    }

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error('Error in task update API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}