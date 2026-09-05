/* eslint-disable prettier/prettier */
import type { LanguageDefinition } from '../types'
import { commonRules, functionCallRule, keywordList, rule } from '../generic'

const jsKeywords = [
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
  'do', 'break', 'continue', 'switch', 'case', 'default', 'try', 'catch',
  'finally', 'throw', 'new', 'delete', 'typeof', 'instanceof', 'in', 'of',
  'this', 'super', 'class', 'extends', 'static', 'get', 'set', 'async',
  'await', 'yield', 'import', 'export', 'from', 'as', 'void', 'debugger',
  'with'
]

const jsBuiltins = [
  'console', 'Math', 'Object', 'Array', 'String', 'Number', 'Boolean',
  'Promise', 'JSON', 'Date', 'RegExp', 'Map', 'Set', 'Symbol', 'Error',
  'window', 'document', 'globalThis', 'module', 'require', 'process',
  'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'setTimeout', 'setInterval'
]

export const javascript: LanguageDefinition = {
  name: 'javascript',
  aliases: ['js', 'jsx'],
  rules: [
    commonRules.lineCommentSlash,
    commonRules.blockComment,
    commonRules.templateString,
    commonRules.doubleString,
    commonRules.singleString,
    // Regex literal: /patron/flags
    rule('regex', '/(?:[^/\\\\]|\\\\.)+/[gimsuy]*'),
    rule('keyword', keywordList(jsKeywords)),
    rule('boolean', '\\b(?:true|false|null|undefined|NaN|Infinity)\\b'),
    rule('builtin', keywordList(jsBuiltins)),
    functionCallRule(),
    // Propiedad de objeto: .nombre
    rule('property', '\\.[A-Za-z_$][\\w$]*'),
    commonRules.number,
    commonRules.operator,
    commonRules.punctuation,
    commonRules.identifier,
    commonRules.whitespace,
    rule('plain', '[^\\w\\s]')
  ]
}
