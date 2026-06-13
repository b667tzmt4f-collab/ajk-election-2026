import { useState, useEffect } from 'react'
export type Theme = 'light' | 'dark'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const saved = localStorage.getItem('ajk-theme') as Theme | null
    const t = saved || 'light'
    document.documentElement.classList.toggle('dark', t === 'dark')
    setTheme(t)
  }, [])

  function toggle() {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light'
      localStorage.setItem('ajk-theme', next)
      document.documentElement.classList.toggle('dark', next === 'dark')
      return next
    })
  }

  return { theme, toggle }
}
