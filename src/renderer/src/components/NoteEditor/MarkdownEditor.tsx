/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import React, { useRef, useEffect, useCallback } from 'react'
import { sanitizeContent } from '../../utils/markdownUtils'
import './markdownEditor.css'

interface MarkdownEditorProps {
  content: string
  onContentChange: (content: string) => void
  onSave: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
}

// Función para renderizar el contenido con estilos inline
const renderContentWithStyles = (text: string): string => {
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
      const content = headingMatch[2]
      htmlLines.push(`<div class="md-line md-h${level}"><span class="md-hash">${headingMatch[1]}</span> ${escapeHtml(content)}</div>`)
      return
    }

    // Detectar listas no ordenadas
    const ulMatch = line.match(/^(\s*)([-*+])\s+(.*)$/)
    if (ulMatch) {
      const indent = ulMatch[1]
      const marker = ulMatch[2]
      const content = ulMatch[3]
      htmlLines.push(`<div class="md-line md-list">${escapeHtml(indent)}<span class="md-marker">${marker}</span> ${escapeHtml(content)}</div>`)
      return
    }

    // Detectar listas ordenadas
    const olMatch = line.match(/^(\s*)(\d+\.)\s+(.*)$/)
    if (olMatch) {
      const indent = olMatch[1]
      const marker = olMatch[2]
      const content = olMatch[3]
      htmlLines.push(`<div class="md-line md-list">${escapeHtml(indent)}<span class="md-marker">${marker}</span> ${escapeHtml(content)}</div>`)
      return
    }

    // Detectar blockquotes
    const blockquoteMatch = line.match(/^>\s*(.*)$/)
    if (blockquoteMatch) {
      const content = blockquoteMatch[1]
      htmlLines.push(`<div class="md-line md-blockquote"><span class="md-quote-marker">&gt;</span> ${escapeHtml(content)}</div>`)
      return
    }

    // Detectar código inline y bold/italic
    let processedLine = escapeHtml(line)
    
    // Code inline
    processedLine = processedLine.replace(/`([^`]+)`/g, '<span class="md-code">`$1`</span>')
    
    // Bold
    processedLine = processedLine.replace(/\*\*([^*]+)\*\*/g, '<span class="md-bold">**$1**</span>')
    
    // Italic
    processedLine = processedLine.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<span class="md-italic">*$1*</span>')

    // Línea normal
    htmlLines.push(`<div class="md-line">${processedLine}</div>`)
  })

  return htmlLines.join('')
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
  onKeyDown
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
        position += range.startOffset
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
            range.setStartAfter(node)
            range.collapse(true)
            found = true
            return true
          }
          currentPos += 1
        } else if (element.classList?.contains('md-line')) {
          for (const child of Array.from(node.childNodes)) {
            if (walkNodes(child)) return true
          }
          // Añadir salto de línea después de cada línea
          const nextSibling = node.nextSibling
          if (nextSibling && !found) {
            if (currentPos === position) {
              // Posicionar al inicio de la siguiente línea
              range.setStart(nextSibling, 0)
              range.collapse(true)
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

    // Si no encontramos la posición exacta, posicionar al final del último nodo válido
    if (!found && lastValidNode) {
      range.setStart(lastValidNode, lastValidOffset)
      range.collapse(true)
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
      editorRef.current.innerHTML = renderContentWithStyles(content)
      lastContentRef.current = content
      restoreCaretPosition(caretPos)
    }
  }, [content, saveCaretPosition, restoreCaretPosition])

  // Inicializar el contenido
  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = renderContentWithStyles(content)
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
      editor.innerHTML = renderContentWithStyles(newContent)

      // Restaurar la posición del cursor
      // Si no se pudo guardar la posición, intentar calcularla basándose en el cambio de contenido
      if (caretPos !== null) {
        restoreCaretPosition(caretPos)
      } else {
        // Fallback: intentar mantener la posición relativa
        // Calcular la nueva posición basándose en la longitud del contenido
        const newLength = newContent.length
        if (newLength > 0) {
          // Intentar posicionar cerca del final, pero no exactamente al final
          restoreCaretPosition(Math.min(newLength - 1, newLength))
        }
      }

      isUpdatingRef.current = false
    })
  }, [onContentChange, saveCaretPosition, restoreCaretPosition])

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
      editorRef.current.innerHTML = renderContentWithStyles(newContent)
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
      
      editorRef.current.innerHTML = renderContentWithStyles(newContent)
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
  }, [handleInput, onKeyDown, onContentChange, saveCaretPosition, restoreCaretPosition])

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

  return (
    <div className="relative w-full h-full markdown-editor-container">
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onBlur={onSave}
        spellCheck={false}
        className="markdown-contenteditable"
        data-placeholder="Start writing in Markdown..."
      />
    </div>
  )
}
