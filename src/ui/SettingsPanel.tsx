import type { Settings } from '@/app/settings'
import { normalizeSettings } from '@/app/settings'
import type { CharProgress } from '@/core/storage/types'
import { LOCALES, useT } from '@/i18n'
import { AccountSection, type AccountState } from './AccountSection'
import { CharacterPicker } from './components/CharacterPicker'

interface SettingsPanelProps {
  open: boolean
  settings: Settings
  onSettingsChange: (settings: Settings) => void
  onClose: () => void
  account?: AccountState
  unlockedChars?: readonly string[]
  charStats?: Readonly<Record<string, CharProgress>>
}

export function SettingsPanel({
  open,
  settings,
  onSettingsChange,
  onClose,
  account,
  unlockedChars = [],
  charStats = {},
}: SettingsPanelProps) {
  const t = useT()
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
        aria-label={t('action.close')}
        className="absolute inset-0 h-full w-full cursor-default bg-bg/70"
        onClick={onClose}
      />
      <aside
        aria-label={t('settings.title')}
        className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col border-l border-border bg-surface p-5 shadow-2xl"
      >
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-mono text-lg font-semibold text-text">
              {t('settings.title')}
            </h2>
            <p className="mt-1 text-sm text-muted">{t('settings.subtitle')}</p>
          </div>
          <button
            type="button"
            aria-label={t('action.close')}
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-md border border-border font-mono text-muted transition hover:text-text"
          >
            x
          </button>
        </div>

        <div className="flex flex-col gap-6">
          {account && <AccountSection {...account} />}
          {settings.charSource === 'custom' && (
            <CharacterPicker
              value={settings.customCharset}
              unlockedChars={unlockedChars}
              charStats={charStats}
              onChange={(customCharset) => update({ customCharset })}
            />
          )}
          <div className="flex flex-col gap-2">
            <span className="font-mono text-sm text-muted">
              {t('settings.language')}
            </span>
            <div
              className="flex gap-2"
              role="group"
              aria-label={t('settings.language')}
            >
              {LOCALES.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  aria-pressed={settings.locale === loc.id}
                  onClick={() => update({ locale: loc.id })}
                  className={[
                    'rounded-md border px-3 py-1.5 font-mono text-sm transition',
                    settings.locale === loc.id
                      ? 'border-accent bg-accent/10 text-text'
                      : 'border-border text-muted hover:text-text',
                  ].join(' ')}
                >
                  {loc.label}
                </button>
              ))}
            </div>
          </div>
          <SettingSlider
            label={t('settings.charSpeed')}
            value={settings.charWpm}
            min={10}
            max={40}
            step={1}
            display={`${settings.charWpm} ${t('unit.wpm')}`}
            onChange={(charWpm) => update({ charWpm })}
          />
          <SettingSlider
            label={t('settings.overallSpeed')}
            value={settings.effectiveWpm}
            min={5}
            max={settings.charWpm}
            step={1}
            display={`${settings.effectiveWpm} ${t('unit.wpm')}`}
            onChange={(effectiveWpm) => update({ effectiveWpm })}
          />
          <SettingSlider
            label={t('settings.sidetone')}
            value={settings.toneHz}
            min={400}
            max={1000}
            step={10}
            display={`${settings.toneHz} ${t('unit.hz')}`}
            onChange={(toneHz) => update({ toneHz })}
          />
          <SettingSlider
            label={t('settings.volume')}
            value={settings.volume}
            min={0}
            max={1}
            step={0.05}
            display={`${Math.round(settings.volume * 100)}%`}
            onChange={(volume) => update({ volume })}
          />
          <SettingSlider
            label={t('settings.roundLength')}
            value={settings.roundLength}
            min={5}
            max={100}
            step={5}
            display={`${settings.roundLength} ${t('unit.prompts')}`}
            onChange={(roundLength) => update({ roundLength })}
          />
          {settings.promptMode === 'group' && (
            <SettingSlider
              label={t('settings.groupSize')}
              value={settings.groupSize}
              min={2}
              max={7}
              step={1}
              display={`${settings.groupSize} ${t('unit.chars')}`}
              onChange={(groupSize) => update({ groupSize })}
            />
          )}
          <SettingToggle
            label={t('settings.strict')}
            hint={t('settings.strictHint')}
            checked={settings.strictGate}
            onChange={(strictGate) => update({ strictGate })}
          />
          <SettingToggle
            label={t('settings.sounds')}
            hint={t('settings.soundsHint')}
            checked={settings.answerSounds}
            onChange={(answerSounds) => update({ answerSounds })}
          />
          <SettingToggle
            label={t('settings.patterns')}
            hint={t('settings.patternsHint')}
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
