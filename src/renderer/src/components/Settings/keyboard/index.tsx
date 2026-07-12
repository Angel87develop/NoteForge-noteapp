/* eslint-disable prettier/prettier */
import React from 'react'
import KeyboardShortcuts from './shortcuts/KeyboardShortcuts'

export default function KeyboardSettings(): React.ReactElement {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-4">Keyboard Shortcuts</h3>
        <KeyboardShortcuts />
      </div>
    </div>
  )
}
