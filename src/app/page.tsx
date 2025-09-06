import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { createSupabaseServer } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Microsoft Student Ambassadors SRM - Recruitment Portal',
  description: 'Join our elite team of tech enthusiasts and innovators at Microsoft Student Ambassadors SRM University. Submit your projects and get instant AI feedback.',
}

export default async function HomePage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    // User is authenticated, check if they have completed onboarding
    const { data: authCheck } = await supabase
      .from('auth_check')
      .select('is_onboarding_complete')
      .eq('user_id', user.id)
      .single()
    
    if (authCheck?.is_onboarding_complete) {
      // User has completed onboarding, redirect to dashboard
      redirect('/dashboard')
    } else {
      // User authenticated but hasn't completed onboarding, redirect to profile setup
      redirect('/profile/setup')
    }
  }
  
  // User is not authenticated, show the landing page
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-12">
          <div className="space-y-8">
            {/* Logo */}
            <div className="flex justify-center">
              <Image 
                src="/logo.svg" 
                alt="Microsoft Student Ambassadors SRM" 
                width={128}
                height={128}
                className="h-24 w-24 md:h-32 md:w-32"
                priority
              />
            </div>
            
            <div className="space-y-6">
              <h1 className="text-5xl font-black tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
                Microsoft Student Ambassadors
              </h1>
              <h2 className="text-3xl font-bold text-blue-600 sm:text-4xl lg:text-5xl">
                SRM
              </h2>
              <p className="text-xl leading-relaxed text-gray-600 max-w-3xl mx-auto font-light">
              Microsoft Student Ambassadors SRM is a technical club dedicated to igniting passion in young minds and serving the community. We host events, workshops, and build projects to help students realize their potential. Join us to learn, grow, and be part of a vibrant legacy.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-10 py-6 font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
                Get Started
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button size="lg" variant="outline" className="text-lg px-10 py-6 font-medium border-2 hover:bg-gray-50 transition-all duration-200">
                Sign In
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border-l-4 border-blue-500">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">Technical</h3>
              <p className="text-gray-600 leading-relaxed text-lg text-justify">
              This is the brain of our club. From coding and cloud to AI and app development, the Technical team builds the backbone of our projects and events. They turn ideas into real solutions and make innovation happen.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border-l-4 border-purple-500">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">Corporate</h3>
              <p className="text-gray-600 leading-relaxed text-lg text-justify">
              This is where strategy meets execution. The Corporate team manages partnerships, sponsorships, and outreach. They handle communications, collaborations, and ensure that every event runs like clockwork.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border-l-4 border-green-500">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">Creatives</h3>
              <p className="text-gray-600 leading-relaxed text-lg text-justify">
              The storytellers and designers of the club. The Creatives team takes care of branding, design, social media, and content. They make sure everything we do looks stunning and connects with people.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}