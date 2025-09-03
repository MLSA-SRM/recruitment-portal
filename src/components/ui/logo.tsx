'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

interface LogoProps {
  size?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  href?: string
  className?: string
  animate?: boolean
}

const sizeClasses = {
  xxs: 'w-5 h-5',
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
}

const textSizeClasses = {
  xxs: 'text-xs',
  xs: 'text-sm',
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-3xl',
}

export function Logo({ 
  size = 'md', 
  showText = false, 
  href = '/', 
  className = '', 
  animate = true 
}: LogoProps) {
  const logoElement = (
    <div className={`flex items-center space-x-3 ${className}`}>
      <motion.div
        className={`${sizeClasses[size]} relative`}
        initial={animate ? { scale: 0, rotate: -180 } : false}
        animate={animate ? { scale: 1, rotate: 0 } : false}
        transition={{ 
          type: "spring", 
          stiffness: 260, 
          damping: 20,
          duration: 0.6 
        }}
        whileHover={animate ? { 
          scale: 1.05, 
          rotate: 5,
          transition: { duration: 0.2 }
        } : {}}
      >
        <Image
          src="/logo.svg"
          alt="Microsoft Student Ambassador SRM"
          fill
          className="object-contain"
          priority
        />
      </motion.div>
      
      {showText && (
        <motion.div
          className="flex flex-col"
          initial={animate ? { opacity: 0, x: -20 } : false}
          animate={animate ? { opacity: 1, x: 0 } : false}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <motion.span 
            className={`${textSizeClasses[size]} font-bold neon-text-cyan leading-tight`}
            whileHover={animate ? { 
              textShadow: "0 0 8px #00FFFF, 0 0 16px #00FFFF",
              transition: { duration: 0.2 }
            } : {}}
          >
            MSA SRM
          </motion.span>
          <span className="text-xs text-muted-foreground font-medium">
            Microsoft Student Ambassador
          </span>
        </motion.div>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="inline-block">
        {logoElement}
      </Link>
    )
  }

  return logoElement
}

// Simplified logo for favicons and small spaces
export function LogoIcon({ size = 'md', className = '' }: Pick<LogoProps, 'size' | 'className'>) {
  return (
    <div className={`${sizeClasses[size]} relative ${className}`}>
      <Image
        src="/logo.svg"
        alt="MSA SRM"
        fill
        className="object-contain"
        priority
      />
    </div>
  )
}

// Animated logo for hero sections
export function HeroLogo() {
  return (
    <motion.div
      className="flex items-center justify-center mb-8"
      initial={{ opacity: 0, scale: 0.5, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ 
        type: "spring",
        stiffness: 100,
        damping: 15,
        duration: 0.8
      }}
    >
      <motion.div
        className="relative w-32 h-32 md:w-40 md:h-40"
        whileHover={{ 
          scale: 1.1,
          rotate: 10,
          transition: { type: "spring", stiffness: 400, damping: 10 }
        }}
        animate={{
          rotate: [0, 5, -5, 0],
          scale: [1, 1.02, 1],
        }}
        transition={{
          rotate: {
            duration: 6,
            ease: "easeInOut",
            repeat: Infinity,
          },
          scale: {
            duration: 4,
            ease: "easeInOut",
            repeat: Infinity,
          }
        }}
      >
        <Image
          src="/logo.svg"
          alt="Microsoft Student Ambassador SRM"
          fill
          className="object-contain drop-shadow-2xl"
          priority
        />
        
        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(0,255,255,0.1) 0%, transparent 70%)",
            filter: "blur(20px)",
          }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 3,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        />
      </motion.div>
    </motion.div>
  )
}
