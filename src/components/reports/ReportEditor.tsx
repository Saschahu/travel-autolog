import React, { useCallback, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  List, 
  ListOrdered, 
  Link as LinkIcon, 
  Palette, 
  Undo, 
  Redo, 
  Heading1, 
  Heading2,
  Image as ImageIcon
} from 'lucide-react';
import { resizeToJpeg, validateImageFile } from '@/lib/imageResize';
import { uploadReportImage } from '@/lib/uploads';

interface ReportEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export const ReportEditor: React.FC<ReportEditorProps> = ({
  content,
  onChange,
  placeholder,
  className = ''
}) => {
  const { t } = useTranslation('job');
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      Color,
      TextStyle,
    ],
    content,
    onUpdate: ({ editor }) => {
      // Convert to JSON for storage
      const json = editor.getJSON();
      onChange(JSON.stringify(json));
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm sm:prose lg:prose-sm xl:prose-sm mx-auto focus:outline-none min-h-[200px] p-3 ${className}`,
        placeholder: placeholder || '',
      },
    },
  });

  const handleImageInsert = useCallback(async () => {
    if (!fileInputRef.current) return;
    
    fileInputRef.current.click();
  }, []);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editor) return;

    // Reset file input
    event.target.value = '';

    // Validate file
    const validation = validateImageFile(file, 8);
    if (!validation.isValid) {
      toast({
        title: t('report.error.tooLarge'),
        description: validation.error,
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      // Resize image
      const resizedBlob = await resizeToJpeg(file, { maxEdge: 1600, quality: 0.85 });
      
      // Upload to Supabase
      const imageUrl = await uploadReportImage(resizedBlob);
      
      // Insert image into editor
      editor.chain().focus().setImage({ src: imageUrl, alt: file.name }).run();
      
      toast({
        title: 'Image inserted',
        description: 'Image has been uploaded and inserted successfully.',
      });
    } catch (error) {
      console.error('Error inserting image:', error);
      toast({
        title: t('report.error.uploadFailed'),
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  }, [editor, toast, t]);

  const addLink = useCallback(() => {
    const url = window.prompt('Enter URL:');
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  const setColor = useCallback((color: string) => {
    if (editor) {
      editor.chain().focus().setColor(color).run();
    }
  }, [editor]);

  if (!editor) {
    return <div className="animate-pulse bg-gray-200 h-64 rounded-lg" />;
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="border-b bg-gray-50 p-2 flex flex-wrap gap-1">
        {/* Text formatting */}
        <Button
          variant={editor.isActive('bold') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Button>
        
        <Button
          variant={editor.isActive('italic') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Button>
        
        <Button
          variant={editor.isActive('underline') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          disabled={!editor.can().chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>

        <div className="border-l mx-1" />

        {/* Headings */}
        <Button
          variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        
        <Button
          variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-4 w-4" />
        </Button>

        <div className="border-l mx-1" />

        {/* Lists */}
        <Button
          variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </Button>
        
        <Button
          variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="border-l mx-1" />

        {/* Link */}
        <Button
          variant={editor.isActive('link') ? 'default' : 'ghost'}
          size="sm"
          onClick={addLink}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>

        {/* Color */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setColor('#000000')}
          >
            <Palette className="h-4 w-4" />
          </Button>
          <input
            type="color"
            className="w-6 h-6 border rounded cursor-pointer"
            onChange={(e) => setColor(e.target.value)}
            title="Text color"
          />
        </div>

        <div className="border-l mx-1" />

        {/* Image */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleImageInsert}
          disabled={isUploading}
        >
          <ImageIcon className="h-4 w-4" />
          {isUploading && <span className="ml-1 text-xs">...</span>}
        </Button>

        <div className="border-l mx-1" />

        {/* Undo/Redo */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
        >
          <Undo className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <div className="min-h-[200px]">
        <EditorContent editor={editor} />
      </div>

      {/* Hidden file input for image selection */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Character counter */}
      <div className="border-t bg-gray-50 px-3 py-1 text-xs text-gray-500 text-right">
        {editor.storage.characterCount?.characters || 0} characters
      </div>
    </div>
  );
};