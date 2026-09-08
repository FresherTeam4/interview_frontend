import ReactMarkdown from 'react-markdown'
import { cn } from '@/lib/utils'

interface MarkdownPreviewProps {
  content?: string | null
  className?: string
}

/**
 * Normalizes Markdown text from AI extraction so sections and bullet points
 * are cleanly formatted without stray or empty list markers.
 */
function normalizeMarkdown(text: string): string {
  if (!text) return ''

  return text
    .replace(/\r\n/g, '\n')
    // Remove bullets that precede markdown headings (e.g. "- ## Vai trò" -> "## Vai trò")
    .replace(/^[\s•*-]+(#{1,4}\s+)/gm, '$1')
    // Remove empty bullet markers
    .replace(/^[\s•*-]+$/gm, '')
    // Ensure headings start on their own line with blank line before
    .replace(/([^\n])\s*(#{1,4}\s+)/g, '$1\n\n$2')
    // If heading text is immediately followed by a bullet, break line
    .replace(/(#{1,4}[^\n]+?)\s*[-•*]\s+/g, '$1\n\n- ')
    // Ensure bullet points are on new lines
    .replace(/([^\n])\s+([•*-]\s+)/g, '$1\n$2')
    // Remove any remaining empty bullet lines
    .replace(/^\s*[-•*]\s*$/gm, '')
    .trim()
}

export function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  if (!content) return null

  const formattedContent = normalizeMarkdown(content)

  return (
    <div
      className={cn(
        'markdown-preview rounded-lg border border-border/60 bg-muted/20 p-3.5 text-xs sm:text-sm leading-relaxed text-foreground/90 transition-colors',
        className,
      )}
    >
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h3 className="text-sm font-bold text-foreground mt-3 mb-1.5 pb-1 border-b border-border/40 first:mt-0">
              {children}
            </h3>
          ),
          h2: ({ children }) => (
            <h4 className="text-xs sm:text-sm font-bold text-foreground mt-3 mb-1 pb-0.5 first:mt-0 text-primary">
              {children}
            </h4>
          ),
          h3: ({ children }) => (
            <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-2 mb-1">
              {children}
            </h5>
          ),
          p: ({ children }) => (
            <p className="text-xs sm:text-sm text-foreground/85 leading-relaxed mb-2 last:mb-0">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="space-y-1 my-1.5 pl-4 list-disc marker:text-primary/70 text-xs sm:text-sm text-foreground/85">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="space-y-1 my-1.5 pl-4 list-decimal marker:text-primary/70 text-xs sm:text-sm text-foreground/85">
              {children}
            </ol>
          ),
          li: ({ children }) => {
            if (!children) return null
            return <li className="pl-0.5 leading-relaxed">{children}</li>
          },
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          code: ({ children }) => (
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-primary">
              {children}
            </code>
          ),
        }}
      >
        {formattedContent}
      </ReactMarkdown>
    </div>
  )
}

export default MarkdownPreview
