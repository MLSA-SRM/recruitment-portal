# Recruitment Portal Database Migrations

This directory contains properly structured Supabase migrations for the recruitment portal application.

## Migration Files

### 20241201000001_initial_schema.sql
- Creates all core tables: `profiles`, `tasks`, `submissions`, `submission_fields`
- Adds all necessary indexes for performance
- Enables Row Level Security (RLS) on all tables
- Sets up proper foreign key relationships

### 20241201000002_auth_functions_and_rls.sql
- Creates secure admin check functions (`is_admin_simple`, `is_admin`)
- Sets up non-recursive RLS policies for all tables
- Uses `SECURITY DEFINER` to prevent RLS recursion issues
- Ensures proper access control for admins and regular users

### 20241201000003_triggers_and_functions.sql
- Creates safe `updated_at` trigger functions
- Prevents infinite recursion in database triggers
- Automatically maintains `updated_at` timestamps
- Uses `BEFORE UPDATE` triggers for efficiency

### 20241201000004_storage_setup.sql
- Creates `task-images` storage bucket
- Sets up storage policies for task image uploads
- Configures proper MIME type restrictions and file size limits
- Allows public viewing but restricts uploads to admins

## How to Use These Migrations

### For a New Supabase Project

1. **Create a new Supabase project**
2. **Run migrations in order** using the Supabase Dashboard SQL Editor:
   ```sql
   -- Copy and paste each migration file content in order:
   -- 1. 20241201000001_initial_schema.sql
   -- 2. 20241201000002_auth_functions_and_rls.sql
   -- 3. 20241201000003_triggers_and_functions.sql
   -- 4. 20241201000004_storage_setup.sql
   ```

### Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Initialize Supabase in your project
supabase init

# Link to your remote project
supabase link --project-ref your-project-ref

# Apply all migrations
supabase db push
```

## Features Included

### Core Tables
- **profiles**: User profiles with admin flags and domain/subdomain assignments
- **tasks**: Recruitment tasks with deadlines, requirements, and custom fields
- **submissions**: User submissions with AI scoring and review capabilities
- **submission_fields**: Dynamic form fields for custom submission requirements

### Security Features
- **Row Level Security (RLS)**: Properly configured for all tables
- **Non-recursive admin checks**: Prevents stack depth issues
- **Secure functions**: Uses `SECURITY DEFINER` for admin operations
- **Proper access control**: Users can only see their own data, admins see everything

### Performance Optimizations
- **Comprehensive indexing**: Optimized for common query patterns
- **GIN indexes**: For JSONB fields and array operations
- **Composite indexes**: For multi-column queries
- **Conditional indexes**: For filtered queries (e.g., pending submissions)

### AI Review System
- **AI scoring**: Stores AI-generated scores (0-1000)
- **AI recommendations**: Structured recommendations (shortlist/reject/neutral)
- **Submission data**: JSONB storage for flexible form data
- **Review tracking**: Timestamps and status tracking

## Environment Variables Required

Make sure your application has these environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Important Notes

1. **Migration Order**: Always run migrations in numerical order
2. **RLS Policies**: The policies prevent recursion issues that were present in earlier versions
3. **Admin Setup**: After running migrations, manually set `is_admin = true` for admin users
4. **Storage**: Task images are stored in the `task-images` bucket with public read access
5. **Indexes**: All necessary indexes are included for optimal performance

## Troubleshooting

### Stack Depth Issues
If you encounter "stack depth limit exceeded" errors, ensure you're using the migrations in this directory, which include the fixed non-recursive RLS policies.

### Permission Issues
Make sure your Supabase service role key has the necessary permissions to create tables, functions, and policies.

### Storage Issues
Verify that the storage extension is enabled in your Supabase project before running the storage setup migration.
