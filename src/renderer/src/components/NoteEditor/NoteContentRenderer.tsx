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

  const markdownSettings = settings.editor.markdown

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

    try {
      mermaid.initialize({ startOnLoad: false, theme: 'dark' })
      if (containerRef.current) {
        const options: RunOptions = {
          nodes: containerRef.current.querySelectorAll('.mermaid')
        }

        mermaid.run(options)
      }
    } catch (error) {
      console.error('Error initializing Mermaid diagrams:', error)
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
          return (
            <div
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
