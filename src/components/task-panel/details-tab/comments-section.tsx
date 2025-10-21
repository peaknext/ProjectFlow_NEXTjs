'use client';

import { useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useTaskComments, useCreateComment } from '@/hooks/use-tasks';
import { useCurrentUser } from '@/hooks/use-session';
import { useTaskPermissions } from '@/hooks/use-task-permissions';
import { MentionInput, MentionInputRef } from '@/components/ui/mention-input';
import { UserAvatar } from '@/components/common/user-avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';

interface Task {
  id: string;
  isClosed?: boolean;
}

interface User {
  id: string;
  fullName: string;
  email: string;
  profileImageUrl?: string | null;
}

interface Comment {
  id: string;
  taskId: string;
  text: string;
  mentions: string[] | null;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

interface CommentsSectionProps {
  taskId: string;
  task?: Task | null;
  users?: User[];
}

/**
 * CommentsSection Component
 *
 * Displays and manages task comments.
 * Features:
 * - List all comments sorted by newest first
 * - Shows commenter avatar + name + timestamp
 * - Mentions rendered as highlighted tags
 * - Rich text input with @ mention autocomplete (Tribute.js)
 * - Submit button (disabled until text entered)
 * - Current user avatar in input area
 * - Disabled for closed tasks
 * - Loading skeleton
 *
 * @example
 * <CommentsSection
 *   taskId={task.id}
 *   task={task}
 *   users={projectUsers}
 * />
 */
export function CommentsSection({
  taskId,
  task,
  users = []
}: CommentsSectionProps) {
  const permissions = useTaskPermissions(task);
  const { data: currentUser } = useCurrentUser();
  const inputRef = useRef<MentionInputRef>(null);

  // Fetch comments
  const { data: commentsData, isLoading } = useTaskComments(taskId);
  const comments = commentsData?.comments || [];

  // Mutation
  const { mutate: createComment, isPending: isSubmitting } = useCreateComment(taskId);

  // Format relative time
  const formatRelativeTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true, locale: th });
    } catch (error) {
      return timestamp;
    }
  };

  // Handle comment submit
  const handleSubmit = (text: string, mentionedUserIds: string[]) => {
    if (!text.trim()) return;

    createComment(
      {
        content: text.trim(),
        mentionedUserIds: mentionedUserIds
      },
      {
        onSuccess: () => {
          inputRef.current?.clear();
        }
      }
    );
  };

  // Render comment text with mentions highlighted
  const renderCommentText = (comment: Comment) => {
    let text = comment.text;

    // Replace mentions with highlighted spans
    if (comment.mentions && Array.isArray(comment.mentions)) {
      comment.mentions.forEach((userId) => {
        const user = users.find(u => u.id === userId);
        if (user) {
          const mentionRegex = new RegExp(`@${user.fullName}`, 'g');
          text = text.replace(
            mentionRegex,
            `<strong class="text-primary font-semibold bg-primary/10 dark:bg-primary/20 px-1 py-0.5 rounded-md">@${user.fullName}</strong>`
          );
        }
      });
    }

    return <span dangerouslySetInnerHTML={{ __html: text }} />;
  };

  return (
    <div className="border-t border-slate-200 dark:border-slate-700/50 pt-8 space-y-6">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
        ความคิดเห็น
      </h3>

      {/* Comment form */}
      {permissions.canComment && (
        <div className="flex items-start gap-4">
          {/* Current user avatar */}
          <UserAvatar
            user={currentUser ? {
              fullName: currentUser.name || 'Unknown User',
              email: currentUser.email,
              profileImageUrl: currentUser.avatar || null
            } : null}
            size="lg"
            className="flex-shrink-0"
          />

          {/* Comment input */}
          <div className="flex-1 space-y-2">
            <MentionInput
              ref={inputRef}
              users={users}
              onSubmit={handleSubmit}
              placeholder="เพิ่มความคิดเห็น... (ใช้ @ เพื่อกล่าวถึง)"
              disabled={isSubmitting}
              minHeight="100px"
            />

            <div className="flex justify-end">
              <Button
                onClick={() => {
                  if (inputRef.current) {
                    const content = inputRef.current.getContent();
                    const mentions = inputRef.current.getMentionedUserIds();
                    handleSubmit(content, mentions);
                  }
                }}
                disabled={isSubmitting}
                className="h-[38px] min-w-[170px]"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <span>ส่งความคิดเห็น</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comments list */}
      {!isLoading && comments.length > 0 && (
        <div className="space-y-4">
          {comments
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((comment) => (
              <div key={comment.id} className="flex items-start gap-4">
                {/* User avatar */}
                <UserAvatar
                  user={comment.user || null}
                  size="lg"
                  className="flex-shrink-0"
                />

                {/* Comment content with background */}
                <div className="flex-1 min-w-0 bg-slate-100 dark:bg-slate-800/50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-semibold text-sm text-foreground">
                      {comment.user?.fullName || 'Unknown User'}
                    </span>
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                      {formatRelativeTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground break-words">
                    {renderCommentText(comment)}
                  </p>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && comments.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">
          ยังไม่มีความคิดเห็น
        </p>
      )}
    </div>
  );
}
