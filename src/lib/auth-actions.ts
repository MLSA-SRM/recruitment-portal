'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error, data: authData } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/auth/error?message=' + encodeURIComponent(error.message))
  }

  // Check if user is admin and redirect accordingly
  const adminEmails = ['hello@mlsasrm.in']
  const isAdmin = authData.user?.email && adminEmails.includes(authData.user.email)

  revalidatePath('/', 'layout')
  redirect(isAdmin ? '/admin' : '/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Check if email is from SRM domain or is an admin email
  const adminEmails = ['hello@mlsasrm.in']
  const isAdminEmail = adminEmails.includes(email)
  const isSrmEmail = email.endsWith('@srmist.edu.in')
  
  if (!isSrmEmail && !isAdminEmail) {
    redirect('/auth/error?message=' + encodeURIComponent('Please use your SRM email address (@srmist.edu.in) or authorized admin email'))
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    redirect('/auth/error?message=' + encodeURIComponent(error.message))
  }

  redirect('/auth/verify-email')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function createProfile(formData: FormData) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const profileData = {
    id: user.id,
    email: user.email!,
    full_name: formData.get('full_name') as string,
    registration_number: formData.get('registration_number') as string,
    department: formData.get('department') as string,
    phone: formData.get('phone') as string,
    domains: JSON.parse(formData.get('domains') as string),
    sub_domains: JSON.parse(formData.get('sub_domains') as string),
  }

  const { error } = await supabase
    .from('profiles')
    .upsert(profileData, { 
      onConflict: 'id',
      ignoreDuplicates: false 
    })

  if (error) {
    redirect('/auth/error?message=' + encodeURIComponent(error.message))
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
