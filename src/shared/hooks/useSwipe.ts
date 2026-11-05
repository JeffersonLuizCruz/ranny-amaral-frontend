import { useEffect, useRef } from 'react'

interface SwipeOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  threshold?: number
}

/**
 * Horizontal swipe detection for touch devices.
 * Ignores mostly-vertical gestures so it never fights with scrolling.
 */
export function useSwipe({ onSwipeLeft, onSwipeRight, threshold = 56 }: SwipeOptions) {
  const elementRef = useRef<HTMLDivElement>(null)
  const callbacks = useRef({ onSwipeLeft, onSwipeRight })

  useEffect(() => {
    callbacks.current = { onSwipeLeft, onSwipeRight }
  }, [onSwipeLeft, onSwipeRight])

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const gesture = {
      startX: 0,
      startY: 0,
      tracking: false,
    }

    const handleStart = (event: TouchEvent) => {
      const touch = event.touches[0]
      if (!touch) return
      gesture.startX = touch.clientX
      gesture.startY = touch.clientY
      gesture.tracking = true
    }

    const handleEnd = (event: TouchEvent) => {
      if (!gesture.tracking) return
      gesture.tracking = false

      const touch = event.changedTouches[0]
      if (!touch) return

      const deltaX = touch.clientX - gesture.startX
      const deltaY = touch.clientY - gesture.startY

      if (Math.abs(deltaX) < threshold) return
      if (Math.abs(deltaX) < Math.abs(deltaY) * 1.4) return

      if (deltaX < 0) callbacks.current.onSwipeLeft?.()
      else callbacks.current.onSwipeRight?.()
    }

    const handleCancel = () => {
      gesture.tracking = false
    }

    element.addEventListener('touchstart', handleStart, { passive: true })
    element.addEventListener('touchend', handleEnd, { passive: true })
    element.addEventListener('touchcancel', handleCancel, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleStart)
      element.removeEventListener('touchend', handleEnd)
      element.removeEventListener('touchcancel', handleCancel)
    }
  }, [threshold])

  return elementRef
}
