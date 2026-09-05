/* eslint-disable prettier/prettier */
import type { LanguageDefinition } from '../types'
import { commonRules, functionCallRule, keywordList, rule } from '../generic'

const pythonKeywords = [
  'def', 'class', 'import', 'from', 'as', 'return', 'if', 'elif', 'else',
  'for', 'while', 'break', 'continue', 'pass', 'try', 'except', 'finally',
  'raise', 'with', 'yield', 'lambda', 'global', 'nonlocal', 'assert', 'del',
  'in', 'is', 'not', 'and', 'or', 'await', 'async'
]

const pythonBuiltins = [
  'print', 'len', 'range', 'str', 'int', 'float', 'list', 'dict', 'tuple',
  'set', 'bool', 'input', 'open', 'type', 'isinstance', 'enumerate', 'zip',
  'map', 'filter', 'sorted', 'sum', 'min', 'max', 'abs', 'round', 'format',
  'super', 'getattr', 'setattr', 'hasattr', 'self'
]

export const python: LanguageDefinition = {
  name: 'python',
  aliases: ['py'],
  rules: [
    commonRules.lineCommentHash,
    // Strings triples (multilínea): """...""" y '''...'''
    rule('string', '"""[\\s\\S]*?"""'),
    rule('string', "'''[\\s\\S]*?'''"),
    commonRules.doubleString,
    commonRules.singleString,
    // f-strings y prefijos: f"...", r'...', b"..."
    rule('string', '[frbFRB]?"(?:[^"\\\\]|\\\\.)*"'),
    rule('string', "[frbFRB]?'(?:[^'\\\\]|\\\\.)*'"),
    // Decoradores: @nombre
    rule('decorator', '@[A-Za-z_][\\w.]*'),
    rule('keyword', keywordList(pythonKeywords)),
    rule('boolean', '\\b(?:True|False|None)\\b'),
    rule('builtin', keywordList(pythonBuiltins)),
    functionCallRule(),
    commonRules.number,
    commonRules.operator,
    commonRules.punctuation,
    commonRules.identifier,
    commonRules.whitespace,
    rule('plain', '[^\\w\\s]')
  ]
}
