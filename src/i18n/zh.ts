/**
 * 简体中文 (Simplified Chinese) catalog. Partial by design — any key not here
 * falls back to English.
 */
import type { Messages } from './en'

export const zh: Partial<Messages> = {
  'mode.intro':
    '选择一个模式，用耳朵抄收摩尔斯电码。你会从两个字符开始，逐步解锁更多。',
  'mode.learn.name': '学习',
  'mode.learn.blurb': '逐个字符用耳朵学 —— Koch 教学法。',
  'mode.groups.name': '抄收字符组',
  'mode.groups.blurb': '从已解锁的字符中随机组合。',
  'mode.words.name': '单词',
  'mode.words.blurb': '抄收真实单词。',
  'mode.callsigns.name': '呼号',
  'mode.callsigns.blurb': '仿真呼号样式。',
  'mode.numbers.name': '数字',
  'mode.numbers.blurb': '数字练习。',
  'home.hint': '按空格 · 请打开声音',

  'action.start': '开始收听',
  'action.soon': '即将推出',
  'action.close': '关闭设置',

  'settings.title': '设置',
  'settings.subtitle': '调节声音，保持节奏。',
  'settings.language': '语言',
  'settings.charSpeed': '字符速度',
  'settings.overallSpeed': '整体速度',
  'settings.sidetone': '侧音频率',
  'settings.volume': '音量',
  'settings.roundLength': '每轮题数',
  'settings.groupSize': '每组字符数',
  'settings.strict': '严格模式（抄错需重新输入才能继续）',
  'settings.strictHint': '默认开启：抄错的字符需正确复述一次才能继续。',
  'settings.sounds': '答题提示音',
  'settings.soundsHint': '每次答题后播放对／错提示音。',
  'settings.patterns': '显示点划图案',
  'settings.patternsHint': '默认关闭 —— 用耳朵学才是重点。需要参考时再打开。',

  'unit.wpm': 'WPM',
  'unit.hz': 'Hz',
  'unit.prompts': '题',
  'unit.chars': '个',
}
