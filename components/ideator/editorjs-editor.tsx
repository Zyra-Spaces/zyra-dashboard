'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Save, CheckCircle2 } from 'lucide-react';
import type { OutputData } from '@editorjs/editorjs';

interface EditorJSEditorProps {
  initialData?: OutputData | null;
  onChange?: (data: OutputData) => void;
  onSave?: (data: OutputData) => void;
  placeholder?: string;
  editable?: boolean;
  autoSave?: boolean;
  autoSaveInterval?: number; // milliseconds
  ideaId?: string; // For auto-saving to database
  className?: string;
}

export function EditorJSEditor({
  initialData,
  onChange,
  onSave,
  placeholder = 'Start writing your idea...',
  editable = true,
  autoSave = true,
  autoSaveInterval = 2000,
  ideaId,
  className = '',
}: EditorJSEditorProps) {
  const editorRef = useRef<any | null>(null);
  const holderRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Editor.js
  useEffect(() => {
    if (!holderRef.current || editorRef.current || typeof window === 'undefined') return;

    // Dynamically import Editor.js and tools only on client side
    const initEditor = async () => {
      const [
        { default: EditorJS },
        { default: Header },
        { default: List },
        { default: Paragraph },
        { default: Checklist },
        { default: Image },
        { default: Quote },
        { default: Table },
        { default: Code },
        { default: LinkTool },
      ] = await Promise.all([
        import('@editorjs/editorjs'),
        import('@editorjs/header'),
        import('@editorjs/list'),
        import('@editorjs/paragraph'),
        // @ts-ignore - No types available
        import('@editorjs/checklist'),
        import('@editorjs/image'),
        import('@editorjs/quote'),
        import('@editorjs/table'),
        import('@editorjs/code'),
        // @ts-ignore - No types available
        import('@editorjs/link'),
      ]);

      if (!holderRef.current) return;
      
      const editor = new EditorJS({
      holder: holderRef.current,
      data: initialData || undefined,
      placeholder,
      readOnly: !editable,
      autofocus: editable,
      tools: {
        header: Header,
        paragraph: Paragraph,
        list: List,
        checklist: Checklist,
        quote: Quote,
        code: Code,
        linkTool: LinkTool,
        image: {
          class: Image,
          config: {
            uploader: {
              async uploadByFile(file: File) {
                try {
                  setIsSaving(true);
                  const supabase = createClient();
                  
                  // Upload to Supabase Storage
                  const fileExt = file.name.split('.').pop();
                  const fileName = `${ideaId || 'temp'}/${Date.now()}.${fileExt}`;
                  const filePath = `idea-images/${fileName}`;

                  const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('idea-images')
                    .upload(filePath, file, {
                      cacheControl: '3600',
                      upsert: false,
                    });

                  if (uploadError) throw uploadError;

                  // Get public URL
                  const { data: { publicUrl } } = supabase.storage
                    .from('idea-images')
                    .getPublicUrl(filePath);

                  setIsSaving(false);
                  return {
                    success: 1,
                    file: {
                      url: publicUrl,
                    },
                  };
                } catch (error) {
                  console.error('Error uploading image:', error);
                  setIsSaving(false);
                  return {
                    success: 0,
                  };
                }
              },
              async uploadByUrl(url: string) {
                // For pasted URLs, return the URL directly (or implement upload logic)
                return {
                  success: 1,
                  file: {
                    url: url,
                  },
                };
              },
            },
          },
        },
        // @ts-ignore - Type mismatch
        table: Table,
      },
      onChange: async () => {
        if (!editorRef.current) return;

        try {
          const savedData = await editorRef.current.save();
          
          // Call onChange callback
          onChange?.(savedData);

          // Auto-save functionality
          if (autoSave && editable) {
            // Clear existing timeout
            if (saveTimeoutRef.current) {
              clearTimeout(saveTimeoutRef.current);
            }

            // Set new timeout
            saveTimeoutRef.current = setTimeout(async () => {
              setIsSaving(true);
              setIsSaved(false);

              try {
                // Call onSave callback
                onSave?.(savedData);

                // If ideaId is provided, save to database
                if (ideaId && savedData) {
                  const supabase = createClient();
                  const { error } = await supabase
                    .from('ideas')
                    .update({
                      editor_content: savedData,
                      updated_at: new Date().toISOString(),
                    })
                    .eq('id', ideaId);

                  if (error) throw error;
                }

                setIsSaved(true);
                setTimeout(() => setIsSaved(false), 2000);
              } catch (error) {
                console.error('Error auto-saving:', error);
              } finally {
                setIsSaving(false);
              }
            }, autoSaveInterval);
          }
        } catch (error) {
          console.error('Error saving editor data:', error);
        }
      },
    });

      editorRef.current = editor;
    };

    initEditor();

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, []); // Only run once on mount

  // Update editor content when initialData changes (but not on every render)
  useEffect(() => {
    if (editorRef.current && initialData && typeof window !== 'undefined') {
      editorRef.current.render(initialData);
    }
  }, [initialData]);

  // Manual save function
  const handleManualSave = async () => {
    if (!editorRef.current || typeof window === 'undefined') return;

    setIsSaving(true);
    setIsSaved(false);

    try {
      const savedData = await editorRef.current.save();
      onSave?.(savedData);

      if (ideaId && savedData) {
        const supabase = createClient();
        const { error } = await supabase
          .from('ideas')
          .update({
            editor_content: savedData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', ideaId);

        if (error) throw error;
      }

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Insert AI-generated content
  const insertAIContent = async (text: string, blockType: 'paragraph' | 'header' = 'paragraph') => {
    if (!editorRef.current || typeof window === 'undefined') return;

    try {
      const currentData = await editorRef.current.save();
      
      // Add new block
      const newBlock = blockType === 'header'
        ? {
            type: 'header',
            data: {
              text,
              level: 2,
            },
          }
        : {
            type: 'paragraph',
            data: {
              text,
            },
          };

      currentData.blocks.push(newBlock);
      await editorRef.current.render(currentData);
    } catch (error) {
      console.error('Error inserting AI content:', error);
    }
  };

  // Expose insertAIContent via ref (if needed)
  useEffect(() => {
    if (holderRef.current && editorRef.current && typeof window !== 'undefined') {
      (holderRef.current as any).insertAIContent = insertAIContent;
    }
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Save Status Indicator */}
      {editable && autoSave && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-2 text-xs text-gray-500">
          {isSaving && (
            <div className="flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Saving...</span>
            </div>
          )}
          {isSaved && !isSaving && (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle2 className="w-3 h-3" />
              <span>Saved</span>
            </div>
          )}
        </div>
      )}

      {/* Manual Save Button */}
      {editable && onSave && (
        <div className="absolute top-2 left-2 z-10">
          <button
            onClick={handleManualSave}
            disabled={isSaving}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#4780C6] text-white rounded-lg hover:bg-[#4780C6]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3 h-3" />
                <span>Save</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Editor Container - Notion-style */}
      <div
        ref={holderRef}
        className="editorjs-container min-h-[600px] bg-white"
      />

      {/* Editor.js Styles - Notion-inspired */}
      <style jsx global>{`
        .editorjs-container {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        .editorjs-container .codex-editor {
          min-height: 600px;
          padding: 96px 96px 96px 96px;
          max-width: 900px;
          margin: 0 auto;
        }
        .editorjs-container .codex-editor__redactor {
          padding-bottom: 200px;
        }
        .editorjs-container .ce-block__content {
          max-width: 100%;
          margin: 0;
        }
        .editorjs-container .ce-toolbar__content {
          max-width: 100%;
        }
        .editorjs-container .ce-toolbar__plus {
          left: -40px;
        }
        .editorjs-container .ce-toolbar__settings-btn {
          opacity: 0;
          transition: opacity 0.2s;
        }
        .editorjs-container .ce-block:hover .ce-toolbar__settings-btn {
          opacity: 1;
        }
        .editorjs-container .ce-paragraph {
          line-height: 1.6;
          margin: 1px 0;
          font-size: 16px;
          color: #37352f;
          padding: 3px 2px;
        }
        .editorjs-container .ce-paragraph[data-placeholder]:empty::before {
          color: rgba(55, 53, 47, 0.4);
          opacity: 1;
        }
        .editorjs-container .ce-header {
          margin: 2px 0;
          padding: 3px 2px;
          font-weight: 600;
          color: #37352f;
        }
        .editorjs-container .ce-header[data-level="1"] {
          font-size: 40px;
          line-height: 1.2;
          margin-top: 2em;
          margin-bottom: 4px;
        }
        .editorjs-container .ce-header[data-level="2"] {
          font-size: 30px;
          line-height: 1.3;
          margin-top: 1.4em;
          margin-bottom: 1px;
        }
        .editorjs-container .ce-header[data-level="3"] {
          font-size: 24px;
          line-height: 1.3;
          margin-top: 1em;
          margin-bottom: 1px;
        }
        .editorjs-container .ce-quote {
          border-left: 3px solid rgba(55, 53, 47, 0.16);
          padding: 0 14px;
          margin: 6px 0;
          font-style: normal;
          color: #37352f;
          background: transparent;
        }
        .editorjs-container .ce-code {
          background-color: rgba(135, 131, 120, 0.15);
          color: #eb5757;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
          font-size: 85%;
          margin: 0 2px;
        }
        .editorjs-container .ce-code-block {
          background-color: rgba(135, 131, 120, 0.15);
          color: #37352f;
          padding: 1em;
          border-radius: 3px;
          overflow-x: auto;
          margin: 1em 0;
          font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
          font-size: 14px;
        }
        .editorjs-container .ce-list {
          margin: 1px 0;
          padding-left: 1.5em;
        }
        .editorjs-container .ce-list__item {
          margin: 0;
          padding: 0;
        }
        .editorjs-container .ce-checklist {
          margin: 1px 0;
        }
        .editorjs-container .ce-checklist__item {
          margin: 0;
        }
        .editorjs-container .ce-table {
          margin: 1em 0;
          border-collapse: collapse;
        }
        .editorjs-container .ce-table__cell {
          border: 1px solid rgba(55, 53, 47, 0.16);
          padding: 8px;
        }
        .editorjs-container .ce-image {
          margin: 1em 0;
        }
        .editorjs-container .ce-image__picture img {
          max-width: 100%;
          height: auto;
          border-radius: 3px;
        }
        .editorjs-container .ce-block--selected {
          background-color: rgba(35, 131, 226, 0.14);
        }
        .editorjs-container .ce-block--focused {
          background-color: transparent;
        }
      `}</style>
    </div>
  );
}

// Export helper function to insert AI content
export async function insertAIContentIntoEditor(
  editorInstance: any,
  text: string,
  blockType: 'paragraph' | 'header' = 'paragraph'
) {
  if (typeof window === 'undefined') return;
  
  try {
    const currentData = await editorInstance.save();
    
    const newBlock = blockType === 'header'
      ? {
          type: 'header',
          data: {
            text,
            level: 2,
          },
        }
      : {
          type: 'paragraph',
          data: {
            text,
          },
        };

    currentData.blocks.push(newBlock);
    await editorInstance.render(currentData);
  } catch (error) {
    console.error('Error inserting AI content:', error);
  }
}

