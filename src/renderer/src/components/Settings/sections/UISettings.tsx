/* eslint-disable prettier/prettier */
import React from 'react'
import { useSettings } from '../../../contexts/SettingsContext'
import { Theme, UIDensity, IconSet } from '../../../types/settings'
import Toggle from '../Toggle'
import Slider from '../Slider'
import Select from '../Select'
import SettingsGroup from '../SettingsGroup'

interface UISettingsProps {
  searchQuery?: string
}

export default function UISettings({ searchQuery = '' }: UISettingsProps): React.ReactElement {
  const { settings, updateUITheme, updateUIVisibility } = useSettings()

  return (
    <div className="space-y-8">
      <SettingsGroup title="Theme and Visual">
        <Select
          searchQuery={searchQuery}
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
          searchQuery={searchQuery}
          label="Border radius"
          value={settings.ui.theme.borderRadius}
          min={0}
          max={24}
          unit="px"
          onChange={(value) => updateUITheme({ borderRadius: value })}
        />

        <Select
          searchQuery={searchQuery}
          label="Interface density"
          value={settings.ui.theme.density}
          options={[
            { value: 'compact', label: 'Compact' },
            { value: 'normal', label: 'Normal' },
            { value: 'comfortable', label: 'Comfortable' }
          ]}
          onChange={(value) => updateUITheme({ density: value as UIDensity })}
        />
      </SettingsGroup>

      <SettingsGroup title="Animations">
        <Toggle
          searchQuery={searchQuery}
          label="Enable animations"
          checked={settings.ui.theme.animations}
          onChange={(checked) => updateUITheme({ animations: checked })}
        />

        {settings.ui.theme.animations && (
          <Slider
            searchQuery={searchQuery}
            label="Animation speed"
            value={settings.ui.theme.animationSpeed}
            min={0}
            max={100}
            unit="%"
            onChange={(value) => updateUITheme({ animationSpeed: value })}
          />
        )}
      </SettingsGroup>

      <SettingsGroup title="Element Visibility">
        <Toggle
          searchQuery={searchQuery}
          label="Show sidebar"
          checked={settings.ui.visibility.showSidebar}
          onChange={(checked) => updateUIVisibility({ showSidebar: checked })}
        />

        <Toggle
          searchQuery={searchQuery}
          label="Show notes bar"
          checked={settings.ui.visibility.showNotesBar}
          onChange={(checked) => updateUIVisibility({ showNotesBar: checked })}
        />

        <Toggle
          searchQuery={searchQuery}
          label="Show top bar"
          checked={settings.ui.visibility.showTopBar}
          onChange={(checked) => updateUIVisibility({ showTopBar: checked })}
        />

        <Select
          searchQuery={searchQuery}
          label="Icon set"
          value={settings.ui.visibility.iconSet}
          options={[
            { value: 'minimal', label: 'Minimal' },
            { value: 'outline', label: 'Outline' },
            { value: 'filled', label: 'Filled' }
          ]}
          onChange={(value) => updateUIVisibility({ iconSet: value as IconSet })}
        />
      </SettingsGroup>
    </div>
  )
}
