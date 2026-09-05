import type { LanguageDefinition } from '../types'
import { python } from './python'
import { javascript } from './javascript'
import { typescript } from './typescript'
import { bash } from './bash'
import { json } from './json'
import { css } from './css'
import { html } from './html'
import { sql } from './sql'
import { genericLanguage } from './generic'

export * from './python'
export * from './javascript'
export * from './typescript'
export * from './bash'
export * from './json'
export * from './css'
export * from './html'
export * from './sql'
export * from './generic'

/** Todas las definiciones de lenguaje registradas. */
export const languages: LanguageDefinition[] = [
  python,
  javascript,
  typescript,
  bash,
  json,
  css,
  html,
  sql,
  genericLanguage
]
