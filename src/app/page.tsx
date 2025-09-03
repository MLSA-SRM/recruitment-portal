'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import { ArrowRight, Rocket } from 'lucide-react'
import { HeroLogo } from '@/components/ui/logo'

export default function HomePage() {

  return (
    <div className="min-h-screen animated-bg">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 navbar-glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center"
            >
              <Link href="/" className="text-brand-primary font-semibold text-base hover:text-primary transition-colors">
                Microsoft Student Ambassadors SRM
              </Link>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3"
            >
              <Button asChild size="sm" variant="ghost" className="hover:bg-primary/10 hover:text-primary">
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button asChild size="sm" className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white">
                <Link href="/auth/signup">Get Started</Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            {/* Hero Logo */}
            <HeroLogo />
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <Badge className="mb-8 bg-primary/10 text-primary border-primary/20 px-4 py-2 rounded-full font-medium">
                <Rocket className="w-4 h-4 mr-2 inline" />
                Task Submission Portal - MSA SRM
              </Badge>
              
              <motion.h1 
                className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.2 }}
              >
                <motion.span 
                  className="text-brand-primary"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  Microsoft
                </motion.span>{' '}
                <motion.span 
                  className="text-brand-secondary"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                >
                  Student
                </motion.span>{' '}
                <motion.span 
                  className="text-brand-accent"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                >
                  Ambassador
                </motion.span>
                <br />
                <motion.span 
                  className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 1.0 }}
                >
                  SRM
                </motion.span>
              </motion.h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                Submit your tasks and showcase your skills to Microsoft Student Ambassadors SRM. 
                Complete challenges across Technical, Corporate, and Creative domains.
              </p>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-6 justify-center items-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.2 }}
              >
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button asChild size="lg" className="btn-primary text-lg px-8 py-4 font-semibold touch-target elevation-2">
                    <Link href="/auth/signup">
                      Submit Tasks
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                  </Button>
                </motion.div>
                

              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">

            <span className="text-lg font-semibold text-brand-primary">Microsoft Student Ambassadors SRM</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 Microsoft Student Ambassadors SRM. Visit <a href="https://mlsasrm.in" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">mlsasrm.in</a>
          </p>
        </div>
      </footer>
    </div>
  )
}