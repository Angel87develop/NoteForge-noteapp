/* eslint-disable prettier/prettier */
import type { LanguageDefinition } from '../types'
import { commonRules, keywordList, rule } from '../generic'

const bashKeywords = [
  'if', 'then', 'else', 'elif', 'fi', 'for', 'do', 'done', 'while', 'until',
  'case', 'esac', 'in', 'function', 'return', 'break', 'continue', 'exit',
  'local', 'export', 'readonly', 'declare', 'unset', 'shift', 'source',
  'echo', 'printf', 'read', 'cd', 'pwd', 'set', 'trap'
]

const bashBuiltins = [
  'ls', 'cd', 'pwd', 'cp', 'mv', 'rm', 'mkdir', 'rmdir', 'touch', 'cat',
  'grep', 'sed', 'awk', 'find', 'chmod', 'chown', 'tar', 'gzip', 'gunzip',
  'ssh', 'scp', 'curl', 'wget', 'git', 'npm', 'yarn', 'node', 'python',
  'pip', 'sudo', 'apt', 'brew', 'docker', 'make', 'gcc'
]

export const bash: LanguageDefinition = {
  name: 'bash',
  aliases: ['sh', 'shell', 'zsh', 'shell'],
  rules: [
    commonRules.lineCommentHash,
    commonRules.doubleString,
    commonRules.singleString,
    // Variables: $VAR, ${VAR}, $()
    rule('variable', '\\$\\{[A-Za-z_][\\w]*\\}'),
    rule('variable', '\\$[A-Za-z_][\\w]*'),
    rule('variable', '\\$\\('),
    rule('keyword', keywordList(bashKeywords)),
    rule('builtin', keywordList(bashBuiltins)),
    // Flag de comando: -f, --flag
    rule('property', '(?:^|\\s)(-{1,2}[A-Za-z][\\w-]*)'),
    commonRules.number,
    commonRules.operator,
    commonRules.punctuation,
    commonRules.identifier,
    commonRules.whitespace,
    rule('plain', '[^\\w\\s]')
  ]
}
