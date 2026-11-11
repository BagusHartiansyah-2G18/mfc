import * as React from "react"

type Theme = "light" | "dark"
type ResolvedTheme = "light" | "dark"

interface ThemeContextValue {
  theme: Theme | "system"
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme | "system") => void
  toggle: () => void
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined)

function getInitialTheme(): Theme | "system" {
  try {
    const stored = localStorage.getItem("theme") as Theme | "system" | null
    if (stored === "light" || stored === "dark" || stored === "system") return stored
  } catch {
    return "system"
  }
  return "system"
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    return "dark"
  }
  return "light"
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme | "system">(() => getInitialTheme())
  const [resolvedTheme, setResolvedTheme] = React.useState<ResolvedTheme>(() =>
    theme === "system" ? getSystemTheme() : theme
  )

  const applyTheme = React.useCallback((next: Theme | "system") => {
    const resolved = next === "system" ? getSystemTheme() : next
    setResolvedTheme(resolved)
    if (resolved === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [])

  React.useEffect(() => {
    applyTheme(theme)
    try {
      localStorage.setItem("theme", theme)
    } catch {
      // ignore storage errors
    }
  }, [theme, applyTheme])

  React.useEffect(() => {
    if (theme !== "system" || typeof window === "undefined" || !window.matchMedia) return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    if (!mq) return
    const handleChange = () => applyTheme("system")
    mq.addEventListener?.("change", handleChange)
    return () => mq.removeEventListener?.("change", handleChange)
  }, [theme, applyTheme])

  const setTheme = React.useCallback((next: Theme | "system") => {
    setThemeState(next)
  }, [])

  const toggle = React.useCallback(() => {
    setThemeState((prev) => {
      const current = prev === "system" ? getSystemTheme() : prev
      return current === "dark" ? "light" : "dark"
    })
  }, [])

  const value = React.useMemo(
    () => ({ theme, resolvedTheme, setTheme, toggle }),
    [theme, resolvedTheme, setTheme, toggle]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext)
  if (!ctx) {
    return {
      theme: "system" as const,
      resolvedTheme: "light" as const,
      setTheme: () => {},
      toggle: () => {},
    }
  }
  return ctx
}
