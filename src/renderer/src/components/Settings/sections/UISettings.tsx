/* eslint-disable prettier/prettier */
import React from 'react'
import { useSettings } from '../../../contexts/SettingsContext'
import { Theme, UIDensity, IconSet } from '../../../types/settings'
import Toggle from '../Toggle'
import Slider from '../Slider'
import Select from '../Select'

export default function UISettings(): React.ReactElement {
  const { settings, updateUITheme, updateUIVisibility } = useSettings()

  return (
    <div className="space-y-8">
      {/* Theme and Visual */}
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-4">Theme and Visual</h3>
        <div className="space-y-1 border-t border-ink-700 pt-4">
          <Select
            label="Theme"
            value={settings.ui.theme.theme}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'System' }
            ]}
            onChange={(value) => updateUITheme({ theme: value as Theme })}
          />

          <Slider
            label="Border radius"
            value={settings.ui.theme.borderRadius}
            min={0}
            max={24}
            unit="px"
            onChange={(value) => updateUITheme({ borderRadius: value })}
          />
          
          <Select
            label="Interface density"
            value={settings.ui.theme.density}
            options={[
              { value: 'compact', label: 'Compact' },
              { value: 'normal', label: 'Normal' },
              { value: 'comfortable', label: 'Comfortable' }
            ]}
            onChange={(value) => updateUITheme({ density: value as UIDensity })}
          />
        </div>
      </div>

      {/* Animations */}
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-4">Animations</h3>
        <div className="space-y-1 border-t border-ink-700 pt-4">
          <Toggle
            label="Enable animations"
            checked={settings.ui.theme.animations}
            onChange={(checked) => updateUITheme({ animations: checked })}
          />
          
          {settings.ui.theme.animations && (
            <Slider
              label="Animation speed"
              value={settings.ui.theme.animationSpeed}
              min={0}
              max={100}
              unit="%"
              onChange={(value) => updateUITheme({ animationSpeed: value })}
            />
          )}
        </div>
      </div>

      {/* Element Visibility */}
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-4">Element Visibility</h3>
        <div className="space-y-1 border-t border-ink-700 pt-4">
          <Toggle
            label="Show sidebar"
            checked={settings.ui.visibility.showSidebar}
            onChange={(checked) => updateUIVisibility({ showSidebar: checked })}
          />
          
          <Toggle
            label="Show notes bar"
            checked={settings.ui.visibility.showNotesBar}
            onChange={(checked) => updateUIVisibility({ showNotesBar: checked })}
          />
          
          <Toggle
            label="Show top bar"
            checked={settings.ui.visibility.showTopBar}
            onChange={(checked) => updateUIVisibility({ showTopBar: checked })}
          />
          
          <Select
            label="Icon set"
            value={settings.ui.visibility.iconSet}
            options={[
              { value: 'minimal', label: 'Minimal' },
              { value: 'outline', label: 'Outline' },
              { value: 'filled', label: 'Filled' }
            ]}
            onChange={(value) => updateUIVisibility({ iconSet: value as IconSet })}
          />
        </div>
      </div>
    </div>
  )
}

