/* eslint-disable prettier/prettier */
import type { LanguageDefinition } from '../types'
import { commonRules, functionCallRule, keywordList, rule } from '../generic'

const tsKeywords = [
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
  'do', 'break', 'continue', 'switch', 'case', 'default', 'try', 'catch',
  'finally', 'throw', 'new', 'delete', 'typeof', 'instanceof', 'in', 'of',
  'this', 'super', 'class', 'extends', 'static', 'get', 'set', 'async',
  'await', 'yield', 'import', 'export', 'from', 'as', 'void', 'debugger',
  'public', 'private', 'protected', 'readonly', 'abstract', 'interface',
  'type', 'enum', 'namespace', 'declare', 'implements', 'keyof', 'infer',
  'is', 'satisfies'
]

const tsBuiltins = [
  'console', 'Math', 'Object', 'Array', 'String', 'Number', 'Boolean',
  'Promise', 'JSON', 'Date', 'RegExp', 'Map', 'Set', 'Symbol', 'Error',
  'window', 'document', 'globalThis', 'module', 'require', 'process',
  'Record', 'Partial', 'Required', 'Readonly', 'Pick', 'Omit', 'Awaited',
  'Promise', 'Array', 'Tuple'
]

const tsTypes = [
  'string', 'number', 'boolean', 'void', 'never', 'unknown', 'any', 'object',
  'bigint', 'symbol', 'undefined', 'null'
]

export const typescript: LanguageDefinition = {
  name: 'typescript',
  aliases: ['ts', 'tsx'],
  rules: [
    commonRules.lineCommentSlash,
    commonRules.blockComment,
    commonRules.templateString,
    commonRules.doubleString,
    commonRules.singleString,
    rule('regex', '/(?:[^/\\\\]|\\\\.)+/[gimsuy]*'),
    rule('decorator', '@[A-Za-z_$][\\w$]*'),
    rule('keyword', keywordList(tsKeywords)),
    rule('class-name', keywordList(tsTypes)),
    rule('boolean', '\\b(?:true|false|null|undefined|NaN|Infinity)\\b'),
    rule('builtin', keywordList(tsBuiltins)),
    // Nombre de tipo tras `:` o `<` (TypeScript):  variable: Type
    rule('class-name', '(?:[:<>]\\s*)([A-Za-z_$][\\w$]*)'),
    functionCallRule(),
    rule('property', '\\.[A-Za-z_$][\\w$]*'),
    commonRules.number,
    commonRules.operator,
    commonRules.punctuation,
    commonRules.identifier,
    commonRules.whitespace,
    rule('plain', '[^\\w\\s]')
  ]
}
