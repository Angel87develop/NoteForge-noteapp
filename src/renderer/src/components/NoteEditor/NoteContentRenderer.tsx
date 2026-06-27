/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { useEffect, useRef } from 'react'
import type { ReactNode, HTMLAttributes, Ref } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import mermaid, { type RunOptions } from 'mermaid'
import type { PluggableList } from 'unified'
import { useSettings } from '../../contexts/SettingsContext'

import 'katex/dist/katex.min.css'

interface NoteContentRendererProps {
  content: string
}

export default function NoteContentRenderer({ content }: NoteContentRendererProps) {
  const { settings } = useSettings()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const diagramCounterRef = useRef(0)

  const markdownSettings = settings.editor.markdown

  // Detectar el tema actual
  const isDarkTheme = settings.ui.theme.theme === 'dark' || 
    (settings.ui.theme.theme === 'system' && !window.matchMedia('(prefers-color-scheme: light)').matches)

  const remarkPlugins: PluggableList = []

  // Dialecto y extensiones GFM (tablas, task lists, footnotes)
  if (markdownSettings.dialect === 'gfm' && (markdownSettings.tables || markdownSettings.taskLists || markdownSettings.footnotes)) {
    remarkPlugins.push(remarkGfm)
  }

  // Soporte de matemáticas
  if (markdownSettings.mathSupport) {
    remarkPlugins.push(remarkMath)
  }

  const rehypePlugins: PluggableList = []

  // Renderizado de HTML embebido
  if (markdownSettings.htmlEmbedded) {
    rehypePlugins.push(rehypeRaw)
  }

  // Renderizado de KaTeX
  if (markdownSettings.mathSupport) {
    rehypePlugins.push(rehypeKatex)
  }

  // Inicializar Mermaid cuando se habilitan diagramas
  useEffect(() => {
    if (!markdownSettings.diagrams) return

    // Inicializar Mermaid con el tema correcto
    try {
      mermaid.initialize({ 
        startOnLoad: false, 
        theme: isDarkTheme ? 'dark' : 'default',
        securityLevel: 'loose',
        fontFamily: 'DM Sans, sans-serif'
      })
    } catch (error) {
      console.error('Error initializing Mermaid:', error)
    }
  }, [markdownSettings.diagrams, isDarkTheme])

  // Renderizar diagramas Mermaid después de que el contenido se haya renderizado
  useEffect(() => {
    if (!markdownSettings.diagrams || !containerRef.current) return

    // Resetear el contador cuando cambia el contenido
    diagramCounterRef.current = 0

    // Limpiar diagramas procesados y SVG anteriores cuando cambia el contenido
    const processedElements = containerRef.current.querySelectorAll('.mermaid[data-processed]')
    processedElements.forEach((el) => {
      el.removeAttribute('data-processed')
      // Limpiar SVG anterior si existe
      const svg = el.querySelector('svg')
      if (svg) {
        svg.remove()
      }
    })

    // Función para renderizar diagramas
    const renderDiagrams = () => {
      if (!containerRef.current) return

      try {
        const mermaidElements = containerRef.current.querySelectorAll('.mermaid:not([data-processed])')
        
        if (mermaidElements && mermaidElements.length > 0) {
          // Convertir NodeList a Array para mejor manejo
          const elementsArray = Array.from(mermaidElements) as HTMLElement[]
          
          // Renderizar cada diagrama individualmente para mejor control
          Promise.all(
            elementsArray.map((element) => {
              return mermaid.run({
                nodes: [element]
              }).then(() => {
                element.setAttribute('data-processed', 'true')
              }).catch((error) => {
                console.error('Error rendering Mermaid diagram:', error, element)
                // Marcar como procesado incluso si falla para evitar loops infinitos
                element.setAttribute('data-processed', 'true')
              })
            })
          ).catch((error) => {
            console.error('Error in batch Mermaid rendering:', error)
          })
        }
      } catch (error) {
        console.error('Error processing Mermaid diagrams:', error)
      }
    }

    // Usar requestAnimationFrame para asegurar que el DOM esté completamente renderizado
    let timeoutId: NodeJS.Timeout | null = null
    const rafId = requestAnimationFrame(() => {
      // Doble check con un pequeño delay para asegurar que React terminó de renderizar
      timeoutId = setTimeout(() => {
        renderDiagrams()
      }, 50)
    })

    return () => {
      cancelAnimationFrame(rafId)
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [content, markdownSettings.diagrams])

  type CodeProps = {
    inline?: boolean
    className?: string
    children: ReactNode
    ref?: Ref<HTMLElement>
  } & HTMLAttributes<HTMLElement>

  const components: Components = {
    // Asegurar que las listas se rendericen correctamente
    ul: ({ children, ...props }) => <ul {...props}>{children}</ul>,
    ol: ({ children, ...props }) => <ol {...props}>{children}</ol>,
    li: ({ children, ...props }) => <li {...props}>{children}</li>,
    // Asegurar que los blockquotes se rendericen correctamente
    blockquote: ({ children, ...props }) => <blockquote {...props}>{children}</blockquote>,
    // Diagramas Mermaid
    code(rawProps) {
      const { inline, className, children, ref: _ref, ...props } = rawProps as CodeProps

      void _ref

      const match = /language-(\w+)/.exec(className || '')
      const language = match?.[1]

      if (!inline && language === 'mermaid') {
        if (markdownSettings.diagrams) {
          // Generar un ID único para cada diagrama usando un contador
          diagramCounterRef.current += 1
          const diagramId = `mermaid-diagram-${diagramCounterRef.current}`
          
          return (
            <div
              key={diagramId}
              id={diagramId}
              className="mermaid my-4"
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </div>
          )
        }
        // Si está desactivado, mostrar como bloque de código normal
        return (
          <pre className={className} {...props}>
            <code>{children}</code>
          </pre>
        )
      }

      return (
        <code className={className} {...props}>
          {children}
        </code>
      )
    }
  }

  // Efecto adicional para asegurar que los diagramas se rendericen cuando el componente se monta
  useEffect(() => {
    if (!markdownSettings.diagrams || !containerRef.current) return

    // Verificar si hay diagramas sin procesar después de un breve delay
    const checkAndRender = () => {
      if (!containerRef.current) return
      
      const unprocessedElements = containerRef.current.querySelectorAll('.mermaid:not([data-processed])')
      if (unprocessedElements.length > 0) {
        const elementsArray = Array.from(unprocessedElements) as HTMLElement[]
        
        Promise.all(
          elementsArray.map((element) => {
            return mermaid.run({
              nodes: [element]
            }).then(() => {
              element.setAttribute('data-processed', 'true')
            }).catch((error) => {
              console.error('Error rendering Mermaid diagram in check:', error)
              element.setAttribute('data-processed', 'true')
            })
          })
        ).catch((error) => {
          console.error('Error in check Mermaid rendering:', error)
        })
      }
    }

    // Verificar después de que React termine de renderizar
    const timeoutId = setTimeout(checkAndRender, 200)

    return () => clearTimeout(timeoutId)
  }, [markdownSettings.diagrams])

  return (
    <div className="markdown-content min-h-full" ref={containerRef}>
      {content ? (
        <ReactMarkdown 
          remarkPlugins={remarkPlugins}
          rehypePlugins={rehypePlugins}
          components={components}
        >
          {content}
        </ReactMarkdown>
      ) : (
        <p className="text-[#a0a0a0] italic">Start writing in Markdown...</p>
      )}
    </div>
  )
}
