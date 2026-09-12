import React, { useState, useRef } from 'react'

interface SwipeableCardProps {
  id: string
  onDismiss: () => void
  children: React.ReactNode
  className?: string
  innerClassName?: string
  disabled?: boolean
}

export default function SwipeableCard({
  id,
  onDismiss,
  children,
  className = '',
  innerClassName = 'rounded-3xl',
  disabled = false
}: SwipeableCardProps) {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isDismissing, setIsDismissing] = useState(false)
  const [isSwiping, setIsSwiping] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  if (disabled) {
    return <div className={className}>{children}</div>
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setTouchStart({ x: touch.clientX, y: touch.clientY })
    setIsSwiping(false)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || isDismissing) return

    const touch = e.touches[0]
    const deltaX = touch.clientX - touchStart.x // positive: swipe right, negative: swipe left
    const deltaY = touch.clientY - touchStart.y

    // Detect horizontal swipe with high confidence
    if (!isSwiping && Math.abs(deltaX) > Math.abs(deltaY) * 1.5 && Math.abs(deltaX) > 10) {
      setIsSwiping(true)
    }

    if (isSwiping) {
      // Prevent browser page scrolling when swiping horizontally
      if (e.cancelable) {
        e.preventDefault()
      }
      setSwipeOffset(deltaX)
    }
  }

  const handleTouchEnd = () => {
    if (!touchStart || isDismissing) return

    const threshold = 100 // Pixels swiped to trigger dismiss
    if (isSwiping && Math.abs(swipeOffset) > threshold) {
      setIsDismissing(true)
      const exitDirection = swipeOffset > 0 ? window.innerWidth : -window.innerWidth
      setSwipeOffset(exitDirection) // slide completely off screen in swipe direction
      setTimeout(() => {
        onDismiss()
      }, 200) // matches transition time
    } else {
      // Bounce back to center
      setSwipeOffset(0)
    }
    setTouchStart(null)
    setIsSwiping(false)
  }

  const absOffset = Math.abs(swipeOffset)
  const opacity = isSwiping
    ? Math.max(0.2, 1 - absOffset / 200)
    : 1

  const transformStyle = swipeOffset !== 0
    ? `translateX(${swipeOffset}px)`
    : 'none'

  const transitionStyle = isSwiping ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease'

  return (
    <div
      ref={cardRef}
      data-swipe-id={id}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: transformStyle,
        opacity: opacity,
        transition: transitionStyle,
        touchAction: 'pan-y'
      }}
      className={`relative will-change-transform ${className}`}
    >
      {/* Swipe reveal background hint (left or right) */}
      {absOffset > 20 && (
        <div 
          className={`absolute inset-0 ${swipeOffset < 0 ? 'bg-gradient-to-l justify-end pr-6' : 'bg-gradient-to-r justify-start pl-6'} from-rose-500/20 to-transparent border border-rose-500/10 ${innerClassName} flex items-center text-rose-400 select-none z-0`}
          style={{ 
            opacity: Math.min(1, absOffset / 80),
            pointerEvents: 'none'
          }}
        >
          <div className="flex flex-col items-center gap-1">
            <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span className="text-[8px] font-black uppercase tracking-wider">Dismiss</span>
          </div>
        </div>
      )}
      <div className={`relative z-10 bg-slate-900 ${innerClassName}`}>
        {children}
      </div>
    </div>
  )
}
