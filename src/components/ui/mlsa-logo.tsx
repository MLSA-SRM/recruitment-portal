'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

interface MLSALogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  animate?: boolean
  className?: string
}

const sizeClasses = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-20 h-20',
}

export function MLSALogo({ 
  size = 'md', 
  animate = true,
  className = '' 
}: MLSALogoProps) {
  const logoElement = (
    <div className={`${sizeClasses[size]} relative ${className}`}>
      <Image
        src="/logo.svg"
        alt="Microsoft Learn Student Ambassador"
        fill
        className="object-contain"
        priority
      />
    </div>
  )

  if (animate) {
    return (
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ 
          type: "spring", 
          stiffness: 260, 
          damping: 20,
          duration: 0.6 
        }}
        whileHover={{ 
          scale: 1.05, 
          rotate: 5,
          transition: { duration: 0.2 }
        }}
      >
        {logoElement}
      </motion.div>
    )
  }

  return logoElement
}
