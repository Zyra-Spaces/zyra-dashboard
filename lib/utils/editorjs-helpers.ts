import { OutputData } from '@editorjs/editorjs';

/**
 * Convert AI-generated text to Editor.js blocks
 */
export function convertTextToEditorBlocks(text: string): OutputData {
  const blocks: OutputData['blocks'] = [];
  const lines = text.split('\n').filter(line => line.trim());

  for (const line of lines) {
    const trimmed = line.trim();

    // Headers (markdown format: **Title:** or # Title)
    if (trimmed.startsWith('**') && trimmed.includes(':**')) {
      const headerText = trimmed.replace(/\*\*/g, '').split(':')[0].trim();
      blocks.push({
        type: 'header',
        data: {
          text: headerText,
          level: 2,
        },
      });
    } else if (trimmed.startsWith('#')) {
      const level = trimmed.match(/^#+/)?.[0].length || 1;
      const headerText = trimmed.replace(/^#+\s*/, '');
      blocks.push({
        type: 'header',
        data: {
          text: headerText,
          level: Math.min(level, 4) as 1 | 2 | 3 | 4,
        },
      });
    }
    // List items
    else if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.match(/^\d+\.\s/)) {
      // Check if we're already in a list block
      const lastBlock = blocks[blocks.length - 1];
      if (lastBlock?.type === 'list') {
        const listItem = trimmed.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '');
        (lastBlock.data as any).items.push(listItem);
      } else {
        const listItem = trimmed.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '');
        blocks.push({
          type: 'list',
          data: {
            style: trimmed.startsWith('-') || trimmed.startsWith('*') ? 'unordered' : 'ordered',
            items: [listItem],
          },
        });
      }
    }
    // Paragraphs
    else if (trimmed.length > 0) {
      blocks.push({
        type: 'paragraph',
        data: {
          text: trimmed,
        },
      });
    }
  }

  // If no blocks were created, create a paragraph with the full text
  if (blocks.length === 0) {
    blocks.push({
      type: 'paragraph',
      data: {
        text: text.trim(),
      },
    });
  }

  return {
    time: Date.now(),
    blocks,
    version: '2.28.0',
  };
}

/**
 * Convert Editor.js blocks to plain text (for legacy compatibility)
 */
export function convertEditorBlocksToText(data: OutputData | null | undefined): string {
  if (!data || !data.blocks || !Array.isArray(data.blocks)) {
    return '';
  }
  return data.blocks
    .map(block => {
      if (block.type === 'header') {
        return (block.data as any).text;
      }
      if (block.type === 'paragraph') {
        return (block.data as any).text;
      }
      if (block.type === 'list') {
        const items = (block.data as any).items || [];
        return items.map((item: string) => `- ${item}`).join('\n');
      }
      if (block.type === 'quote') {
        return `> ${(block.data as any).text}`;
      }
      return '';
    })
    .filter(Boolean)
    .join('\n\n');
}



