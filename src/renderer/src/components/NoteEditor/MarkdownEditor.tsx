/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import React, { useRef, useEffect, useCallback } from 'react'
import { sanitizeContent } from '../../utils/markdownUtils'
import './markdownEditor.css'

type MarkdownEditorVariant = 'source' | 'preview'

interface MarkdownEditorProps {
  content: string
  onContentChange: (content: string) => void
  onSave: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
  variant?: MarkdownEditorVariant
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

// Función para renderizar el contenido con estilos inline
const renderContentWithStyles = (text: string, variant: MarkdownEditorVariant = 'source'): string => {
  const preview = variant === 'preview'
  if (!text) return '<div class="md-line md-empty"><br></div>'

  const lines = text.split('\n')
  const htmlLines: string[] = []

  const escapeHtml = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  lines.forEach((line) => {
    // Línea vacía
    if (line === '') {
      htmlLines.push('<div class="md-line md-empty"><br></div>')
      return
    }

    // Detectar títulos (h1-h6)
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const headingContent = headingMatch[2]
      const prefix = `${headingMatch[1]} `
      if (preview) {
        htmlLines.push(
          `<div class="md-line md-h${level}">${hidden(prefix, preview)}${processInlineFormatting(headingContent, preview)}</div>`
        )
      } else {
        htmlLines.push(
          `<div class="md-line md-h${level}"><span class="md-hash">${headingMatch[1]}</span> ${escapeHtml(headingContent)}</div>`
        )
      }
      return
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
      return
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
      return
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
      return
    }

    // Línea normal
    htmlLines.push(`<div class="md-line">${processInlineFormatting(line, preview)}</div>`)
  })

  return htmlLines.join('')
}

const getNodeTextLength = (node: Node): number => {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent?.length || 0
  }
  if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === 'BR') {
    return 0
  }
  let length = 0
  for (const child of Array.from(node.childNodes)) {
    length += getNodeTextLength(child)
  }
  return length
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
  variant = 'source'
}: MarkdownEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const isUpdatingRef = useRef(false)
  const lastContentRef = useRef(content)

  // Guardar posición del cursor contando caracteres incluyendo saltos de línea
  const saveCaretPosition = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0 || !editorRef.current) return null
    
    const range = selection.getRangeAt(0)
    let position = 0
    let found = false

    const walkNodes = (node: Node): boolean => {
      if (found) return true

      if (node === range.startContainer) {
        if (node.nodeType === Node.TEXT_NODE) {
          position += range.startOffset
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element
          if (element.tagName === 'BR') {
            // El cursor sobre <br> no añade caracteres de texto
          } else {
            for (let i = 0; i < range.startOffset && i < node.childNodes.length; i++) {
              position += getNodeTextLength(node.childNodes[i])
            }
          }
        }
        found = true
        return true
      }

      if (node.nodeType === Node.TEXT_NODE) {
        position += node.textContent?.length || 0
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element
        // Cada div.md-line representa una línea, añadir salto de línea después excepto el último
        if (element.classList?.contains('md-line')) {
          for (const child of Array.from(node.childNodes)) {
            if (walkNodes(child)) return true
          }
          // Añadir salto de línea después de cada línea (excepto si ya encontramos el cursor)
          if (!found) {
            const nextSibling = node.nextSibling
            if (nextSibling) {
              position += 1 // Salto de línea entre líneas
            }
          }
        } else {
          for (const child of Array.from(node.childNodes)) {
            if (walkNodes(child)) return true
          }
        }
      }
      return false
    }

    walkNodes(editorRef.current)
    return found ? position : null
  }, [])

  // Restaurar posición del cursor
  const restoreCaretPosition = useCallback((position: number | null) => {
    if (position === null || !editorRef.current) return

    const selection = window.getSelection()
    if (!selection) return

    const range = document.createRange()
    let currentPos = 0
    let found = false
    let lastValidNode: Node | null = null
    let lastValidOffset = 0

    const walkNodes = (node: Node): boolean => {
      if (found) return true

      if (node.nodeType === Node.TEXT_NODE) {
        const textLength = node.textContent?.length || 0
        lastValidNode = node
        lastValidOffset = textLength
        
        if (currentPos + textLength >= position) {
          range.setStart(node, Math.min(position - currentPos, textLength))
          range.collapse(true)
          found = true
          return true
        }
        currentPos += textLength
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element
        
        if (element.tagName === 'BR') {
          if (currentPos === position) {
            const lineParent = element.parentElement
            if (lineParent?.classList.contains('md-line')) {
              setRangeAtLineStart(range, lineParent)
            } else {
              range.setStartAfter(node)
              range.collapse(true)
            }
            found = true
            return true
          }
        } else if (element.classList?.contains('md-line')) {
          for (const child of Array.from(node.childNodes)) {
            if (walkNodes(child)) return true
          }
          // Añadir salto de línea después de cada línea
          const nextSibling = node.nextSibling
          if (nextSibling && !found) {
            if (currentPos === position) {
              if (nextSibling instanceof Element && nextSibling.classList.contains('md-line')) {
                setRangeAtLineStart(range, nextSibling)
              }
              found = true
              return true
            }
            currentPos += 1 // Salto de línea
          }
        } else {
          for (const child of Array.from(node.childNodes)) {
            if (walkNodes(child)) return true
          }
        }
      }
      return false
    }

    walkNodes(editorRef.current)

    // Si no encontramos la posición exacta, posicionar al final del documento
    if (!found) {
      const lines = editorRef.current.querySelectorAll('.md-line')
      const lastLine = lines[lines.length - 1]
      if (lastLine instanceof Element) {
        setRangeAtLineEnd(range, lastLine)
      } else if (lastValidNode) {
        range.setStart(lastValidNode, lastValidOffset)
        range.collapse(true)
      }
      found = true
    }

    if (found) {
      selection.removeAllRanges()
      selection.addRange(range)
    }
  }, [])

  // Actualizar el contenido del editor cuando cambia externamente
  useEffect(() => {
    if (!editorRef.current || isUpdatingRef.current) return
    
    if (content !== lastContentRef.current) {
      const caretPos = saveCaretPosition()
      editorRef.current.innerHTML = renderContentWithStyles(content, variant)
      lastContentRef.current = content
      restoreCaretPosition(caretPos)
    }
  }, [content, variant, saveCaretPosition, restoreCaretPosition])

  // Inicializar el contenido
  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = renderContentWithStyles(content, variant)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Manejar cambios en el contenido
  const handleInput = useCallback(() => {
    if (!editorRef.current) return
    isUpdatingRef.current = true

    // Guardar la posición del cursor antes de extraer el contenido
    const caretPos = saveCaretPosition()

    // Extraer el texto plano según el DOM actual (antes de re-renderizar)
    const newContent = extractTextFromHtml(editorRef.current)
    lastContentRef.current = newContent
    onContentChange(newContent)

    // Re-renderizar con estilos después de un pequeño delay
    requestAnimationFrame(() => {
      const editor = editorRef.current
      if (!editor) return

      // Actualizar el HTML estilizado
      editor.innerHTML = renderContentWithStyles(newContent, variant)

      // Restaurar la posición del cursor
      // Si no se pudo guardar la posición, intentar calcularla basándose en el cambio de contenido
      if (caretPos !== null) {
        restoreCaretPosition(caretPos)
      } else {
        restoreCaretPosition(newContent.length)
      }

      isUpdatingRef.current = false
    })
  }, [onContentChange, variant, saveCaretPosition, restoreCaretPosition])

  // Manejar teclas especiales
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const modKey = isMac ? e.metaKey : e.ctrlKey

    // Enter: insertar salto de línea manualmente
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      
      // Obtener contenido actual y posición del cursor
      if (!editorRef.current) return
      
      const currentContent = extractTextFromHtml(editorRef.current)
      const caretPos = saveCaretPosition() || currentContent.length
      
      // Insertar salto de línea en la posición del cursor
      const newContent = currentContent.slice(0, caretPos) + '\n' + currentContent.slice(caretPos)
      
      // Actualizar contenido
      lastContentRef.current = newContent
      onContentChange(newContent)
      
      // Re-renderizar y posicionar cursor después del salto de línea
      editorRef.current.innerHTML = renderContentWithStyles(newContent, variant)
      restoreCaretPosition(caretPos + 1)
      return
    }

    // Tab: insertar espacios
    if (e.key === 'Tab') {
      e.preventDefault()
      
      if (!editorRef.current) return
      
      const currentContent = extractTextFromHtml(editorRef.current)
      const caretPos = saveCaretPosition() || currentContent.length
      
      const newContent = currentContent.slice(0, caretPos) + '  ' + currentContent.slice(caretPos)
      
      lastContentRef.current = newContent
      onContentChange(newContent)
      
      editorRef.current.innerHTML = renderContentWithStyles(newContent, variant)
      restoreCaretPosition(caretPos + 2)
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
  }, [handleInput, onKeyDown, onContentChange, variant, saveCaretPosition, restoreCaretPosition])

  // Manejar pegado
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
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
  }, [handleInput])

  const containerClass =
    variant === 'preview'
      ? 'markdown-editor-container markdown-preview-mode'
      : 'markdown-editor-container'

  const editorClass =
    variant === 'preview'
      ? 'markdown-contenteditable markdown-content markdown-preview-editable'
      : 'markdown-contenteditable'

  return (
    <div className={`relative w-full h-full ${containerClass}`}>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onBlur={onSave}
        spellCheck={false}
        className={editorClass}
        dir="ltr"
        data-placeholder="Start writing in Markdown..."
      />
    </div>
  )
}
