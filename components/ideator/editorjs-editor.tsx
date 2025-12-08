'use client';

import { useEffect, useRef, useState } from 'react';
import EditorJS, { OutputData } from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Paragraph from '@editorjs/paragraph';
import Checklist from '@editorjs/checklist';
import Image from '@editorjs/image';
import Quote from '@editorjs/quote';
import Table from '@editorjs/table';
import Code from '@editorjs/code';
import LinkTool from '@editorjs/link';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Save, CheckCircle2 } from 'lucide-react';

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
  const editorRef = useRef<EditorJS | null>(null);
  const holderRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Editor.js
  useEffect(() => {
    if (!holderRef.current || editorRef.current) return;

    const editor = new EditorJS({
      holder: holderRef.current,
      data: initialData || undefined,
      placeholder,
      readOnly: !editable,
      autofocus: editable,
      tools: {
        header: {
          class: Header,
          config: {
            placeholder: 'Enter a header',
            levels: [1, 2, 3, 4],
            defaultLevel: 2,
          },
        },
        paragraph: {
          class: Paragraph,
          inlineToolbar: true,
        },
        list: {
          class: List,
          inlineToolbar: true,
          config: {
            defaultStyle: 'unordered',
          },
        },
        checklist: {
          class: Checklist,
          inlineToolbar: true,
        },
        quote: {
          class: Quote,
          inlineToolbar: true,
          shortcut: 'CMD+SHIFT+O',
          config: {
            quotePlaceholder: 'Enter a quote',
            captionPlaceholder: 'Quote\'s author',
          },
        },
        code: {
          class: Code,
          config: {
            placeholder: 'Enter code',
          },
        },
        linkTool: {
          class: LinkTool,
          config: {
            endpoint: '/api/link-preview', // Optional: for link previews
          },
        },
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
                // For pasted URLs, try to fetch and upload
                try {
                  const response = await fetch(url);
                  const blob = await response.blob();
                  const file = new File([blob], 'image.jpg', { type: blob.type });
                  return await uploadByFile(file);
                } catch (error) {
                  console.error('Error uploading from URL:', error);
                  return {
                    success: 0,
                  };
                }
              },
            },
          },
        },
        table: {
          class: Table,
          inlineToolbar: true,
          config: {
            rows: 2,
            cols: 2,
          },
        },
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
    if (editorRef.current && initialData) {
      editorRef.current.render(initialData);
    }
  }, [initialData]);

  // Manual save function
  const handleManualSave = async () => {
    if (!editorRef.current) return;

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
    if (!editorRef.current) return;

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
    if (holderRef.current && editorRef.current) {
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
  editorInstance: EditorJS,
  text: string,
  blockType: 'paragraph' | 'header' = 'paragraph'
) {
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

