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
        // @ts-expect-error - No types available
        { default: Checklist },
        { default: Image },
        { default: Quote },
        { default: Table },
        { default: Code },
        // @ts-expect-error - No types available
        { default: LinkTool },
      ] = await Promise.all([
        import('@editorjs/editorjs'),
        import('@editorjs/header'),
        import('@editorjs/list'),
        import('@editorjs/paragraph'),
        import('@editorjs/checklist'),
        import('@editorjs/image'),
        import('@editorjs/quote'),
        import('@editorjs/table'),
        import('@editorjs/code'),
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

      {/* Editor Container */}
      <div
        ref={holderRef}
        className="editorjs-container min-h-[400px] border border-gray-200 rounded-lg bg-white p-4"
      />

      {/* Editor.js Styles */}
      <style jsx global>{`
        .editorjs-container .codex-editor {
          min-height: 400px;
        }
        .editorjs-container .codex-editor__redactor {
          padding-bottom: 100px;
        }
        .editorjs-container .ce-block__content {
          max-width: 100%;
        }
        .editorjs-container .ce-toolbar__content {
          max-width: 100%;
        }
        .editorjs-container .ce-paragraph {
          line-height: 1.6;
          margin: 0.5rem 0;
        }
        .editorjs-container .ce-header {
          margin: 1rem 0 0.5rem 0;
        }
        .editorjs-container .ce-quote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: #6b7280;
        }
        .editorjs-container .ce-code {
          background-color: #1f2937;
          color: #f9fafb;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1rem 0;
        }
        .editorjs-container .ce-list {
          margin: 0.5rem 0;
        }
        .editorjs-container .ce-checklist {
          margin: 0.5rem 0;
        }
        .editorjs-container .ce-table {
          margin: 1rem 0;
        }
        .editorjs-container .ce-image {
          margin: 1rem 0;
        }
        .editorjs-container .ce-image__picture img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
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

