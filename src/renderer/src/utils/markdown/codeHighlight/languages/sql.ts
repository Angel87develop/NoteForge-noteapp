/* eslint-disable prettier/prettier */
import type { LanguageDefinition } from '../types'
import { commonRules, rule } from '../generic'

const sqlKeywords = [
  'SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET',
  'DELETE', 'CREATE', 'TABLE', 'ALTER', 'DROP', 'DATABASE', 'INDEX', 'VIEW',
  'JOIN', 'INNER', 'LEFT', 'RIGHT', 'OUTER', 'FULL', 'ON', 'AS', 'AND', 'OR',
  'NOT', 'NULL', 'IS', 'IN', 'BETWEEN', 'LIKE', 'ORDER', 'BY', 'GROUP',
  'HAVING', 'LIMIT', 'OFFSET', 'DISTINCT', 'UNION', 'ALL', 'PRIMARY', 'KEY',
  'FOREIGN', 'REFERENCES', 'DEFAULT', 'CONSTRAINT', 'UNIQUE', 'CHECK',
  'CASCADE', 'BEGIN', 'COMMIT', 'ROLLBACK', 'TRANSACTION', 'IF', 'EXISTS',
  'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'WITH', 'RETURNING'
]

const sqlTypes = [
  'INT', 'INTEGER', 'VARCHAR', 'TEXT', 'CHAR', 'BOOLEAN', 'BOOL', 'DATE',
  'DATETIME', 'TIMESTAMP', 'TIME', 'FLOAT', 'DOUBLE', 'DECIMAL', 'NUMERIC',
  'SERIAL', 'BIGINT', 'SMALLINT', 'JSON', 'JSONB', 'UUID', 'BLOB'
]

const sqlFunctions = [
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'COALESCE', 'NOW', 'CURRENT_TIMESTAMP',
  'UPPER', 'LOWER', 'LENGTH', 'SUBSTRING', 'TRIM', 'ROUND', 'CAST', 'EXTRACT'
]

export const sql: LanguageDefinition = {
  name: 'sql',
  aliases: ['mysql', 'postgres', 'postgresql', 'sqlite'],
  rules: [
    commonRules.lineCommentDash,
    commonRules.lineCommentHash,
    commonRules.doubleString,
    commonRules.singleString,
    // Identificadores con comillas invertidas/backticks: `tabla`
    rule('class-name', '`[^`]+`'),
    rule('keyword', `\\b(?:${sqlKeywords.join('|')})\\b`),
    rule('class-name', `\\b(?:${sqlTypes.join('|')})\\b`),
    rule('function', `\\b(?:${sqlFunctions.join('|')})(?=\\s*\\()`),
    rule('boolean', '\\b(?:TRUE|FALSE|NULL)\\b'),
    commonRules.number,
    commonRules.operator,
    commonRules.punctuation,
    rule('plain', '[A-Za-z_][\\w]*'),
    commonRules.whitespace,
    rule('plain', '[^\\w\\s]')
  ]
}
