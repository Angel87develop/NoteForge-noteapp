/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import React from 'react'

interface AcrylicPanelProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'win11'
  rounded?: boolean
  shadow?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

/**
 * AcrylicPanel Component
 * 
 * Componente reutilizable que aplica el efecto Acrylic de Windows 11
 * Usa backdrop-filter para simular el efecto en todas las plataformas
 * 
 * @param children - Contenido del panel
 * @param className - Clases adicionales de Tailwind
 * @param variant - Variante del efecto ('default' o 'win11')
 * @param rounded - Aplicar bordes redondeados
 * @param shadow - Aplicar sombra
 * @param padding - Tamaño del padding
 */
export default function AcrylicPanel({
  children,
  className = '',
  variant = 'default',
  rounded = true,
  shadow = true,
  padding = 'md'
}: AcrylicPanelProps): React.JSX.Element {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8'
  }

  const baseClasses = 'acrylic'
  const variantClass = variant === 'win11' ? 'acrylic-win11' : ''
  const roundedClass = rounded ? 'rounded-xl' : ''
  const shadowClass = shadow ? 'shadow-xl' : ''
  const paddingClass = paddingClasses[padding]

  return (
    <div
      className={`${baseClasses} ${variantClass} ${roundedClass} ${shadowClass} ${paddingClass} ${className}`}
    >
      {children}
    </div>
  )
}

