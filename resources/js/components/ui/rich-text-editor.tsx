import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import { Button } from './button'
import { Separator } from './separator'
import { Input } from './input'
import { Label } from './label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from './dialog'
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Unlink
} from 'lucide-react'
import { cn } from '@/lib/utils'
import React, { forwardRef, useImperativeHandle, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface RichTextEditorProps {
  content?: string
  value?: string
  onChange?: (content: string) => void
  placeholder?: string
  className?: string
  editable?: boolean
}

export interface RichTextEditorRef {
  getContent: () => string
  setContent: (content: string) => void
  focus: () => void
}

const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(({
  content = '',
  value,
  onChange,
  placeholder = 'Start typing...',
  className,
  editable = true
}, ref) => {
  // Use value prop if provided, otherwise use content prop
  const initialContent = value !== undefined ? value : content;
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkError, setLinkError] = useState('')
  const { t } = useTranslation();
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc ps-6 my-2',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal ps-6 my-2',
          },
        },
        listItem: {
          HTMLAttributes: {
            class: 'my-1 leading-normal',
          },
        },
        blockquote: {
          HTMLAttributes: {
            class: 'border-s-4 border-primary/60 dark:border-primary/40 ps-4 italic my-3 text-muted-foreground',
          },
        },
      }),
      TextStyle,
      Color,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: initialContent,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
  })

  // Update editor content when value/content prop changes
  React.useEffect(() => {
    if (editor && initialContent !== editor.getHTML()) {
      editor.commands.setContent(initialContent)
    }
  }, [editor, initialContent])

  useImperativeHandle(ref, () => ({
    getContent: () => editor?.getHTML() || '',
    setContent: (content: string) => editor?.commands.setContent(content),
    focus: () => editor?.commands.focus(),
  }))

  if (!editor) {
    return null
  }

  const addLink = () => {
    // Get existing link URL if text is selected and has a link
    const existingUrl = editor.getAttributes('link').href || ''
    setLinkUrl(existingUrl)
    setShowLinkModal(true)
    setLinkError('')
  }

  const validateAndInsertLink = () => {
    // Clear previous error
    setLinkError('')

    // Required field validation
    if (!linkUrl.trim()) {
      setLinkError('URL is required.')
      return
    }

    // URL format validation
    try {
      new URL(linkUrl.trim())
    } catch {
      setLinkError('Please enter a valid URL (e.g. https://example.com).')
      return
    }

    // If validation passes, insert the link
    editor.chain().focus().setLink({ href: linkUrl.trim() }).run()
    setShowLinkModal(false)
    setLinkUrl('')
    setLinkError('')
  }

  return (
    <div className={cn('border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden flex flex-col bg-white dark:bg-zinc-900', className)}>
      {editable && (
        <div className="border-b border-zinc-200 dark:border-zinc-800 p-2 flex flex-wrap gap-1 bg-zinc-50/80 dark:bg-zinc-900/80">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn('h-8 w-8 p-0 cursor-pointer', editor.isActive('bold') ? 'bg-zinc-200 dark:bg-zinc-800 text-primary font-bold' : '')}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn('h-8 w-8 p-0 cursor-pointer', editor.isActive('italic') ? 'bg-zinc-200 dark:bg-zinc-800 text-primary font-bold' : '')}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={cn('h-8 w-8 p-0 cursor-pointer', editor.isActive('strike') ? 'bg-zinc-200 dark:bg-zinc-800 text-primary font-bold' : '')}
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-5 shrink-0 hidden sm:block mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={cn('h-8 w-8 p-0 cursor-pointer', editor.isActive({ textAlign: 'left' }) ? 'bg-zinc-200 dark:bg-zinc-800 text-primary' : '')}
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={cn('h-8 w-8 p-0 cursor-pointer', editor.isActive({ textAlign: 'center' }) ? 'bg-zinc-200 dark:bg-zinc-800 text-primary' : '')}
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={cn('h-8 w-8 p-0 cursor-pointer', editor.isActive({ textAlign: 'right' }) ? 'bg-zinc-200 dark:bg-zinc-800 text-primary' : '')}
            title="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-5 shrink-0 hidden sm:block mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn('h-8 w-8 p-0 cursor-pointer', editor.isActive('bulletList') ? 'bg-zinc-200 dark:bg-zinc-800 text-primary font-bold' : '')}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn('h-8 w-8 p-0 cursor-pointer', editor.isActive('orderedList') ? 'bg-zinc-200 dark:bg-zinc-800 text-primary font-bold' : '')}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn('h-8 w-8 p-0 cursor-pointer', editor.isActive('blockquote') ? 'bg-zinc-200 dark:bg-zinc-800 text-primary font-bold' : '')}
            title="Blockquote"
          >
            <Quote className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-5 shrink-0 hidden sm:block mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={(e) => e.preventDefault()}
            onClick={addLink}
            className="h-8 w-8 p-0 cursor-pointer"
            title="Add Link"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().unsetLink().run()}
            disabled={!editor.isActive('link')}
            className="h-8 w-8 p-0 cursor-pointer"
            title="Remove Link"
          >
            <Unlink className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-5 shrink-0 hidden sm:block mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="h-8 w-8 p-0 cursor-pointer"
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="h-8 w-8 p-0 cursor-pointer"
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <EditorContent 
        editor={editor} 
        className="p-4 focus-within:outline-none flex-1 min-h-[160px] text-sm text-foreground leading-relaxed [&_.ProseMirror]:min-h-[140px] [&_.ProseMirror]:outline-none [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:ps-6 [&_.ProseMirror_ul]:my-2 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:ps-6 [&_.ProseMirror_ol]:my-2 [&_.ProseMirror_li]:my-1 [&_.ProseMirror_blockquote]:border-s-4 [&_.ProseMirror_blockquote]:border-primary/60 [&_.ProseMirror_blockquote]:dark:border-primary/40 [&_.ProseMirror_blockquote]:ps-4 [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_blockquote]:my-3 [&_.ProseMirror_p]:my-1"
        placeholder={placeholder}
      />

      <Dialog open={showLinkModal} onOpenChange={setShowLinkModal}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md max-h-[90vh] p-0 rounded-lg overflow-hidden" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="text-lg font-semibold text-foreground truncate">
              {editor.getAttributes('link').href ? t('Edit Link') : t('Insert Link')}
            </DialogTitle>
          </DialogHeader>
          <div className="px-6 py-4 space-y-4">
            <div className="grid gap-2 min-w-0">
              <Label htmlFor="link-url" required>
                {t('URL')}
              </Label>
              <Input
                id="link-url"
                type="url"
                value={linkUrl}
                onChange={(e) => {
                  setLinkUrl(e.target.value)
                  if (linkError) {
                    setLinkError('')
                  }
                }}
                placeholder="https://example.com"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    validateAndInsertLink()
                  }
                }}
                autoFocus
                required
                className={linkError ? 'border-red-500' : ''}
              />
              {linkError && (
                <p className="text-sm text-red-500 mt-1">{linkError}</p>
              )}
            </div>
          </div>
          <DialogFooter className="px-6 py-4 border-t bg-muted/30 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowLinkModal(false)
                setLinkUrl('')
                setLinkError('')
              }}
            >
              {t('Cancel')}
            </Button>
            <Button
              type="button"
              onClick={validateAndInsertLink}
            >
              {editor.getAttributes('link').href ? t('Update') : t('Insert')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
})

RichTextEditor.displayName = 'RichTextEditor'

export { RichTextEditor }