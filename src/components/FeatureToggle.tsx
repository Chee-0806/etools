/**
 * Feature Toggle Component (T186)
 * A toggle switch component for enabling/disabling features
 */

import './FeatureToggle.css';

interface FeatureToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function FeatureToggle({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: FeatureToggleProps) {
  return (
    <label className={`feature-toggle ${disabled ? 'disabled' : ''}`}>
      <div className="feature-toggle__info">
        <span className="feature-toggle__label">{label}</span>
        {description && (
          <span className="feature-toggle__description">{description}</span>
        )}
      </div>
      <div className="feature-toggle__switch">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="feature-toggle__input"
        />
        <span className="feature-toggle__slider"></span>
      </div>
    </label>
  );
}
