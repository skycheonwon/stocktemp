import { Flame, Sun, CloudSun, Wind, Snowflake } from 'lucide-react'

interface WeatherIconProps {
  name: 'flame' | 'sun' | 'cloud-sun' | 'wind' | 'snowflake';
  className?: string;
}

export function WeatherIcon({ name, className = 'w-5 h-5' }: WeatherIconProps) {
  switch (name) {
    case 'flame':
      return <Flame className={`${className} text-rose-500 animate-bounce`} style={{ animationDuration: '2s' }} />
    case 'sun':
      return <Sun className={`${className} text-amber-500 animate-pulse`} style={{ animationDuration: '3s' }} />
    case 'cloud-sun':
      return <CloudSun className={`${className} text-emerald-400`} />
    case 'wind':
      return <Wind className={`${className} text-cyan-400 animate-pulse`} style={{ animationDuration: '4s' }} />
    case 'snowflake':
      return <Snowflake className={`${className} text-blue-400 animate-spin`} style={{ animationDuration: '12s' }} />
    default:
      return null
  }
}
