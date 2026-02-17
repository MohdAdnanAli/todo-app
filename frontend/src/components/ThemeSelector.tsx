import React, { useState, useEffect, useRef } from 'react';
import { useTheme, presetThemes } from '../theme';
import type { ThemeId, CustomThemeColors } from '../theme/types';

const ThemeSelector: React.FC = () => {
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
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'absolute',
          top: '0.75rem',
          right: '0.75rem',
          padding: '0.5rem 0.75rem',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'var(--text-primary)',
          transition: 'all 0.2s ease',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = 'var(--hover-bg)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'var(--bg-secondary)';
        }}
      >
        <span>{currentTheme.icon}</span>
        <span style={{ fontSize: '0.75rem' }}>▼</span>
      </button>

      {isOpen && (
        <div className="theme-dropdown">
          <div className="theme-section-title">Base Themes</div>
          <button
            className={`theme-option ${themeId === 'system' ? 'active' : ''}`}
            onClick={() => handleThemeSelect('system')}
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
          >
            <span className="theme-option-icon">🎨</span>
            <span>Custom Theme</span>
          </button>

          {isCustomizing && (
            <div className="custom-theme-editor">
              <h4>Customize Colors</h4>
              <div className="color-picker-row">
                <div className="color-picker-group">
                  <label>Background</label>
                  <input
                    type="color"
                    value={customColors.bgPrimary}
                    onChange={(e) => handleCustomColorChange('bgPrimary', e.target.value)}
                  />
                </div>
                <div className="color-picker-group">
                  <label>Surface</label>
                  <input
                    type="color"
                    value={customColors.bgSecondary}
                    onChange={(e) => handleCustomColorChange('bgSecondary', e.target.value)}
                  />
                </div>
                <div className="color-picker-group">
                  <label>Primary</label>
                  <input
                    type="color"
                    value={customColors.accentPrimary}
                    onChange={(e) => handleCustomColorChange('accentPrimary', e.target.value)}
                  />
                </div>
                <div className="color-picker-group">
                  <label>Secondary</label>
                  <input
                    type="color"
                    value={customColors.accentSecondary}
                    onChange={(e) => handleCustomColorChange('accentSecondary', e.target.value)}
                  />
                </div>
              </div>
              <div className="color-picker-row">
                <div className="color-picker-group">
                  <label>Text</label>
                  <input
                    type="color"
                    value={customColors.textPrimary}
                    onChange={(e) => handleCustomColorChange('textPrimary', e.target.value)}
                  />
                </div>
                <div className="color-picker-group">
                  <label>Muted</label>
                  <input
                    type="color"
                    value={customColors.textSecondary}
                    onChange={(e) => handleCustomColorChange('textSecondary', e.target.value)}
                  />
                </div>
              </div>
              <div className="custom-theme-buttons">
                <button
                  onClick={saveCustomTheme}
                  style={{
                    background: 'var(--accent-gradient)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.5rem',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  Apply
                </button>
                <button
                  onClick={() => setIsCustomizing(false)}
                  style={{
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '6px',
                    padding: '0.5rem',
                    cursor: 'pointer',
                  }}
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

