/* eslint-disable @typescript-eslint/explicit-function-return-type */
import React, { useRef, useEffect, useCallback, useMemo } from 'react'
import { sanitizeContent } from '../../utils/markdownUtils'
import { highlightCode } from '../../utils/markdown/codeHighlight'
import { useVimMode } from '../../hooks/useVimMode'
import './markdownEditor.css'

type MarkdownEditorVariant = 'source' | 'preview'

interface CommitOptions {
  commit?: boolean
}

interface MarkdownEditorProps {
  content: string
  onContentChange: (content: string, options?: CommitOptions) => void
  onSave: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
  variant?: MarkdownEditorVariant
  editorClassName?: string
  vimEnabled?: boolean
}

const hidden = (text: string, preview: boolean): string =>
  preview ? `<span class="md-syntax-hidden">${text}</span>` : text

const processInlineFormatting = (line: string, preview: boolean): string => {
  const escapeHtml = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')

  let processedLine = escapeHtml(line)

  // Matemáticas inline: $...$ (no $$ ... $$ que es block)
  processedLine = processedLine.replace(
    /(?<!\$)\$(?!\$)((?:[^$\\]|\\.)+?)\$(?!\$)/g,
    (_match, inner) => {
      const escaped = inner
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
      return `<span class="md-math-inline">${hidden('$', preview)}${escapeHtml(escaped)}${hidden('$', preview)}</span>`
    }
  )

  processedLine = processedLine.replace(/`([^`]+)`/g, (_match, inner) =>
    preview
      ? `<span class="md-code">${hidden('`', preview)}${inner}${hidden('`', preview)}</span>`
      : `<span class="md-code">\`${inner}\`</span>`
  )

  processedLine = processedLine.replace(/\*\*([^*]+)\*\*/g, (_match, inner) =>
    preview
      ? `<span class="md-bold">${hidden('**', preview)}${inner}${hidden('**', preview)}</span>`
      : `<span class="md-bold">**${inner}**</span>`
  )

  processedLine = processedLine.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, (_match, inner) =>
    preview
      ? `<span class="md-italic">${hidden('*', preview)}${inner}${hidden('*', preview)}</span>`
      : `<span class="md-italic">*${inner}*</span>`
  )

  return processedLine
}

// Renderizar HTML embebido: escapar pero estilizar las etiquetas para distinguirlas
const renderEmbeddedHtml = (line: string): string | null => {
  const escapeHtml = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')

  // Detectar si la línea es principalmente HTML (empieza con <tag o </tag)
  if (!/^\s*<\w+[\s/>]/.test(line) && !/^\s*<\/\w+>/.test(line)) {
    return null
  }

  // Resaltar nombres de etiquetas y atributos
  const escaped = escapeHtml(line)
  const styled = escaped
    .replace(/(&lt;\/?)([\w-]+)/g, '$1<span class="md-html-tagname">$2</span>')
    .replace(
      /([\w-]+)(=)(&quot;.*?&quot;)/g,
      '<span class="md-html-attr">$1</span>$2<span class="md-html-attrval">$3</span>'
    )
  return `<div class="md-line md-html-line">${styled}</div>`
}

// Función para renderizar el contenido con estilos inline
const renderContentWithStyles = (
  text: string,
  variant: MarkdownEditorVariant = 'source'
): string => {
  const preview = variant === 'preview'
  if (!text) return '<div class="md-line md-empty"><br></div>'

  const lines = text.split('\n')
  const htmlLines: string[] = []
  let inCodeBlock = false
  let codeBlockLanguage = ''
  let inMathBlock = false

  const codeFenceRegex = /^```\s*([\w-]*)$/
  const mathBlockOpenRegex = /^\$\$\s*$/
  const mathBlockInlineRegex = /^\$\$(.+)\$\$$/

  const escapeHtml = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  for (const line of lines) {
    // Bloque de matemáticas $$ ... $$ (block)
    if (!inCodeBlock) {
      // $$ contenido $$ en una sola línea
      const inlineMathBlock = line.match(mathBlockInlineRegex)
      if (inlineMathBlock) {
        const mathContent = inlineMathBlock[1]
        htmlLines.push(
          `<div class="md-line md-math-block">${hidden('$$', preview)}${escapeHtml(mathContent)}${hidden('$$', preview)}</div>`
        )
        continue
      }
      // Apertura de bloque $$ ... $$ multilínea
      if (mathBlockOpenRegex.test(line)) {
        if (inMathBlock) {
          inMathBlock = false
          htmlLines.push('<div class="md-line md-math-block">' + hidden('$$', preview) + '</div>')
        } else {
          inMathBlock = true
          htmlLines.push('<div class="md-line md-math-block">' + hidden('$$', preview) + '</div>')
        }
        continue
      }
      if (inMathBlock) {
        htmlLines.push(`<div class="md-line md-math-block-content">${escapeHtml(line)}</div>`)
        continue
      }
    }

    // Detectar fences de code block (```)
    const fenceMatch = line.match(codeFenceRegex)
    if (fenceMatch) {
      if (inCodeBlock) {
        // Cerrar code block
        inCodeBlock = false
        codeBlockLanguage = ''
        if (preview) {
          htmlLines.push('<div class="md-line md-code-fence">' + hidden('```', preview) + '</div>')
        } else {
          htmlLines.push(
            '<div class="md-line md-code-fence"><span class="md-code-fence-marker">```</span></div>'
          )
        }
      } else {
        // Abrir code block y capturar lenguaje
        inCodeBlock = true
        codeBlockLanguage = fenceMatch[1] || ''
        if (preview) {
          const fenceText = '```' + (codeBlockLanguage ? ' ' + codeBlockLanguage : '')
          htmlLines.push(
            '<div class="md-line md-code-fence">' + hidden(fenceText, preview) + '</div>'
          )
        } else {
          const langInline = codeBlockLanguage
            ? `<span class="md-code-lang-inline">${escapeHtml(codeBlockLanguage)}</span>`
            : ''
          htmlLines.push(
            '<div class="md-line md-code-fence"><span class="md-code-fence-marker">```</span>' +
              langInline +
              '</div>'
          )
        }
      }
      continue
    }

    // Línea dentro de un code block: resaltar sintaxis
    if (inCodeBlock) {
      if (line === '') {
        htmlLines.push('<div class="md-line md-code-line"><br></div>')
      } else {
        const highlighted = codeBlockLanguage
          ? highlightCode(line, codeBlockLanguage)
          : escapeHtml(line)
        htmlLines.push(`<div class="md-line md-code-line">${highlighted}</div>`)
      }
      continue
    }

    // Línea vacía
    if (line === '') {
      htmlLines.push('<div class="md-line md-empty"><br></div>')
      continue
    }

    // Detectar HTML embebido (línea que comienza con <tag)
    const htmlLine = renderEmbeddedHtml(line)
    if (htmlLine) {
      htmlLines.push(htmlLine)
      continue
    }

    // Detectar títulos (h1-h6)
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const headingContent = headingMatch[2]
      const prefix = `${headingMatch[1]} `
      if (preview) {
        htmlLines.push(
          '<div class="md-line md-h' +
            level +
            '">' +
            hidden(prefix, preview) +
            processInlineFormatting(headingContent, preview) +
            '</div>'
        )
      } else {
        htmlLines.push(
          '<div class="md-line md-h' +
            level +
            '"><span class="md-hash">' +
            headingMatch[1] +
            '</span> ' +
            escapeHtml(headingContent) +
            '</div>'
        )
      }
      continue
    }

    // Detectar listas no ordenadas
    const ulMatch = line.match(/^(\s*)([-*+])\s+(.*)$/)
    if (ulMatch) {
      const indent = ulMatch[1]
      const marker = ulMatch[2]
      const listContent = ulMatch[3]
      if (preview) {
        htmlLines.push(
          `<div class="md-line md-list md-list-ul">${escapeHtml(indent)}${hidden(`${marker} `, preview)}${processInlineFormatting(listContent, preview)}</div>`
        )
      } else {
        htmlLines.push(
          `<div class="md-line md-list">${escapeHtml(indent)}<span class="md-marker">${marker}</span> ${escapeHtml(listContent)}</div>`
        )
      }
      continue
    }

    // Detectar listas ordenadas
    const olMatch = line.match(/^(\s*)(\d+\.)\s+(.*)$/)
    if (olMatch) {
      const indent = olMatch[1]
      const marker = olMatch[2]
      const listContent = olMatch[3]
      if (preview) {
        htmlLines.push(
          `<div class="md-line md-list md-list-ol">${escapeHtml(indent)}${hidden(`${marker} `, preview)}${processInlineFormatting(listContent, preview)}</div>`
        )
      } else {
        htmlLines.push(
          `<div class="md-line md-list">${escapeHtml(indent)}<span class="md-marker">${marker}</span> ${escapeHtml(listContent)}</div>`
        )
      }
      continue
    }

    // Detectar blockquotes
    const blockquoteMatch = line.match(/^>\s*(.*)$/)
    if (blockquoteMatch) {
      const quoteContent = blockquoteMatch[1]
      if (preview) {
        htmlLines.push(
          `<div class="md-line md-blockquote">${hidden('> ', preview)}${processInlineFormatting(quoteContent, preview)}</div>`
        )
      } else {
        htmlLines.push(
          `<div class="md-line md-blockquote"><span class="md-quote-marker">&gt;</span> ${escapeHtml(quoteContent)}</div>`
        )
      }
      continue
    }

    // Línea normal
    htmlLines.push('<div class="md-line">' + processInlineFormatting(line, preview) + '</div>')
  }

  return htmlLines.join('')
}

const findFirstTextNode = (node: Node): Text | null => {
  if (node.nodeType === Node.TEXT_NODE) {
    return node as Text
  }
  for (const child of Array.from(node.childNodes)) {
    const found = findFirstTextNode(child)
    if (found) return found
  }
  return null
}

const findLastTextNode = (node: Node): Text | null => {
  if (node.nodeType === Node.TEXT_NODE) {
    return node as Text
  }
  const children = Array.from(node.childNodes)
  for (let i = children.length - 1; i >= 0; i--) {
    const found = findLastTextNode(children[i])
    if (found) return found
  }
  return null
}

// Posición del cursor expresada como línea + columna de texto plano.
// Esto es robusto frente al re-renderizado del HTML del editor (que envuelve
// sintaxis markdown en spans), a diferencia de un offset absoluto de caracteres.
interface CaretPosition {
  line: number
  column: number
}

const setRangeAtLineStart = (range: Range, lineDiv: Element): void => {
  if (lineDiv.classList.contains('md-empty')) {
    range.selectNodeContents(lineDiv)
    range.collapse(true)
    return
  }

  const textNode = findFirstTextNode(lineDiv)
  if (textNode) {
    range.setStart(textNode, 0)
    range.collapse(true)
    return
  }

  const text = document.createTextNode('')
  lineDiv.insertBefore(text, lineDiv.firstChild)
  range.setStart(text, 0)
  range.collapse(true)
}

const setRangeAtLineEnd = (range: Range, lineDiv: Element): void => {
  if (lineDiv.classList.contains('md-empty')) {
    range.selectNodeContents(lineDiv)
    range.collapse(false)
    return
  }

  const textNode = findLastTextNode(lineDiv)
  if (textNode) {
    const length = textNode.textContent?.length || 0
    range.setStart(textNode, length)
    range.collapse(true)
    return
  }

  setRangeAtLineStart(range, lineDiv)
}

// Coloca el cursor (range colapsado) en la `column` de texto plano dentro de
// `lineDiv`. Recorre los nodos de texto de la línea acumulando caracteres.
const setCaretInLine = (range: Range, lineDiv: Element, column: number): void => {
  // Línea vacía: el único lugar válido es el inicio.
  if (lineDiv.classList.contains('md-empty')) {
    range.selectNodeContents(lineDiv)
    range.collapse(true)
    return
  }

  let remaining = Math.max(0, column)
  const walker = document.createTreeWalker(lineDiv, NodeFilter.SHOW_TEXT)
  let textNode: Node | null
  while ((textNode = walker.nextNode())) {
    const len = textNode.textContent?.length || 0
    if (remaining <= len) {
      range.setStart(textNode, remaining)
      range.collapse(true)
      return
    }
    remaining -= len
  }

  // Si la columna excede el contenido, colocar al final de la línea.
  setRangeAtLineEnd(range, lineDiv)
}

// Convierte una posición { line, column } a offset absoluto de texto plano.
const caretToOffset = (content: string, caret: CaretPosition): number => {
  const lines = content.split('\n')
  const lineIndex = Math.min(Math.max(caret.line, 0), lines.length - 1)
  let offset = 0
  for (let i = 0; i < lineIndex; i++) {
    offset += lines[i].length + 1 // +1 por el salto de línea
  }
  const lineText = lines[lineIndex] ?? ''
  return offset + Math.min(caret.column, lineText.length)
}

// Devuelve la posición del cursor al final del documento (última línea).
const caretFromEnd = (content: string): CaretPosition => {
  if (content.length === 0) return { line: 0, column: 0 }
  const lines = content.split('\n')
  return { line: lines.length - 1, column: lines[lines.length - 1].length }
}

// Función para extraer texto plano del HTML
const extractTextFromHtml = (element: HTMLElement): string => {
  const lines: string[] = []
  const divs = element.querySelectorAll('.md-line')

  if (divs.length === 0) {
    // Si no hay divs con clase md-line, obtener el texto directamente
    return element.innerText || element.textContent || ''
  }

  divs.forEach((div) => {
    const text = div.textContent || ''
    lines.push(text)
  })

  return lines.join('\n')
}

export default function MarkdownEditor({
  content,
  onContentChange,
  onSave,
  onKeyDown,
  variant = 'source',
  editorClassName,
  vimEnabled = false
}: MarkdownEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const isUpdatingRef = useRef(false)
  const isComposingRef = useRef(false)
  const lastContentRef = useRef(content)

  // Guardar posición del cursor como { line, column } (en lugar de offset
  // absoluto de caracteres). Usar offset absoluto es lo que provocaba que el
  // cursor saltara a la línea equivocada tras un undo: el renderizado del
  // markdown puede envolver sintaxis (**) en spans que alteran el conteo de
  // caracteres del DOM respecto al texto plano, y la posición guardada ya no
  // mapeaba al mismo sitio. Con { line, column } el mapeo es estable.
  const saveCaretPosition = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0 || !editorRef.current) return null

    const range = selection.getRangeAt(0)
    if (!editorRef.current.contains(range.startContainer)) return null

    // Buscar el div.md-line ancestro (o contenido) del startContainer
    const findLineDiv = (node: Node | null): Element | null => {
      let current: Node | null = node
      while (current && current !== editorRef.current) {
        if (
          current.nodeType === Node.ELEMENT_NODE &&
          (current as Element).classList?.contains('md-line')
        ) {
          return current as Element
        }
        current = current.parentNode
      }
      return null
    }

    const lineDiv = findLineDiv(range.startContainer)
    if (!lineDiv) return { line: 0, column: 0 }

    // Índice de la línea dentro del editor
    const allLines = editorRef.current.querySelectorAll('.md-line')
    let lineIndex = -1
    for (let i = 0; i < allLines.length; i++) {
      if (allLines[i] === lineDiv) {
        lineIndex = i
        break
      }
    }
    if (lineIndex === -1) return { line: 0, column: 0 }

    // Columna = número de caracteres de texto plano desde el inicio de la
    // línea hasta el cursor. La forma más robusta de calcularla es crear un
    // rango desde el inicio de la línea hasta el cursor y medir su texto.
    const lineRange = document.createRange()
    lineRange.selectNodeContents(lineDiv)
    lineRange.setEnd(range.startContainer, range.startOffset)
    const column = lineRange.toString().length

    return { line: lineIndex, column }
  }, [])

  // Restaurar posición del cursor desde { line, column }
  const restoreCaretPosition = useCallback((position: CaretPosition | null) => {
    if (position === null || !editorRef.current) return

    const selection = window.getSelection()
    if (!selection) return

    const lines = editorRef.current.querySelectorAll('.md-line')
    if (lines.length === 0) return

    const lineIndex = Math.min(position.line, lines.length - 1)
    const lineDiv = lines[lineIndex]

    const range = document.createRange()
    setCaretInLine(range, lineDiv, position.column)

    selection.removeAllRanges()
    selection.addRange(range)
  }, [])

  // ── Active line highlight ────────────────────────────────────────────────
  // Marca la línea .md-line que contiene el cursor con la clase md-active-line.
  // Se recalcula al mover el cursor (selectionchange) y tras cada re-render
  // del contenido (que reemplaza los .md-line por nuevos nodos).
  const updateActiveLine = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return

    const selection = window.getSelection()
    let activeLine: Element | null = null

    if (
      selection &&
      selection.rangeCount > 0 &&
      editor.contains(selection.getRangeAt(0).startContainer)
    ) {
      let current: Node | null = selection.getRangeAt(0).startContainer
      while (current && current !== editor) {
        if (
          current.nodeType === Node.ELEMENT_NODE &&
          (current as Element).classList?.contains('md-line')
        ) {
          activeLine = current as Element
          break
        }
        current = current.parentNode
      }
    }

    // Quitar la clase de todas las líneas y aplicarla solo a la activa.
    const previousActive = editor.querySelectorAll('.md-line.md-active-line')
    previousActive.forEach((el) => el.classList.remove('md-active-line'))
    if (activeLine) {
      activeLine.classList.add('md-active-line')
    }
  }, [])

  useEffect(() => {
    const handler = () => updateActiveLine()
    document.addEventListener('selectionchange', handler)
    return () => document.removeEventListener('selectionchange', handler)
  }, [updateActiveLine])

  // Recalcular línea activa tras cada render del contenido
  useEffect(() => {
    updateActiveLine()
  }, [content, variant, updateActiveLine])

  // ── Vim mode integration ─────────────────────────────────────────────────
  const vimSetContent = useCallback(
    (newContent: string, caretPos?: { line: number; column: number }) => {
      lastContentRef.current = newContent
      onContentChange(newContent, { commit: true })
      if (editorRef.current) {
        editorRef.current.innerHTML = renderContentWithStyles(newContent, variant)
        if (caretPos) {
          restoreCaretPosition(caretPos)
        }
        updateActiveLine()
      }
    },
    [onContentChange, variant, restoreCaretPosition, updateActiveLine]
  )

  const vimOps = useMemo(
    () => ({
      editorRef,
      getContent: () => (editorRef.current ? extractTextFromHtml(editorRef.current) : ''),
      getCaret: () => saveCaretPosition(),
      setCaret: (pos: { line: number; column: number }) => restoreCaretPosition(pos),
      setContent: vimSetContent,
      save: onSave
    }),
    [saveCaretPosition, restoreCaretPosition, vimSetContent, onSave]
  )

  const vim = useVimMode({ enabled: vimEnabled, ops: vimOps })

  // Ref para acceder a vim.resetToNormal dentro de efectos sin recrearlos
  const vimRef = useRef(vim)
  vimRef.current = vim

  // Actualizar el contenido del editor cuando cambia externamente
  useEffect(() => {
    if (!editorRef.current || isUpdatingRef.current) return

    if (content !== lastContentRef.current) {
      // El cambio es externo (cambio de nota, undo/redo): volver a modo normal
      if (vimEnabled) vimRef.current?.resetToNormal()
      const caretPos = saveCaretPosition()
      editorRef.current.innerHTML = renderContentWithStyles(content, variant)
      lastContentRef.current = content
      restoreCaretPosition(caretPos)
      updateActiveLine()
    }
  }, [content, variant, saveCaretPosition, restoreCaretPosition, updateActiveLine, vimEnabled])

  // Inicializar el contenido
  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = renderContentWithStyles(content, variant)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const syncContentFromEditor = useCallback(
    (preserveCaret = true) => {
      if (!editorRef.current) return
      isUpdatingRef.current = true

      const caretPos = preserveCaret ? saveCaretPosition() : null
      const newContent = extractTextFromHtml(editorRef.current)
      lastContentRef.current = newContent
      onContentChange(newContent)

      requestAnimationFrame(() => {
        const editor = editorRef.current
        if (!editor) return

        editor.innerHTML = renderContentWithStyles(newContent, variant)

        if (caretPos !== null) {
          restoreCaretPosition(caretPos)
        } else {
          // Colocar al final del documento: última línea, columna = longitud
          const lineCount = editor.querySelectorAll('.md-line').length
          const lastLine = editor.querySelectorAll('.md-line')[lineCount - 1]
          const lastLineText = lastLine?.textContent || ''
          restoreCaretPosition({ line: Math.max(0, lineCount - 1), column: lastLineText.length })
        }

        isUpdatingRef.current = false
        updateActiveLine()
      })
    },
    [onContentChange, variant, saveCaretPosition, restoreCaretPosition, updateActiveLine]
  )

  // Manejar cambios en el contenido
  const handleInput = useCallback(
    (e?: React.FormEvent<HTMLDivElement>) => {
      if (!editorRef.current) return

      const nativeEvent = e?.nativeEvent as (Event & { isComposing?: boolean }) | undefined
      if (nativeEvent?.isComposing || isComposingRef.current) {
        return
      }

      syncContentFromEditor(true)
    },
    [syncContentFromEditor]
  )

  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true
  }, [])

  const handleCompositionEnd = useCallback(() => {
    isComposingRef.current = false
    syncContentFromEditor(true)
  }, [syncContentFromEditor])

  // Manejar teclas especiales
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const modKey = isMac ? e.metaKey : e.ctrlKey

      // Delegar primero Undo/Redo (Ctrl/Cmd+Z, Ctrl/Cmd+Y, Ctrl/Cmd+Shift+Z)
      // al handler externo ANTES de que el contentEditable lo consuma.
      // Sin esto, el contentEditable ejecuta su propio undo a nivel DOM
      // y desincroniza el historial del hook useUndoRedo.
      if (modKey && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        onKeyDown(e)
        return
      }
      if (modKey && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        onKeyDown(e)
        return
      }

      // ── Vim mode ──────────────────────────────────────────────────────────
      if (vimEnabled) {
        // Let other Ctrl/Cmd+key combos (except r for redo and [ for Escape)
        // pass through so global shortcuts (Ctrl+N, Ctrl+P, Ctrl+B, ...) keep working
        const vimSpecialCtrl = e.ctrlKey && ['r', '['].includes(e.key.toLowerCase())
        if ((modKey || e.ctrlKey || e.metaKey) && !vimSpecialCtrl) {
          // fall through to the normal editor handling below (Ctrl+B, Ctrl+I, etc.)
        } else {
          const handled = vim.handleKeyDown(e)
          if (handled) {
            e.preventDefault()
            return
          }
          // In insert mode, unhandled keys fall through for normal editing
          if (vim.mode !== 'insert') {
            e.preventDefault()
            return
          }
        }
      }

      // Enter: insertar salto de línea manualmente
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()

        // Obtener contenido actual y posición del cursor
        if (!editorRef.current) return

        const currentContent = extractTextFromHtml(editorRef.current)
        const caretPos = saveCaretPosition() ?? caretFromEnd(currentContent)

        // Convertir { line, column } a offset absoluto sobre el texto plano
        const offset = caretToOffset(currentContent, caretPos)

        // Insertar salto de línea en la posición del cursor
        const newContent = currentContent.slice(0, offset) + '\n' + currentContent.slice(offset)

        // Actualizar contenido (con commit: Enter es su propio punto de undo)
        lastContentRef.current = newContent
        onContentChange(newContent, { commit: true })

        // Re-renderizar y posicionar cursor al inicio de la nueva línea
        editorRef.current.innerHTML = renderContentWithStyles(newContent, variant)
        restoreCaretPosition({ line: caretPos.line + 1, column: 0 })
        return
      }

      // Tab: insertar espacios
      if (e.key === 'Tab') {
        e.preventDefault()

        if (!editorRef.current) return

        const currentContent = extractTextFromHtml(editorRef.current)
        const caretPos = saveCaretPosition() ?? caretFromEnd(currentContent)
        const offset = caretToOffset(currentContent, caretPos)

        const newContent = currentContent.slice(0, offset) + '  ' + currentContent.slice(offset)

        lastContentRef.current = newContent
        onContentChange(newContent, { commit: true })

        editorRef.current.innerHTML = renderContentWithStyles(newContent, variant)
        restoreCaretPosition({ line: caretPos.line, column: caretPos.column + 2 })
        return
      }

      // Ctrl/Cmd + B: Bold
      if (modKey && e.key === 'b') {
        e.preventDefault()
        const selection = window.getSelection()
        if (selection && selection.toString()) {
          document.execCommand('insertText', false, `**${selection.toString()}**`)
          handleInput()
        }
        return
      }

      // Ctrl/Cmd + I: Italic
      if (modKey && e.key === 'i') {
        e.preventDefault()
        const selection = window.getSelection()
        if (selection && selection.toString()) {
          document.execCommand('insertText', false, `*${selection.toString()}*`)
          handleInput()
        }
        return
      }

      // Pasar al handler original
      onKeyDown(e)
    },
    [
      handleInput,
      onKeyDown,
      onContentChange,
      variant,
      saveCaretPosition,
      restoreCaretPosition,
      vimEnabled,
      vim
    ]
  )

  // Manejar pegado
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      e.preventDefault()

      let pastedText = e.clipboardData.getData('text/plain')
      if (!pastedText && e.clipboardData.types.includes('text/html')) {
        const htmlData = e.clipboardData.getData('text/html')
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = htmlData
        pastedText = tempDiv.textContent || tempDiv.innerText || ''
      }

      const clean = sanitizeContent(pastedText)
      if (clean) {
        document.execCommand('insertText', false, clean)
        handleInput()
      }
    },
    [handleInput]
  )

  const containerClass =
    variant === 'preview'
      ? 'markdown-editor-container markdown-preview-mode'
      : 'markdown-editor-container'

  const baseEditorClass =
    variant === 'preview'
      ? 'markdown-contenteditable markdown-content markdown-preview-editable'
      : 'markdown-contenteditable'

  const editorClass = editorClassName ? `${baseEditorClass} ${editorClassName}` : baseEditorClass

  const fullContainerClass = vimEnabled ? `${containerClass} vim-active` : containerClass

  const vimModeClass = vimEnabled ? ` vim-mode-${vim.mode}` : ''

  // Contenido del buffer a mostrar en la status line
  const statusBuffer =
    vim.mode === 'command' ? `:${vim.commandBuffer}` : `${vim.countPrefix}${vim.pendingOperator}`

  return (
    <div className={`relative w-full h-full ${fullContainerClass}`}>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onBlur={onSave}
        spellCheck={false}
        className={`${editorClass}${vimModeClass}`}
        dir="ltr"
        data-placeholder="Start writing in Markdown..."
      />
      {vimEnabled && (
        <div className="vim-statusline">
          <span className={`vim-statusline-mode vim-statusline-mode-${vim.mode}`}>
            {vim.mode === 'insert'
              ? '-- INSERT --'
              : vim.mode === 'visual'
                ? '-- VISUAL --'
                : vim.mode === 'command'
                  ? 'COMMAND'
                  : 'NORMAL'}
          </span>
          <span className="vim-statusline-buffer">{statusBuffer}</span>
          <span className="vim-statusline-message">{vim.statusMessage}</span>
        </div>
      )}
    </div>
  )
}
