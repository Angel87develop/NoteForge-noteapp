/* eslint-disable prettier/prettier */
import { useEffect } from 'react'
import { useSettings } from '../contexts/SettingsContext'
import { darkTheme, lightTheme, sidebarDarkTheme } from '../themes'

export function useThemeStyles(): void {
  const { settings } = useSettings()

  useEffect(() => {
    const root = document.documentElement
    const isLight = settings.ui.theme.theme === 'light' || 
                    (settings.ui.theme.theme === 'system' && window.matchMedia('(prefers-color-scheme: light)').matches)

    // Aplicar tema claro/oscuro usando los temas de la carpeta themes
    if (isLight) {
      // Aplicar tema claro
      Object.entries(lightTheme).forEach(([key, value]) => {
        root.style.setProperty(key, value)
      })
      root.classList.add('theme-light')
      root.classList.remove('theme-dark')
    } else {
      // Aplicar tema oscuro
      Object.entries(darkTheme).forEach(([key, value]) => {
        root.style.setProperty(key, value)
      })
      root.classList.add('theme-dark')
      root.classList.remove('theme-light')
    }

    // Aplicar tema oscuro a la sidebar (siempre oscura)
    const sidebar = document.querySelector('.sidebar')
    if (sidebar) {
      Object.entries(sidebarDarkTheme).forEach(([key, value]) => {
        ;(sidebar as HTMLElement).style.setProperty(key, value)
      })
    }

    // Aplicar border radius
    const borderRadius = settings.ui.theme.borderRadius
    root.style.setProperty('--border-radius', `${borderRadius}px`)

    // Aplicar densidad de interfaz
    const density = settings.ui.theme.density
    const densityMap = {
      compact: { spacing: '0.5rem', padding: '0.375rem', fontSize: '0.875rem' },
      normal: { spacing: '0.75rem', padding: '0.5rem', fontSize: '0.875rem' },
      comfortable: { spacing: '1rem', padding: '0.75rem', fontSize: '1rem' }
    }
    const densityValues = densityMap[density]
    root.style.setProperty('--density-spacing', densityValues.spacing)
    root.style.setProperty('--density-padding', densityValues.padding)
    root.style.setProperty('--density-font-size', densityValues.fontSize)

    // Aplicar animaciones
    const animationsEnabled = settings.ui.theme.animations
    const animationSpeed = settings.ui.theme.animationSpeed
    root.style.setProperty('--animation-speed', `${animationSpeed / 100}`)
    
    if (animationsEnabled) {
      root.classList.add('animations-enabled')
      root.classList.remove('animations-disabled')
    } else {
      root.classList.add('animations-disabled')
      root.classList.remove('animations-enabled')
    }

    // Aplicar icon set
    const iconSet = settings.ui.visibility.iconSet
    root.setAttribute('data-icon-set', iconSet)

    // Aplicar densidad como clase
    root.classList.remove('density-compact', 'density-normal', 'density-comfortable')
    root.classList.add(`density-${density}`)

    return () => {
      // Cleanup si es necesario
    }
  }, [settings.ui.theme, settings.ui.visibility.iconSet])

  // Escuchar cambios en el sistema para theme 'system'
  useEffect(() => {
    if (settings.ui.theme.theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)')
    const handleChange = (): void => {
      // El efecto principal se volverá a ejecutar automáticamente
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [settings.ui.theme.theme])

}

