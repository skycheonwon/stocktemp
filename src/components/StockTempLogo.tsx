import { Thermometer } from 'lucide-react'

interface StockTempLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

export default function StockTempLogo({ size = 'md', className = '' }: StockTempLogoProps) {
  const sizeClasses = {
    xs: {
      container: 'w-6 h-6 rounded-lg p-1',
      icon: 'w-4 h-4'
    },
    sm: {
      container: 'w-8 h-8 rounded-xl p-1.5',
      icon: 'w-5 h-5'
    },
    md: {
      container: 'w-10 h-10 rounded-2xl p-2',
      icon: 'w-6 h-6'
    },
    lg: {
      container: 'w-14 h-14 rounded-3xl p-3',
      icon: 'w-8 h-8'
    }
  }[size]

  return (
    <div
      className={`inline-flex items-center justify-center bg-gradient-to-br from-blue-500 via-indigo-500 to-rose-400 shadow-md shadow-indigo-500/20 text-white shrink-0 ${sizeClasses.container} ${className}`}
    >
      <Thermometer className={`${sizeClasses.icon} text-white stroke-[2.2]`} />
    </div>
  )
}
