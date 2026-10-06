import { useState, useRef, useCallback, useEffect } from 'react'
import type { RefObject } from 'react'

export type VimMode = 'normal' | 'insert' | 'visual' | 'command'

interface CaretPosition {
  line: number
  column: number
}

interface VimEditorOperations {
  editorRef: RefObject<HTMLDivElement | null>
  getContent: () => string
  getCaret: () => CaretPosition | null
  setCaret: (pos: CaretPosition) => void
  setContent: (content: string, caretPos?: CaretPosition) => void
  save: () => void
}

interface UseVimModeOptions {
  enabled: boolean
  ops: VimEditorOperations
}

interface UseVimModeResult {
  mode: VimMode
  commandBuffer: string
  statusMessage: string
  countPrefix: string
  pendingOperator: string
  handleKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => boolean
  resetToNormal: () => void
}

// ═══════════════════════════════════════════════════════════════════════════
// Helper functions for text/caret manipulation
// ═══════════════════════════════════════════════════════════════════════════

const isWordChar = (ch: string | null): boolean => {
  if (!ch) return false
  return /[\w]/.test(ch)
}

const isWhitespace = (ch: string | null): boolean => {
  if (!ch) return false
  return /\s/.test(ch)
}

const getCharAt = (lines: string[], pos: CaretPosition): string | null => {
  if (pos.line < 0 || pos.line >= lines.length) return null
  const line = lines[pos.line]
  if (pos.column < 0 || pos.column >= line.length) return null
  return line[pos.column]
}

const getLineLength = (lines: string[], line: number): number => {
  return lines[line]?.length ?? 0
}

const clampCaret = (lines: string[], pos: CaretPosition): CaretPosition => {
  const totalLines = Math.max(1, lines.length)
  const line = Math.min(Math.max(0, pos.line), totalLines - 1)
  const lineLen = getLineLength(lines, line)
  const column = Math.min(Math.max(0, pos.column), lineLen)
  return { line, column }
}

// Find the first non-blank character column on a line
const firstNonBlank = (lines: string[], line: number): number => {
  const text = lines[line] ?? ''
  const match = text.match(/^\s*/)
  return match ? match[0].length : 0
}

// Find next word start from current position (Vim 'w' motion)
const findNextWordStart = (lines: string[], start: CaretPosition): CaretPosition => {
  let { line, column } = start
  const totalLines = lines.length

  // Get current char type
  let curChar = getCharAt(lines, { line, column })
  // Skip current word
  if (curChar !== null) {
    if (isWordChar(curChar)) {
      while (
        column < getLineLength(lines, line) &&
        isWordChar(getCharAt(lines, { line, column }))
      ) {
        column++
      }
    } else if (!isWhitespace(curChar)) {
      while (
        column < getLineLength(lines, line) &&
        !isWordChar(getCharAt(lines, { line, column })) &&
        !isWhitespace(getCharAt(lines, { line, column }))
      ) {
        column++
      }
    }
  }

  // Skip whitespace, possibly crossing lines
  while (true) {
    if (line >= totalLines) {
      return { line: totalLines - 1, column: getLineLength(lines, totalLines - 1) }
    }
    curChar = getCharAt(lines, { line, column })
    if (curChar !== null && !isWhitespace(curChar)) {
      return { line, column }
    }
    column++
    if (column > getLineLength(lines, line)) {
      line++
      column = 0
    }
  }
}

// Find previous word start (Vim 'b' motion)
const findPrevWordStart = (lines: string[], start: CaretPosition): CaretPosition => {
  let { line, column } = start

  // Move back one
  column--
  if (column < 0) {
    line--
    if (line < 0) return { line: 0, column: 0 }
    column = getLineLength(lines, line)
  }

  // Skip whitespace backward
  while (true) {
    if (line < 0) return { line: 0, column: 0 }
    const ch = getCharAt(lines, { line, column })
    if (ch !== null && !isWhitespace(ch)) break
    column--
    if (column < 0) {
      line--
      if (line < 0) return { line: 0, column: 0 }
      column = getLineLength(lines, line)
    }
  }

  // Now at a non-whitespace char; find start of this word group
  const ch = getCharAt(lines, { line, column })!
  if (isWordChar(ch)) {
    while (column > 0 && isWordChar(getCharAt(lines, { line, column: column - 1 }))) {
      column--
    }
  } else {
    while (
      column > 0 &&
      !isWordChar(getCharAt(lines, { line, column: column - 1 })) &&
      !isWhitespace(getCharAt(lines, { line, column: column - 1 }))
    ) {
      column--
    }
  }
  return { line, column }
}

// Find end of word (Vim 'e' motion) - moves to last char of current/next word
const findEndOfWord = (lines: string[], start: CaretPosition): CaretPosition => {
  let { line, column } = start
  const totalLines = lines.length

  // Move forward one
  column++
  if (column > getLineLength(lines, line)) {
    line++
    column = 0
    if (line >= totalLines)
      return { line: totalLines - 1, column: Math.max(0, getLineLength(lines, totalLines - 1) - 1) }
  }

  // Skip whitespace forward
  while (true) {
    if (line >= totalLines)
      return { line: totalLines - 1, column: Math.max(0, getLineLength(lines, totalLines - 1) - 1) }
    const ch = getCharAt(lines, { line, column })
    if (ch !== null && !isWhitespace(ch)) break
    column++
    if (column > getLineLength(lines, line)) {
      line++
      column = 0
    }
  }

  // Now at start of a word; find end of this word group
  const ch = getCharAt(lines, { line, column })!
  if (isWordChar(ch)) {
    while (
      column + 1 < getLineLength(lines, line) &&
      isWordChar(getCharAt(lines, { line, column: column + 1 }))
    ) {
      column++
    }
  } else {
    while (
      column + 1 < getLineLength(lines, line) &&
      !isWordChar(getCharAt(lines, { line, column: column + 1 })) &&
      !isWhitespace(getCharAt(lines, { line, column: column + 1 }))
    ) {
      column++
    }
  }
  return { line, column }
}

// Find next paragraph boundary (Vim '}' motion)
const findNextParagraph = (lines: string[], start: CaretPosition): CaretPosition => {
  let line = start.line + 1
  while (line < lines.length) {
    if (lines[line].trim() === '') {
      // Skip to the last consecutive empty line
      while (line + 1 < lines.length && lines[line + 1].trim() === '') {
        line++
      }
      return { line: Math.min(line, lines.length - 1), column: 0 }
    }
    line++
  }
  return { line: lines.length - 1, column: 0 }
}

// Find previous paragraph boundary (Vim '{' motion)
const findPrevParagraph = (lines: string[], start: CaretPosition): CaretPosition => {
  let line = start.line - 1
  while (line >= 0) {
    if (lines[line].trim() === '') {
      while (line - 1 >= 0 && lines[line - 1].trim() === '') {
        line--
      }
      return { line: Math.max(0, line), column: 0 }
    }
    line--
  }
  return { line: 0, column: 0 }
}

// Get the text between two caret positions (inclusive of start, exclusive of end for charwise)
const getTextBetween = (lines: string[], start: CaretPosition, end: CaretPosition): string => {
  const sortedStart = comparePositions(start, end) <= 0 ? start : end
  const sortedEnd = comparePositions(start, end) <= 0 ? end : start

  if (sortedStart.line === sortedEnd.line) {
    return lines[sortedStart.line].slice(sortedStart.column, sortedEnd.column)
  }
  const parts: string[] = [lines[sortedStart.line].slice(sortedStart.column)]
  for (let i = sortedStart.line + 1; i < sortedEnd.line; i++) {
    parts.push(lines[i])
  }
  parts.push(lines[sortedEnd.line].slice(0, sortedEnd.column))
  return parts.join('\n')
}

const comparePositions = (a: CaretPosition, b: CaretPosition): number => {
  if (a.line !== b.line) return a.line - b.line
  return a.column - b.column
}

// Set a DOM selection range between two caret positions
const setSelectionFromPositions = (
  editor: HTMLElement,
  start: CaretPosition,
  end: CaretPosition
): void => {
  const lineDivs = editor.querySelectorAll('.md-line')
  if (lineDivs.length === 0) return

  const startIdx = Math.min(start.line, lineDivs.length - 1)
  const endIdx = Math.min(end.line, lineDivs.length - 1)
  const startDiv = lineDivs[startIdx]
  const endDiv = lineDivs[endIdx]

  const findTextNodeAt = (div: Element, column: number): { node: Text; offset: number } | null => {
    if (div.classList.contains('md-empty')) return null
    let remaining = Math.max(0, column)
    const walker = document.createTreeWalker(div, NodeFilter.SHOW_TEXT)
    let textNode: Node | null
    while ((textNode = walker.nextNode())) {
      const len = textNode.textContent?.length ?? 0
      if (remaining <= len) {
        return { node: textNode as Text, offset: remaining }
      }
      remaining -= len
    }
    return null
  }

  const range = document.createRange()
  const startTN = findTextNodeAt(startDiv, start.column)
  if (startTN) {
    range.setStart(startTN.node, startTN.offset)
  } else {
    range.selectNodeContents(startDiv)
    range.collapse(true)
  }
  const endTN = findTextNodeAt(endDiv, end.column)
  if (endTN) {
    range.setEnd(endTN.node, endTN.offset)
  } else {
    range.selectNodeContents(endDiv)
    range.collapse(false)
  }

  const sel = window.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(range)
}

// ═══════════════════════════════════════════════════════════════════════════
// Main hook
// ═══════════════════════════════════════════════════════════════════════════

export function useVimMode({ enabled, ops }: UseVimModeOptions): UseVimModeResult {
  const [mode, setMode] = useState<VimMode>('normal')
  const [commandBuffer, setCommandBuffer] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [countPrefix, setCountPrefix] = useState('')
  const [pendingOperator, setPendingOperator] = useState('')

  // Refs for internal state that doesn't need to trigger re-render
  const modeRef = useRef<VimMode>('normal')
  const countRef = useRef('')
  const operatorRef = useRef('')
  const registerRef = useRef<{ text: string; linewise: boolean }>({ text: '', linewise: false })
  const visualStartRef = useRef<CaretPosition | null>(null)
  const commandRef = useRef('')
  const gPendingRef = useRef(false) // for 'gg', 'g_'
  const zPendingRef = useRef(false) // for 'ZZ', 'ZQ'
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const setModeBoth = useCallback((m: VimMode) => {
    modeRef.current = m
    setMode(m)
  }, [])

  const clearPending = useCallback(() => {
    countRef.current = ''
    operatorRef.current = ''
    gPendingRef.current = false
    zPendingRef.current = false
    setCountPrefix('')
    setPendingOperator('')
  }, [])

  const showMessage = useCallback((msg: string) => {
    setStatusMessage(msg)
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current)
    statusTimerRef.current = setTimeout(() => setStatusMessage(''), 2000)
  }, [])

  const resetToNormal = useCallback(() => {
    setModeBoth('normal')
    clearPending()
    setCommandBuffer('')
    commandRef.current = ''
    visualStartRef.current = null
    // Clear any selection
    const sel = window.getSelection()
    sel?.removeAllRanges()
  }, [setModeBoth, clearPending])

  // Reset to normal mode when vim is disabled
  useEffect(() => {
    if (!enabled && modeRef.current !== 'normal') {
      const sel = window.getSelection()
      sel?.removeAllRanges()
      modeRef.current = 'normal'
      countRef.current = ''
      operatorRef.current = ''
      gPendingRef.current = false
      zPendingRef.current = false
      commandRef.current = ''
      visualStartRef.current = null
      // Defer state updates to avoid cascading renders within the effect
      const timer = setTimeout(() => {
        setMode('normal')
        setCountPrefix('')
        setPendingOperator('')
        setCommandBuffer('')
      }, 0)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [enabled])

  // Get count as number (default 1)
  const getCount = useCallback((): number => {
    const n = parseInt(countRef.current, 10)
    return isNaN(n) || n < 1 ? 1 : n
  }, [])

  // Move cursor and apply the movement
  const moveCaret = useCallback(
    (pos: CaretPosition): void => {
      const content = ops.getContent()
      const lines = content.split('\n')
      const clamped = clampCaret(lines, pos)
      ops.setCaret(clamped)
    },
    [ops]
  )

  // Get current lines array
  const getLines = useCallback((): string[] => {
    return ops.getContent().split('\n')
  }, [ops])

  // Update visual selection based on visualStart and current caret
  const updateVisualSelection = useCallback(
    (current: CaretPosition): void => {
      if (!visualStartRef.current) return
      const editor = ops.editorRef.current
      if (!editor) return

      const start = visualStartRef.current
      // For visual mode, selection is from start to current (inclusive)
      // If current is before start, swap them
      const sortedStart = comparePositions(start, current) <= 0 ? start : current
      const sortedEnd = comparePositions(start, current) <= 0 ? current : start
      // Extend end by 1 to include the character under the cursor
      const lines = getLines()
      const endLineLen = getLineLength(lines, sortedEnd.line)
      const extendedEnd =
        sortedEnd.column < endLineLen
          ? { line: sortedEnd.line, column: sortedEnd.column + 1 }
          : {
              line: sortedEnd.line + 1 < lines.length ? sortedEnd.line + 1 : sortedEnd.line,
              column: 0
            }

      setSelectionFromPositions(editor, sortedStart, extendedEnd)
    },
    [ops, getLines]
  )

  // ═══════════════════════════════════════════════════════════════════════════
  // Motion handlers - return target position
  // ═══════════════════════════════════════════════════════════════════════════

  const getMotionTarget = useCallback(
    (key: string, count: number, current: CaretPosition): CaretPosition | null => {
      const lines = getLines()
      let target: CaretPosition | null = null

      switch (key) {
        case 'h':
          target = { line: current.line, column: Math.max(0, current.column - count) }
          break
        case 'l':
          target = {
            line: current.line,
            column: Math.min(getLineLength(lines, current.line), current.column + count)
          }
          break
        case 'j':
          target = {
            line: Math.min(lines.length - 1, current.line + count),
            column: current.column
          }
          break
        case 'k':
          target = { line: Math.max(0, current.line - count), column: current.column }
          break
        case '0':
          target = { line: current.line, column: 0 }
          break
        case '^':
          target = { line: current.line, column: firstNonBlank(lines, current.line) }
          break
        case '$':
          target = { line: current.line, column: getLineLength(lines, current.line) }
          break
        case 'w': {
          let pos = current
          for (let i = 0; i < count; i++) pos = findNextWordStart(lines, pos)
          target = pos
          break
        }
        case 'b': {
          let pos = current
          for (let i = 0; i < count; i++) pos = findPrevWordStart(lines, pos)
          target = pos
          break
        }
        case 'e': {
          let pos = current
          for (let i = 0; i < count; i++) pos = findEndOfWord(lines, pos)
          target = pos
          break
        }
        case '{': {
          let pos = current
          for (let i = 0; i < count; i++) pos = findPrevParagraph(lines, pos)
          target = pos
          break
        }
        case '}': {
          let pos = current
          for (let i = 0; i < count; i++) pos = findNextParagraph(lines, pos)
          target = pos
          break
        }
        case 'G':
          target = { line: lines.length - 1, column: firstNonBlank(lines, lines.length - 1) }
          break
        default:
          return null
      }
      return target ? clampCaret(lines, target) : null
    },
    [getLines]
  )

  // ═══════════════════════════════════════════════════════════════════════════
  // Text operations
  // ═══════════════════════════════════════════════════════════════════════════

  // Local caretToOffset (matching the one in MarkdownEditor)
  const caretToOffsetLocal = useCallback((content: string, caret: CaretPosition): number => {
    const lines = content.split('\n')
    const lineIndex = Math.min(Math.max(caret.line, 0), lines.length - 1)
    let offset = 0
    for (let i = 0; i < lineIndex; i++) {
      offset += lines[i].length + 1
    }
    const lineText = lines[lineIndex] ?? ''
    return offset + Math.min(caret.column, lineText.length)
  }, [])

  const deleteRange = useCallback(
    (start: CaretPosition, end: CaretPosition, linewise: boolean): string => {
      const content = ops.getContent()
      const lines = content.split('\n')
      const sortedStart = comparePositions(start, end) <= 0 ? start : end
      const sortedEnd = comparePositions(start, end) <= 0 ? end : start

      let deleted: string
      let newContent: string

      if (linewise) {
        const startLine = sortedStart.line
        const endLine = sortedEnd.line
        const removedLines = lines.slice(startLine, endLine + 1)
        deleted = removedLines.join('\n')
        const remaining = [...lines.slice(0, startLine), ...lines.slice(endLine + 1)]
        newContent = remaining.join('\n')
      } else {
        deleted = getTextBetween(lines, sortedStart, sortedEnd)
        const offsetStart = caretToOffsetLocal(content, sortedStart)
        const offsetEnd = caretToOffsetLocal(content, sortedEnd)
        newContent = content.slice(0, offsetStart) + content.slice(offsetEnd)
      }

      ops.setContent(newContent)
      return deleted
    },
    [ops, caretToOffsetLocal]
  )

  // ═══════════════════════════════════════════════════════════════════════════
  // Normal mode key handler
  // ═══════════════════════════════════════════════════════════════════════════

  const handleNormalKey = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>): boolean => {
      const key = e.key
      const lowerKey = key.toLowerCase()
      const count = getCount()
      const currentCaret = ops.getCaret() ?? { line: 0, column: 0 }

      // Handle 'g' prefix (gg, g_)
      if (gPendingRef.current) {
        gPendingRef.current = false
        if (key === 'g') {
          const lines = getLines()
          const target = { line: 0, column: firstNonBlank(lines, 0) }
          for (let i = 1; i < count; i++) {
            target.line = Math.min(lines.length - 1, target.line + 1)
          }
          moveCaret(target)
          clearPending()
          return true
        }
        if (key === '_') {
          const lines = getLines()
          const lineText = lines[currentCaret.line] ?? ''
          const lastNonBlank = lineText.replace(/\s+$/, '').length
          moveCaret({ line: currentCaret.line, column: Math.max(0, lastNonBlank - 1) })
          clearPending()
          return true
        }
        // Unknown g-prefixed command
        clearPending()
        return true
      }

      // Handle 'Z' prefix (ZZ, ZQ)
      if (zPendingRef.current) {
        zPendingRef.current = false
        if (key === 'Z') {
          ops.save()
          showMessage('Saved (ZZ)')
          clearPending()
          return true
        }
        if (key === 'Q') {
          showMessage('ZQ - quit (no-op in note editor)')
          clearPending()
          return true
        }
        clearPending()
        return true
      }

      // Count prefix (digits 1-9 start a count, 0 is a motion unless after a count)
      if (/^[1-9]$/.test(key)) {
        countRef.current += key
        setCountPrefix(countRef.current)
        return true
      }
      if (key === '0' && countRef.current !== '') {
        countRef.current += key
        setCountPrefix(countRef.current)
        return true
      }

      // Operator pending: d, y, c
      if (operatorRef.current) {
        const op = operatorRef.current

        // Doubled operator = linewise (dd, yy, cc)
        if (key === op) {
          const lines = getLines()
          const startLine = currentCaret.line
          const endLine = Math.min(lines.length - 1, startLine + count - 1)
          const start = { line: startLine, column: 0 }
          const end = { line: endLine, column: getLineLength(lines, endLine) }

          if (op === 'd') {
            const deleted = deleteRange(start, end, true)
            registerRef.current = { text: deleted, linewise: true }
            // Move cursor to the line that replaced the deleted one
            const newLines = ops.getContent().split('\n')
            const newLine = Math.min(startLine, newLines.length - 1)
            moveCaret({ line: Math.max(0, newLine), column: 0 })
            showMessage(`${count} line${count > 1 ? 's' : ''} deleted`)
          } else if (op === 'y') {
            const text = getTextBetween(lines, start, {
              line: endLine,
              column: getLineLength(lines, endLine)
            })
            registerRef.current = {
              text: lines.slice(startLine, endLine + 1).join('\n'),
              linewise: true
            }
            void text
            showMessage(`${count} line${count > 1 ? 's' : ''} yanked`)
          } else if (op === 'c') {
            const deleted = deleteRange(start, end, true)
            registerRef.current = { text: deleted, linewise: true }
            // Insert an empty line in place
            const newContent = ops.getContent()
            const newLines = newContent.split('\n')
            newLines.splice(startLine, 0, '')
            ops.setContent(newLines.join('\n'), { line: startLine, column: 0 })
            setModeBoth('insert')
            showMessage('change line')
          }
          clearPending()
          return true
        }

        // Operator + motion
        const target = getMotionTarget(key, count, currentCaret)
        if (target) {
          const lines = getLines()

          if (op === 'd') {
            // For 'd' with motion like 'w', Vim deletes up to but not including the next word start
            // if the motion is 'w' and the word is not the last word. For simplicity, we delete
            // from current position to the motion target.
            let endPos = target
            // Special: 'dw' at end of line should delete to end of line, not into next line
            if (key === 'w' && target.line > currentCaret.line) {
              endPos = { line: currentCaret.line, column: getLineLength(lines, currentCaret.line) }
            }
            const deleted = deleteRange(currentCaret, endPos, false)
            registerRef.current = { text: deleted, linewise: false }
            // Move cursor to start of deleted range
            moveCaret(comparePositions(currentCaret, endPos) <= 0 ? currentCaret : endPos)
            showMessage('deleted')
          } else if (op === 'y') {
            const text = getTextBetween(lines, currentCaret, target)
            registerRef.current = { text, linewise: false }
            // Cursor stays at start of yanked range
            moveCaret(comparePositions(currentCaret, target) <= 0 ? currentCaret : target)
            showMessage('yanked')
          } else if (op === 'c') {
            const deleted = deleteRange(currentCaret, target, false)
            registerRef.current = { text: deleted, linewise: false }
            moveCaret(comparePositions(currentCaret, target) <= 0 ? currentCaret : target)
            setModeBoth('insert')
            showMessage('change')
          }
          clearPending()
          return true
        }

        // Operator + $ (special: d$, c$, y$ operate to end of line)
        if (key === '$') {
          const lines = getLines()
          const endPos = {
            line: currentCaret.line,
            column: getLineLength(lines, currentCaret.line)
          }
          if (op === 'd') {
            const deleted = deleteRange(currentCaret, endPos, false)
            registerRef.current = { text: deleted, linewise: false }
            moveCaret(currentCaret)
            showMessage('deleted to end of line')
          } else if (op === 'y') {
            const text = getTextBetween(lines, currentCaret, endPos)
            registerRef.current = { text, linewise: false }
            showMessage('yanked to end of line')
          } else if (op === 'c') {
            const deleted = deleteRange(currentCaret, endPos, false)
            registerRef.current = { text: deleted, linewise: false }
            moveCaret(currentCaret)
            setModeBoth('insert')
            showMessage('change to end of line')
          }
          clearPending()
          return true
        }

        // Unknown operator+key combination, cancel
        clearPending()
        return true
      }

      // ── Motions (no operator pending) ──────────────────────────────────────

      const motionTarget = getMotionTarget(key, count, currentCaret)
      if (motionTarget) {
        moveCaret(motionTarget)
        clearPending()
        return true
      }

      // ── g prefix ───────────────────────────────────────────────────────────
      if (key === 'g') {
        gPendingRef.current = true
        setPendingOperator('g')
        return true
      }

      // ── Z prefix ───────────────────────────────────────────────────────────
      if (key === 'Z') {
        zPendingRef.current = true
        setPendingOperator('Z')
        return true
      }

      // ── Enter: move to first non-blank of next line ────────────────────────
      if (key === 'Enter') {
        const lines = getLines()
        const target = {
          line: Math.min(lines.length - 1, currentCaret.line + count),
          column: 0
        }
        target.column = firstNonBlank(lines, target.line)
        moveCaret(target)
        clearPending()
        return true
      }

      // ── Insert mode entries ────────────────────────────────────────────────

      if (key === 'i') {
        setModeBoth('insert')
        clearPending()
        return true
      }

      if (key === 'a') {
        const lines = getLines()
        const newCol = Math.min(getLineLength(lines, currentCaret.line), currentCaret.column + 1)
        moveCaret({ line: currentCaret.line, column: newCol })
        setModeBoth('insert')
        clearPending()
        return true
      }

      if (key === 'A') {
        const lines = getLines()
        moveCaret({ line: currentCaret.line, column: getLineLength(lines, currentCaret.line) })
        setModeBoth('insert')
        clearPending()
        return true
      }

      if (key === 'I') {
        const lines = getLines()
        moveCaret({ line: currentCaret.line, column: firstNonBlank(lines, currentCaret.line) })
        setModeBoth('insert')
        clearPending()
        return true
      }

      if (key === 'o') {
        // Open new line below
        const content = ops.getContent()
        const lines = content.split('\n')
        const offset = caretToOffsetLocal(content, {
          line: currentCaret.line,
          column: getLineLength(lines, currentCaret.line)
        })
        const newContent = content.slice(0, offset + 1) + content.slice(offset + 1)
        ops.setContent(newContent, { line: currentCaret.line + 1, column: 0 })
        setModeBoth('insert')
        clearPending()
        return true
      }

      if (key === 'O') {
        // Open new line above
        const content = ops.getContent()
        const offset = caretToOffsetLocal(content, { line: currentCaret.line, column: 0 })
        const newContent = content.slice(0, offset) + '\n' + content.slice(offset)
        ops.setContent(newContent, { line: currentCaret.line, column: 0 })
        setModeBoth('insert')
        clearPending()
        return true
      }

      // ── Delete commands ────────────────────────────────────────────────────

      if (key === 'x') {
        const lines = getLines()
        const lineLen = getLineLength(lines, currentCaret.line)
        if (lineLen === 0) {
          clearPending()
          return true
        }
        const endCol = Math.min(lineLen, currentCaret.column + count)
        const deleted = lines[currentCaret.line].slice(currentCaret.column, endCol)
        registerRef.current = { text: deleted, linewise: false }
        deleteRange(currentCaret, { line: currentCaret.line, column: endCol }, false)
        // Adjust cursor if at end of line
        const newLines = getLines()
        const newLineLen = getLineLength(newLines, currentCaret.line)
        moveCaret({
          line: currentCaret.line,
          column: Math.min(currentCaret.column, Math.max(0, newLineLen - 1))
        })
        showMessage(`${count} character${count > 1 ? 's' : ''} deleted`)
        clearPending()
        return true
      }

      if (key === 'D') {
        const lines = getLines()
        const endPos = { line: currentCaret.line, column: getLineLength(lines, currentCaret.line) }
        const deleted = deleteRange(currentCaret, endPos, false)
        registerRef.current = { text: deleted, linewise: false }
        moveCaret(currentCaret)
        showMessage('deleted to end of line')
        clearPending()
        return true
      }

      if (key === 'C') {
        const lines = getLines()
        const endPos = { line: currentCaret.line, column: getLineLength(lines, currentCaret.line) }
        const deleted = deleteRange(currentCaret, endPos, false)
        registerRef.current = { text: deleted, linewise: false }
        moveCaret(currentCaret)
        setModeBoth('insert')
        showMessage('change to end of line')
        clearPending()
        return true
      }

      // ── Operators ──────────────────────────────────────────────────────────
      if (key === 'd' || key === 'y' || key === 'c') {
        operatorRef.current = key
        setPendingOperator(key + (countRef.current ? countRef.current : ''))
        return true
      }

      // ── Paste ──────────────────────────────────────────────────────────────
      if (key === 'p') {
        const reg = registerRef.current
        if (!reg.text) {
          clearPending()
          return true
        }
        const content = ops.getContent()
        const lines = content.split('\n')
        if (reg.linewise) {
          // Insert lines below current line
          const insertLine = Math.min(currentCaret.line + 1, lines.length)
          const regLines = reg.text.split('\n')
          const newLines = [...lines.slice(0, insertLine), ...regLines, ...lines.slice(insertLine)]
          ops.setContent(newLines.join('\n'), { line: insertLine, column: 0 })
          showMessage('pasted')
        } else {
          // Insert text after current character
          const lineLen = getLineLength(lines, currentCaret.line)
          const insertCol = Math.min(currentCaret.column + 1, lineLen)
          if (currentCaret.line >= lines.length) {
            // Edge case: empty file
            ops.setContent(reg.text, { line: 0, column: reg.text.length })
          } else {
            const lineText = lines[currentCaret.line]
            const newLine = lineText.slice(0, insertCol) + reg.text + lineText.slice(insertCol)
            const newLines = [...lines]
            newLines[currentCaret.line] = newLine
            ops.setContent(newLines.join('\n'), {
              line: currentCaret.line,
              column: insertCol + reg.text.length - 1
            })
          }
          showMessage('pasted')
        }
        clearPending()
        return true
      }

      if (key === 'P') {
        const reg = registerRef.current
        if (!reg.text) {
          clearPending()
          return true
        }
        const content = ops.getContent()
        const lines = content.split('\n')
        if (reg.linewise) {
          // Insert lines above current line
          const insertLine = currentCaret.line
          const regLines = reg.text.split('\n')
          const newLines = [...lines.slice(0, insertLine), ...regLines, ...lines.slice(insertLine)]
          ops.setContent(newLines.join('\n'), { line: insertLine, column: 0 })
          showMessage('pasted')
        } else {
          // Insert text before current character
          const insertCol = currentCaret.column
          const lineText = lines[currentCaret.line] ?? ''
          const newLine = lineText.slice(0, insertCol) + reg.text + lineText.slice(insertCol)
          const newLines = [...lines]
          newLines[currentCaret.line] = newLine
          ops.setContent(newLines.join('\n'), {
            line: currentCaret.line,
            column: insertCol + reg.text.length - 1
          })
          showMessage('pasted')
        }
        clearPending()
        return true
      }

      // ── Undo / Redo ────────────────────────────────────────────────────────
      if (key === 'u') {
        window.dispatchEvent(new CustomEvent('vim-undo'))
        for (let i = 1; i < count; i++) {
          window.dispatchEvent(new CustomEvent('vim-undo'))
        }
        showMessage('undo')
        clearPending()
        return true
      }

      if (e.ctrlKey && lowerKey === 'r') {
        window.dispatchEvent(new CustomEvent('vim-redo'))
        for (let i = 1; i < count; i++) {
          window.dispatchEvent(new CustomEvent('vim-redo'))
        }
        showMessage('redo')
        clearPending()
        return true
      }

      // ── Visual mode ────────────────────────────────────────────────────────
      if (key === 'v') {
        visualStartRef.current = currentCaret
        setModeBoth('visual')
        clearPending()
        return true
      }

      if (key === 'V') {
        visualStartRef.current = { line: currentCaret.line, column: 0 }
        setModeBoth('visual')
        // Select current line
        const lines = getLines()
        const endCol = getLineLength(lines, currentCaret.line)
        setSelectionFromPositions(
          ops.editorRef.current!,
          { line: currentCaret.line, column: 0 },
          { line: currentCaret.line, column: endCol }
        )
        clearPending()
        return true
      }

      // ── Command mode ───────────────────────────────────────────────────────
      if (key === ':') {
        setModeBoth('command')
        commandRef.current = ''
        setCommandBuffer('')
        clearPending()
        return true
      }

      // ── Escape ─────────────────────────────────────────────────────────────
      if (key === 'Escape') {
        clearPending()
        return true
      }

      // Unknown key in normal mode — swallow it (don't let it insert text)
      clearPending()
      return true
    },
    [
      ops,
      getCount,
      getLines,
      moveCaret,
      clearPending,
      setModeBoth,
      deleteRange,
      caretToOffsetLocal,
      getMotionTarget,
      showMessage
    ]
  )

  // ═══════════════════════════════════════════════════════════════════════════
  // Visual mode key handler
  // ═══════════════════════════════════════════════════════════════════════════

  const handleVisualKey = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>): boolean => {
      const key = e.key
      const count = getCount()
      const currentCaret = ops.getCaret() ?? { line: 0, column: 0 }

      // Escape — back to normal
      if (key === 'Escape') {
        resetToNormal()
        return true
      }

      // Movements — extend selection
      const motionTarget = getMotionTarget(key, count, currentCaret)
      if (motionTarget) {
        moveCaret(motionTarget)
        // Update selection with new caret position
        requestAnimationFrame(() => {
          const newCaret = ops.getCaret()
          if (newCaret) updateVisualSelection(newCaret)
        })
        clearPending()
        return true
      }

      // g prefix
      if (key === 'g') {
        gPendingRef.current = true
        setPendingOperator('g')
        return true
      }

      if (gPendingRef.current) {
        gPendingRef.current = false
        if (key === 'g') {
          moveCaret({ line: 0, column: 0 })
          requestAnimationFrame(() => {
            const newCaret = ops.getCaret()
            if (newCaret) updateVisualSelection(newCaret)
          })
          clearPending()
          return true
        }
        clearPending()
        return true
      }

      // Count prefix
      if (/^[1-9]$/.test(key)) {
        countRef.current += key
        setCountPrefix(countRef.current)
        return true
      }

      // Operations on selection
      if (key === 'y' || key === 'd' || key === 'x' || key === 'c') {
        if (!visualStartRef.current) {
          resetToNormal()
          return true
        }
        const start = visualStartRef.current
        const end = currentCaret
        const lines = getLines()

        // For charwise visual, include the character under the cursor
        const endInclusive = {
          line: end.line,
          column: Math.min(getLineLength(lines, end.line), end.column + 1)
        }

        const sortedStart = comparePositions(start, end) <= 0 ? start : endInclusive
        const sortedEnd = comparePositions(start, end) <= 0 ? endInclusive : start

        const text = getTextBetween(lines, sortedStart, sortedEnd)
        registerRef.current = { text, linewise: false }

        if (key === 'y') {
          // Yank — don't delete, just copy. Move cursor to start of selection.
          moveCaret(sortedStart)
          showMessage('yanked')
        } else {
          // Delete or change
          deleteRange(sortedStart, sortedEnd, false)
          if (key === 'c') {
            setModeBoth('insert')
            showMessage('changed')
          } else {
            showMessage('deleted')
          }
        }
        resetToNormal()
        return true
      }

      // Switch between visual and visual-line
      if (key === 'v' || key === 'V') {
        // Toggle visual mode type — for simplicity, just go back to normal
        resetToNormal()
        return true
      }

      // Unknown key — swallow
      clearPending()
      return true
    },
    [
      ops,
      getCount,
      getLines,
      moveCaret,
      clearPending,
      deleteRange,
      getMotionTarget,
      resetToNormal,
      setModeBoth,
      updateVisualSelection,
      showMessage
    ]
  )

  // ═══════════════════════════════════════════════════════════════════════════
  // Command mode key handler
  // ═══════════════════════════════════════════════════════════════════════════

  const handleCommandKey = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>): boolean => {
      const key = e.key

      if (key === 'Escape') {
        resetToNormal()
        return true
      }

      if (key === 'Enter') {
        const cmd = commandRef.current.trim()
        if (cmd === 'w' || cmd === 'write') {
          ops.save()
          showMessage('Saved')
        } else if (cmd === 'q' || cmd === 'quit') {
          showMessage('Use Ctrl+W to close note')
        } else if (cmd === 'wq' || cmd === 'x') {
          ops.save()
          showMessage('Saved')
        } else if (cmd === 'q!' || cmd === 'q') {
          // no-op
        } else if (cmd === 'h' || cmd === 'help') {
          showMessage('Vim mode: i/a/o to insert, Esc to normal, :w to save')
        } else if (cmd === '') {
          // empty command
        } else {
          showMessage(`Unknown command: :${cmd}`)
        }
        resetToNormal()
        return true
      }

      if (key === 'Backspace') {
        commandRef.current = commandRef.current.slice(0, -1)
        setCommandBuffer(commandRef.current)
        if (commandRef.current === '') {
          resetToNormal()
        }
        return true
      }

      // Add printable characters to command buffer
      if (key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        commandRef.current += key
        setCommandBuffer(commandRef.current)
        return true
      }

      // Swallow everything else
      return true
    },
    [ops, resetToNormal, showMessage]
  )

  // ═══════════════════════════════════════════════════════════════════════════
  // Insert mode key handler
  // ═══════════════════════════════════════════════════════════════════════════

  const handleInsertKey = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>): boolean => {
      const key = e.key

      // Escape or Ctrl+[ — back to normal mode (cursor moves left by 1, like Vim)
      if (key === 'Escape' || (e.ctrlKey && key === '[')) {
        const caret = ops.getCaret()
        if (caret) {
          const newCol = Math.max(0, caret.column - 1)
          moveCaret({ line: caret.line, column: newCol })
        }
        setModeBoth('normal')
        clearPending()
        return true
      }

      // Ctrl+R — redo
      if (e.ctrlKey && key.toLowerCase() === 'r') {
        window.dispatchEvent(new CustomEvent('vim-redo'))
        return true
      }

      // All other keys in insert mode are handled by the normal editor (typing, Enter, Tab, etc.)
      // Return false so the caller lets them pass through
      return false
    },
    [ops, moveCaret, setModeBoth, clearPending]
  )

  // ═══════════════════════════════════════════════════════════════════════════
  // Main key handler dispatcher
  // ═══════════════════════════════════════════════════════════════════════════

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>): boolean => {
      if (!enabled) return false

      const currentMode = modeRef.current

      switch (currentMode) {
        case 'normal':
          return handleNormalKey(e)
        case 'visual':
          return handleVisualKey(e)
        case 'command':
          return handleCommandKey(e)
        case 'insert':
          return handleInsertKey(e)
        default:
          return false
      }
    },
    [enabled, handleNormalKey, handleVisualKey, handleCommandKey, handleInsertKey]
  )

  return {
    mode,
    commandBuffer,
    statusMessage,
    countPrefix,
    pendingOperator,
    handleKeyDown,
    resetToNormal
  }
}
