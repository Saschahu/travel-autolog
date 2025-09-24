/**
 * Rich text editor component with image upload support using TipTap
 */

import React, { useCallback, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { ImageIcon, Bold, Italic, List, ListOrdered, Quote, Undo, Redo } from 'lucide-react';
import { uploadReportImage, ensureReportsBucket, generateDevImageUrl } from '@/lib/imageUpload';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  enableImages?: boolean;
}

export function RichTextEditor({ content, onChange, placeholder, className, enableImages }: RichTextEditorProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [altTextDialog, setAltTextDialog] = useState<{
    open: boolean;
    imageUrl?: string;
  }>({ open: false });
  const [altText, setAltText] = useState('');

  // Check if images are enabled via feature flag
  const imagesEnabled = enableImages ?? (import.meta.env.VITE_ENABLE_REPORT_IMAGES !== 'false');

  // Configure TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      ...(imagesEnabled ? [
        Image.configure({
          HTMLAttributes: {
            class: 'max-w-full h-auto rounded-lg',
            loading: 'lazy', // Enable lazy loading
          },
        })
      ] : []),
      Placeholder.configure({
        placeholder: placeholder || t('report.placeholder'),
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] p-3',
      },
    },
  });

  // Handle image upload
  const handleImageUpload = useCallback(async (file: File) => {
    if (!editor) return;

    setIsUploading(true);
    
    try {
      // Check if bucket exists, fallback to dev mode if not
      const bucketExists = await ensureReportsBucket();
      
      let result;
      if (bucketExists || !import.meta.env.DEV) {
        result = await uploadReportImage(file);
      } else {
        // Use dev stub URL
        result = await generateDevImageUrl(file);
        toast({
          title: 'Development Mode',
          description: 'Using temporary image URL (bucket not configured)',
          variant: 'default',
        });
      }

      if (result.success && result.url) {
        // Show alt text dialog
        setAltTextDialog({ open: true, imageUrl: result.url });
      } else {
        toast({
          title: t('uploadFailed'),
          description: result.error || 'Unknown error',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Image upload error:', error);
      toast({
        title: t('uploadFailed'),
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  }, [editor, t, toast]);

  // Handle file input change
  const handleFileInput = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
    // Reset input
    event.target.value = '';
  }, [handleImageUpload]);

  // Insert image with alt text
  const insertImageWithAlt = useCallback(() => {
    if (editor && altTextDialog.imageUrl) {
      editor.chain().focus().setImage({
        src: altTextDialog.imageUrl,
        alt: altText || '',
        title: altText || '',
      }).run();
    }
    setAltTextDialog({ open: false });
    setAltText('');
  }, [editor, altTextDialog.imageUrl, altText]);

  if (!editor) {
    return null;
  }

  return (
    <div className={cn('border rounded-md', className)}>
      {/* Toolbar */}
      <div className="border-b p-2 flex flex-wrap gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-muted' : ''}
        >
          <Bold className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-muted' : ''}
        >
          <Italic className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-muted' : ''}
        >
          <List className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-muted' : ''}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'bg-muted' : ''}
        >
          <Quote className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Image upload button - only show if images are enabled */}
        {imagesEnabled && (
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              disabled={isUploading}
              asChild
            >
              <label className="cursor-pointer">
                <ImageIcon className="h-4 w-4" />
                {isUploading && <span className="ml-1 text-xs">...</span>}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            </Button>
          </div>
        )}
      </div>

      {/* Editor content */}
      <EditorContent editor={editor} className="min-h-[200px]" />

      {/* Alt text dialog */}
      <Dialog open={altTextDialog.open} onOpenChange={(open) => {
        if (!open) {
          setAltTextDialog({ open: false });
          setAltText('');
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('addAltText')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {altTextDialog.imageUrl && (
              <div className="flex justify-center">
                <img 
                  src={altTextDialog.imageUrl} 
                  alt="" 
                  className="max-w-full max-h-32 object-contain rounded"
                />
              </div>
            )}
            <div>
              <Label htmlFor="alt-text">{t('imageAltText')}</Label>
              <Textarea
                id="alt-text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder={t('imageAltPlaceholder')}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAltTextDialog({ open: false });
                setAltText('');
              }}
            >
              {t('cancel')}
            </Button>
            <Button onClick={insertImageWithAlt}>
              {t('insertImage')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}