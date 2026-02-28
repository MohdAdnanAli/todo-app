import React, { useState, useEffect, useRef } from 'react';
import { useTheme, presetThemes } from '../theme';
import type { ThemeId, CustomThemeColors } from '../theme/types';
import type { MessageType } from '../types';
import LEDIndicator from './LEDIndicator';

interface ThemeSelectorProps {
  ledMessage?: string;
  ledMessageType?: MessageType;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ ledMessage = '', ledMessageType = 'info' }) => {
  const { themeId, setThemeId, currentTheme, customColors, setCustomColors, isCustomizing, setIsCustomizing } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsCustomizing(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setIsCustomizing]);

  const handleThemeSelect = (id: ThemeId) => {
    setThemeId(id);
    if (id !== 'custom') {
      setIsOpen(false);
      setIsCustomizing(false);
    }
  };

  const handleCustomColorChange = (key: keyof CustomThemeColors, value: string) => {
    setCustomColors({ ...customColors, [key]: value });
  };

  const saveCustomTheme = () => {
    setThemeId('custom');
    setIsOpen(false);
    setIsCustomizing(false);
  };

  return (
    <div className="theme-selector" ref={dropdownRef}>
      {/* LED Indicator - always visible below toggle on small screens */}
      <div className="theme-toggle-led">
        <LEDIndicator message={ledMessage} messageType={ledMessageType} variant="small-screen-header" />
      </div>
      
      <button
        className="theme-toggle-button"
        onClick={() => setIsOpen(!isOpen)}
        title="Toggle theme selector"
        aria-label="Theme selector"
        aria-expanded={isOpen}
      >
        <span>{currentTheme.icon}</span>
        <span className="theme-toggle-arrow">▼</span>
      </button>

      {isOpen && (
        <div className="theme-dropdown">
          <div className="theme-section-title">Base Themes</div>
          <button
            className={`theme-option ${themeId === 'system' ? 'active' : ''}`}
            onClick={() => handleThemeSelect('system')}
            aria-pressed={themeId === 'system'}
          >
            <span className="theme-option-icon">⚙️</span>
            <span>System</span>
          </button>
          
          <div className="theme-divider" />
          <div className="theme-section-title">Presets</div>
          
          {presetThemes.map((theme) => (
            <button
              key={theme.id}
              className={`theme-option ${themeId === theme.id ? 'active' : ''}`}
              onClick={() => handleThemeSelect(theme.id)}
              aria-pressed={themeId === theme.id}
            >
              <span className="theme-option-icon">{theme.icon}</span>
              <span>{theme.name}</span>
            </button>
          ))}

          <div className="theme-divider" />
          <div className="theme-section-title">Customize</div>
          
          <button
            className={`theme-option ${themeId === 'custom' || isCustomizing ? 'active' : ''}`}
            onClick={() => {
              setIsCustomizing(true);
              setThemeId('custom');
            }}
            aria-pressed={themeId === 'custom' || isCustomizing}
          >
            <span className="theme-option-icon">🎨</span>
            <span>Custom Theme</span>
          </button>

          {isCustomizing && (
            <div className="custom-theme-editor">
              <h4>Customize Colors</h4>
              <div className="color-picker-row">
                <div className="color-picker-group">
                  <label htmlFor="bg-primary-input">Background</label>
                  <input
                    id="bg-primary-input"
                    type="color"
                    value={customColors.bgPrimary}
                    onChange={(e) => handleCustomColorChange('bgPrimary', e.target.value)}
                  />
                </div>
                <div className="color-picker-group">
                  <label htmlFor="bg-secondary-input">Surface</label>
                  <input
                    id="bg-secondary-input"
                    type="color"
                    value={customColors.bgSecondary}
                    onChange={(e) => handleCustomColorChange('bgSecondary', e.target.value)}
                  />
                </div>
                <div className="color-picker-group">
                  <label htmlFor="accent-primary-input">Primary</label>
                  <input
                    id="accent-primary-input"
                    type="color"
                    value={customColors.accentPrimary}
                    onChange={(e) => handleCustomColorChange('accentPrimary', e.target.value)}
                  />
                </div>
                <div className="color-picker-group">
                  <label htmlFor="accent-secondary-input">Secondary</label>
                  <input
                    id="accent-secondary-input"
                    type="color"
                    value={customColors.accentSecondary}
                    onChange={(e) => handleCustomColorChange('accentSecondary', e.target.value)}
                  />
                </div>
              </div>
              <div className="color-picker-row">
                <div className="color-picker-group">
                  <label htmlFor="text-primary-input">Text</label>
                  <input
                    id="text-primary-input"
                    type="color"
                    value={customColors.textPrimary}
                    onChange={(e) => handleCustomColorChange('textPrimary', e.target.value)}
                  />
                </div>
                <div className="color-picker-group">
                  <label htmlFor="text-secondary-input">Muted</label>
                  <input
                    id="text-secondary-input"
                    type="color"
                    value={customColors.textSecondary}
                    onChange={(e) => handleCustomColorChange('textSecondary', e.target.value)}
                  />
                </div>
              </div>
              <div className="custom-theme-buttons">
                <button
                  onClick={saveCustomTheme}
                  className="theme-apply-button"
                >
                  Apply
                </button>
                <button
                  onClick={() => setIsCustomizing(false)}
                  className="theme-cancel-button"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ThemeSelector;

