'use client'
import { useState, useEffect } from 'react'

const Loading = () => {
  const [dots, setDots] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(dots => dots + '.')
    }, 300)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="relative">
        <div className="absolute -top-[100%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 rounded-full shadow-vertical-card">
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="45" fill="#E5E7EB" />
            <circle cx="50" cy="50" r="45" fill="#18181B" className="animate-ping" />
          </svg>
        </div>
        <div className="relative">
          <h1 className="text-6xl font-bold animate-pulse">Loading{dots}</h1>
        </div>
      </div>
    </div>
  )
}

export default Loading