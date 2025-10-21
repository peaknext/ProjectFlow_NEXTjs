'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import { cn } from '@/lib/utils';
import type Tribute from 'tributejs';

interface User {
  id: string;
  fullName: string;
  profileImageUrl?: string | null;
}

interface MentionInputProps {
  users: User[];
  value?: string;
  onChange?: (value: string, mentionedUserIds: string[]) => void;
  onSubmit?: (value: string, mentionedUserIds: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  minHeight?: string;
}

export interface MentionInputRef {
  focus: () => void;
  clear: () => void;
  getContent: () => string;
  getMentionedUserIds: () => string[];
}

/**
 * MentionInput Component
 *
 * ContentEditable div with @ mention autocomplete support via Tribute.js.
 * Features:
 * - @ mention autocomplete
 * - User search dropdown
 * - Mention rendering (styled tags)
 * - Extract mentions on submit
 * - Placeholder support
 * - Dark mode support
 *
 * @example
 * <MentionInput
 *   users={projectUsers}
 *   placeholder="เพิ่มความคิดเห็น... (ใช้ @ เพื่อกล่าวถึง)"
 *   onSubmit={(text, mentionIds) => handleSubmit(text, mentionIds)}
 *   disabled={isClosed}
 * />
 */
export const MentionInput = forwardRef<MentionInputRef, MentionInputProps>(
  function MentionInput(
    {
      users,
      value = '',
      onChange,
      onSubmit,
      placeholder = 'เพิ่มความคิดเห็น... (ใช้ @ เพื่อกล่าวถึง)',
      disabled = false,
      className,
      minHeight = '100px'
    },
    ref
  ) {
    const editorRef = useRef<HTMLDivElement>(null);
    const tributeRef = useRef<Tribute<User> | null>(null);

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
      focus: () => {
        editorRef.current?.focus();
      },
      clear: () => {
        if (editorRef.current) {
          editorRef.current.innerHTML = '';
        }
      },
      getContent: () => {
        return editorRef.current?.textContent || '';
      },
      getMentionedUserIds: () => {
        return extractMentionedUserIds();
      }
    }));

    // Extract mentioned user IDs from content
    const extractMentionedUserIds = (): string[] => {
      if (!editorRef.current) return [];

      const mentionElements = editorRef.current.querySelectorAll(
        '[data-mention-id]'
      );
      const userIds: string[] = [];

      mentionElements.forEach((el) => {
        const userId = el.getAttribute('data-mention-id');
        if (userId && !userIds.includes(userId)) {
          userIds.push(userId);
        }
      });

      return userIds;
    };

    // Initialize Tribute.js (client-side only)
    useEffect(() => {
      if (!editorRef.current || disabled || typeof window === 'undefined') return;

      // Dynamic import to avoid SSR issues
      import('tributejs').then(({ default: Tribute }) => {
        // Also import CSS dynamically
        import('tributejs/dist/tribute.css');

        if (!editorRef.current) return;

        // Detach existing tribute if any
        if (tributeRef.current && editorRef.current) {
          tributeRef.current.detach(editorRef.current);
          tributeRef.current = null;
        }

        const tribute = new Tribute<User>({
          trigger: '@',
          values: (text: string, cb: (data: User[]) => void) => {
            const filtered = users.filter((user) =>
              user.fullName.toLowerCase().includes(text.toLowerCase())
            );
            cb(filtered);
          },
          lookup: 'fullName',
          fillAttr: 'fullName',
          menuItemTemplate: (item) => {
            return `
              <div class="flex items-center gap-3 px-4 py-2">
                <img
                  class="w-8 h-8 rounded-full object-cover"
                  src="${item.original.profileImageUrl || 'https://ssl.gstatic.com/s2/profiles/images/silhouette96.png'}"
                  alt="${item.original.fullName}"
                />
                <span class="font-medium text-foreground">${item.original.fullName}</span>
              </div>
            `;
          },
          selectTemplate: (item) => {
            return `<strong class="mention text-primary font-semibold bg-primary/10 dark:bg-primary/20 px-1 py-0.5 rounded-md" contenteditable="false" data-mention-id="${item.original.id}">@${item.original.fullName}</strong> `;
          },
          noMatchTemplate: () => {
            return '<li class="p-2"><em class="text-muted-foreground">ไม่พบรายชื่อที่ตรงกัน</em></li>';
          },
          menuShowMinLength: 0,
          menuItemLimit: 10,
          allowSpaces: true,
          requireLeadingSpace: false
        });

        tribute.attach(editorRef.current!);
        tributeRef.current = tribute;
      });

      return () => {
        if (tributeRef.current && editorRef.current) {
          tributeRef.current.detach(editorRef.current);
          tributeRef.current = null;
        }
      };
    }, [users, disabled]);

    // Handle input change
    const handleInput = () => {
      if (!editorRef.current || !onChange) return;

      const text = editorRef.current.textContent || '';
      const mentionedUserIds = extractMentionedUserIds();

      onChange(text, mentionedUserIds);
    };

    // Handle Enter key
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      // Cmd/Ctrl + Enter to submit
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && onSubmit) {
        e.preventDefault();

        const text = editorRef.current?.textContent || '';
        const mentionedUserIds = extractMentionedUserIds();

        if (text.trim()) {
          onSubmit(text, mentionedUserIds);
          if (editorRef.current) {
            editorRef.current.innerHTML = '';
          }
        }
      }
    };

    // Prevent default paste behavior (paste as plain text)
    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');
      document.execCommand('insertText', false, text);
    };

    return (
      <div className={cn('relative', className)}>
        <div
          ref={editorRef}
          contentEditable={!disabled}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          data-placeholder={placeholder}
          className={cn(
            'w-full rounded-lg border border-input px-3 py-2 text-base',
            'bg-white dark:bg-background text-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'overflow-y-auto',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            // Placeholder styling
            'empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground empty:before:pointer-events-none',
            className
          )}
          style={{
            minHeight
          }}
          aria-label={placeholder}
          role="textbox"
          aria-multiline="true"
        />

        {/* Tribute menu will be rendered here by the library */}
      </div>
    );
  }
);

/**
 * CommentInput Component (Specialized for comments)
 *
 * Pre-configured MentionInput for comment sections.
 */
interface CommentInputProps {
  users: User[];
  onSubmit: (text: string, mentionedUserIds: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function CommentInput({
  users,
  onSubmit,
  disabled = false,
  placeholder = 'เพิ่มความคิดเห็น... (ใช้ @ เพื่อกล่าวถึง)',
  className
}: CommentInputProps) {
  const inputRef = useRef<MentionInputRef>(null);

  const handleSubmit = () => {
    if (!inputRef.current) return;

    const content = inputRef.current.getContent();
    const mentionedUserIds = inputRef.current.getMentionedUserIds();

    if (content.trim()) {
      onSubmit(content, mentionedUserIds);
      inputRef.current.clear();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div onKeyDown={handleKeyDown}>
        <MentionInput
          ref={inputRef}
          users={users}
          placeholder={placeholder}
          disabled={disabled}
          minHeight="100px"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={disabled}
          className={cn(
            'flex items-center justify-center px-4 py-2',
            'bg-primary text-primary-foreground text-sm font-semibold',
            'rounded-lg shadow-md',
            'hover:bg-primary/90',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'transition-all',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'h-[38px] min-w-[170px]'
          )}
        >
          <span>ส่งความคิดเห็น</span>
        </button>
      </div>
    </div>
  );
}
