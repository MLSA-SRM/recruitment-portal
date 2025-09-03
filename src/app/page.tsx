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
    // User is authenticated, check if they have a profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (profile) {
      // User has a profile, redirect to dashboard
      redirect('/dashboard')
    } else {
      // User authenticated but no profile, redirect to profile setup
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
                Join our elite team of tech enthusiasts and innovators. Submit your projects and get instant AI feedback 
                to help us discover the next generation of Microsoft ambassadors.
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
              <h3 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">Submit Your Work</h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                Share your GitHub projects, technical portfolios, or innovative solutions. 
                Show us your passion for technology and Microsoft ecosystem.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border-l-4 border-purple-500">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">AI-Powered Evaluation</h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                Our advanced AI system analyzes your submissions, providing 
                comprehensive feedback and scores to help identify top talent.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border-l-4 border-green-500">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">Join the Team</h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                Become part of the Microsoft Student Ambassadors community at SRM. 
                Connect, learn, and grow with fellow tech enthusiasts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
