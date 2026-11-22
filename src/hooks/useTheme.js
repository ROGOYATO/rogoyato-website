import { useEffect, useState } from 'react'

const STORAGE_KEY = 'rgoyato-theme'

function getInitialTheme() {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const storedTheme = window.localStorage.getItem(STORAGE_KEY)
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    window.localStorage.setItem(STORAGE_KEY, theme)
    // The tab icon follows the site's theme: a brighter robot when dark.
    const icon = document.querySelector('link[rel="icon"][type="image/svg+xml"]')
    if (icon) icon.href = `${import.meta.env.BASE_URL}${theme === 'dark' ? 'favicon-dark.svg' : 'favicon.svg'}`
  }, [theme])

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'))
  }

  return { theme, toggleTheme }
}