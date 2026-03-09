import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Send, ThumbsUp, Reply, MoreVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: string;
  message: string;
  user_name: string;
  created_at: string;
  lesson_id: string;
}

interface DiscussionSectionProps {
  lessonId: string;
  userId?: string;
  userName?: string;
}

/**
 * Discussion/Comments Section
 * Connected to Supabase comments table
 */
const DiscussionSection: React.FC<DiscussionSectionProps> = ({
  lessonId,
  userId,
  userName = 'Anonymous',
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching comments:', error);
        toast({
          title: 'Error',
          description: 'Failed to load comments',
          variant: 'destructive',
        });
      } else {
        setComments(data || []);
      }
      
      setIsLoading(false);
    };

    if (lessonId) {
      fetchComments();
    }

    // Subscribe to realtime updates
    const channel = supabase
      .channel('comments-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `lesson_id=eq.${lessonId}`,
        },
        (payload) => {
          setComments((prev) => [payload.new as Comment, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [lessonId, toast]);

  const submitComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);

    const { error } = await supabase
      .from('comments')
      .insert({
        lesson_id: lessonId,
        message: newComment.trim(),
        user_name: userName,
        user_id: userId,
      } as any);

    setIsSubmitting(false);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to post comment',
        variant: 'destructive',
      });
    } else {
      setNewComment('');
      toast({
        title: 'Comment posted!',
        description: 'Your comment has been added to the discussion',
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-4">
      {/* New Comment Form */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Discussion ({comments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Ask a question or share your thoughts..."
                className="min-h-[80px] resize-none"
              />
              <div className="flex justify-end">
                <Button 
                  onClick={submitComment} 
                  disabled={!newComment.trim() || isSubmitting}
                  className="gap-2"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Posting...' : 'Post Comment'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <Card className="border-border">
            <CardContent className="py-8 text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">No comments yet</p>
              <p className="text-sm text-muted-foreground/70">
                Be the first to start a discussion!
              </p>
            </CardContent>
          </Card>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id} className="border-border">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                      {getInitials(comment.user_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-foreground">
                        {comment.user_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap">
                      {comment.message}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                        <ThumbsUp className="w-3.5 h-3.5" />
                        Like
                      </button>
                      <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                        <Reply className="w-3.5 h-3.5" />
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default DiscussionSection;
