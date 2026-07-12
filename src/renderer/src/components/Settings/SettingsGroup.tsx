/* eslint-disable prettier/prettier */
import React from 'react'

interface SettingsGroupProps {
  title: string
  children: React.ReactNode
}

export default function SettingsGroup({ title, children }: SettingsGroupProps): React.ReactElement | null {
  const visibleChildren = React.Children.toArray(children).filter(Boolean)

  if (visibleChildren.length === 0) return null

  return (
    <div>
      <h3 className="text-lg font-semibold text-text-primary mb-4">{title}</h3>
      <div className="space-y-1 border-t border-ink-700 pt-4">{visibleChildren}</div>
    </div>
  )
}
