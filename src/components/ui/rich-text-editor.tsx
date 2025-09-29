// @ts-nocheck
/**
 * Simple rich text editor fallback component
 */

import React from 'react';
import { Textarea } from '@/components/ui/textarea';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  enableImages?: boolean;
}

export function RichTextEditor({ 
  content, 
  onChange, 
  placeholder = 'Enter text...', 
  className,
  enableImages 
}: RichTextEditorProps) {
  return (
    <Textarea
      value={content}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
      rows={8}
    />
  );
}