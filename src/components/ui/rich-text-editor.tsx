import React, { useCallback, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Image as ImageIcon,
  Undo,
  Redo
} from 'lucide-react';
import { processImage } from '@/lib/imageResize';
import { uploadReportImage } from '@/lib/supabase/storage';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ content, onChange, placeholder, className }: RichTextEditorProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [imageAlt, setImageAlt] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Check if images are enabled
  const imagesEnabled = import.meta.env.VITE_ENABLE_REPORT_IMAGES === 'true';

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          loading: 'lazy',
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || t('report.placeholder', 'Enter your report...'),
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const handleImageUpload = useCallback(async (file: File) => {
    if (!editor || !imagesEnabled) return;

    try {
      setIsUploading(true);

      // Process image (resize, convert, strip EXIF)
      const processedImage = await processImage(file);

      // Upload to Supabase storage
      const imageUrl = await uploadReportImage(processedImage.blob, file.name);

      // Insert image into editor
      editor.chain().focus().setImage({ 
        src: imageUrl, 
        alt: imageAlt || 'Report image' 
      }).run();

      setImageAlt('');
      setIsImageDialogOpen(false);

      toast({
        title: t('report.imageUploadSuccess', 'Image uploaded successfully'),
        description: t('report.imageProcessed', 'Image has been resized and optimized'),
      });

    } catch (error) {
      console.error('Image upload error:', error);
      
      let errorMessage = t('report.uploadFailed', 'Upload failed');
      if (error instanceof Error) {
        if (error.message.includes('too large')) {
          errorMessage = t('report.imageTooLarge', 'Image too large (max 8MB)');
        } else if (error.message.includes('Invalid file format')) {
          errorMessage = t('report.invalidFormat', 'Invalid file format');
        }
      }

      toast({
        title: t('report.uploadError', 'Upload Error'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  }, [editor, imagesEnabled, imageAlt, t, toast]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
    // Reset input
    event.target.value = '';
  }, [handleImageUpload]);

  if (!editor) {
    return null;
  }

  return (
    <div className={`border rounded-lg ${className || ''}`}>
      {/* Toolbar */}
      <div className="border-b p-2 flex flex-wrap gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-muted' : ''}
        >
          <Bold className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-muted' : ''}
        >
          <Italic className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-muted' : ''}
        >
          <List className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-muted' : ''}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {imagesEnabled ? (
          <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isUploading}
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('report.addImage', 'Add Image')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="image-alt">{t('report.altText', 'Alt text (required)')}</Label>
                  <Input
                    id="image-alt"
                    value={imageAlt}
                    onChange={(e) => setImageAlt(e.target.value)}
                    placeholder={t('report.altTextPlaceholder', 'Describe the image...')}
                  />
                </div>
                <div>
                  <Label htmlFor="image-file">{t('report.selectImage', 'Select Image')}</Label>
                  <Input
                    id="image-file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                    onChange={handleFileSelect}
                    disabled={isUploading || !imageAlt.trim()}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('report.imageRequirements', 'Max 8MB. JPEG, PNG, WebP, HEIC supported.')}
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled
            title={t('report.imagesDisabled', 'Images disabled')}
          >
            <ImageIcon className="h-4 w-4 opacity-50" />
          </Button>
        )}

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <div className="p-3 min-h-[200px]">
        <EditorContent 
          editor={editor} 
          className="prose prose-sm max-w-none [&_.ProseMirror]:outline-none [&_img]:max-w-full [&_img]:h-auto"
        />
      </div>

      {!imagesEnabled && (
        <div className="border-t bg-muted/30 p-2 text-sm text-muted-foreground">
          {t('report.imagesNotEnabled', 'Image uploads are disabled. Set VITE_ENABLE_REPORT_IMAGES=true to enable.')}
        </div>
      )}
    </div>
  );
}