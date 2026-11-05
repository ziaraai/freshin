import { useContext, useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"
import { BrandContext } from "@/contexts/BrandContext"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme: nextTheme = "system" } = useTheme()
  const brand = useContext(BrandContext)
  const [dir, setDir] = useState<"ltr" | "rtl">("ltr")

  const resolveTheme = (): "light" | "dark" | "system" => {
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("dark") ? "dark" : "light"
    }
    if (brand?.themeMode && brand.themeMode !== "system") {
      return brand.themeMode as "light" | "dark"
    }
    return (brand?.themeMode || nextTheme || "system") as "light" | "dark" | "system"
  }

  const [currentTheme, setCurrentTheme] = useState<"light" | "dark" | "system">(resolveTheme)

  useEffect(() => {
    const updateThemeAndDir = () => {
      const currentDir = document.documentElement.dir as "ltr" | "rtl"
      setDir(currentDir || "ltr")

      const isDark = document.documentElement.classList.contains("dark")
      setCurrentTheme(isDark ? "dark" : "light")
    }

    updateThemeAndDir()

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes") {
          if (mutation.attributeName === "dir" || mutation.attributeName === "class") {
            updateThemeAndDir()
          }
        }
      })
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["dir", "class"],
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (brand?.themeMode) {
      if (brand.themeMode === "dark") {
        setCurrentTheme("dark")
      } else if (brand.themeMode === "light") {
        setCurrentTheme("light")
      } else {
        const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark")
        setCurrentTheme(isDark ? "dark" : "light")
      }
    }
  }, [brand?.themeMode])

  return (
    <Sonner
      key={`${currentTheme}-${dir}`}
      theme={currentTheme as ToasterProps["theme"]}
      className="toaster group"
      dir={dir}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          pointerEvents: "auto",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }

