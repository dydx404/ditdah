import type { Settings } from '@/app/settings'
import { normalizeSettings } from '@/app/settings'

interface SettingsPanelProps {
  open: boolean
  settings: Settings
  onSettingsChange: (settings: Settings) => void
  onClose: () => void
}

export function SettingsPanel({
  open,
  settings,
  onSettingsChange,
  onClose,
}: SettingsPanelProps) {
  if (!open) {
    return null
  }

  const update = (patch: Partial<Settings>) => {
    onSettingsChange(normalizeSettings({ ...settings, ...patch }))
  }

  return (
    <div className="fixed inset-0 z-30">
      <button
        type="button"
        aria-label="Close settings"
        className="absolute inset-0 h-full w-full cursor-default bg-bg/70"
        onClick={onClose}
      />
      <aside
        aria-label="Settings"
        className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col border-l border-border bg-surface p-5 shadow-2xl"
      >
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-mono text-lg font-semibold text-text">Settings</h2>
            <p className="mt-1 text-sm text-muted">Tune the sound, keep the rhythm.</p>
          </div>
          <button
            type="button"
            aria-label="Close settings"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-md border border-border font-mono text-muted transition hover:text-text"
          >
            x
          </button>
        </div>

        <div className="flex flex-col gap-6">
          <SettingSlider
            label="Character speed"
            value={settings.charWpm}
            min={10}
            max={40}
            step={1}
            display={`${settings.charWpm} WPM`}
            onChange={(charWpm) => update({ charWpm })}
          />
          <SettingSlider
            label="Overall speed"
            value={settings.effectiveWpm}
            min={5}
            max={settings.charWpm}
            step={1}
            display={`${settings.effectiveWpm} WPM`}
            onChange={(effectiveWpm) => update({ effectiveWpm })}
          />
          <SettingSlider
            label="Sidetone"
            value={settings.toneHz}
            min={400}
            max={1000}
            step={10}
            display={`${settings.toneHz} Hz`}
            onChange={(toneHz) => update({ toneHz })}
          />
          <SettingSlider
            label="Volume"
            value={settings.volume}
            min={0}
            max={1}
            step={0.05}
            display={`${Math.round(settings.volume * 100)}%`}
            onChange={(volume) => update({ volume })}
          />
          <SettingSlider
            label="Round length"
            value={settings.roundLength}
            min={5}
            max={100}
            step={5}
            display={`${settings.roundLength} prompts`}
            onChange={(roundLength) => update({ roundLength })}
          />
          <SettingToggle
            label="Strict mode (type misses back to continue)"
            hint="On by default: missed characters must be echoed once before moving on."
            checked={settings.strictGate}
            onChange={(strictGate) => update({ strictGate })}
          />
          <SettingToggle
            label="Answer sounds"
            hint="Play short correct and wrong cues after each answer."
            checked={settings.answerSounds}
            onChange={(answerSounds) => update({ answerSounds })}
          />
          <SettingToggle
            label="Show dit/dah patterns"
            hint="Off by default — learning by ear is the point. Turn on for a visual reference."
            checked={settings.showPatterns}
            onChange={(showPatterns) => update({ showPatterns })}
          />
        </div>
      </aside>
    </div>
  )
}

interface SettingSliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  display: string
  onChange: (value: number) => void
}

function SettingSlider({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: SettingSliderProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="flex items-baseline justify-between gap-4 font-mono text-sm">
        <span className="text-muted">{label}</span>
        <span className="tabular-nums text-text">{display}</span>
      </span>
      <input
        type="range"
        aria-label={label}
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        className="w-full accent-accent"
      />
    </label>
  )
}

interface SettingToggleProps {
  label: string
  hint: string
  checked: boolean
  onChange: (checked: boolean) => void
}

function SettingToggle({ label, hint, checked, onChange }: SettingToggleProps) {
  return (
    <label className="flex cursor-pointer flex-col gap-1">
      <span className="flex items-center justify-between gap-4 font-mono text-sm">
        <span className="text-muted">{label}</span>
        <input
          type="checkbox"
          aria-label={label}
          checked={checked}
          onChange={(event) => onChange(event.currentTarget.checked)}
          className="h-4 w-4 accent-accent"
        />
      </span>
      <span className="text-xs text-muted/70">{hint}</span>
    </label>
  )
}
