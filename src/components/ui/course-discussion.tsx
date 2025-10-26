"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from '@/lib/supabase';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Link, 
  ImageIcon, 
  Send,
  Edit,
  Trash2,
  Reply,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DiscussionMessage {
  id: string;
  course_id: string;
  user_id: string;
  message: string;
  parent_id: string | null;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  user_name: string;
  user_email: string;
  avatar_url?: string;
}

interface CourseDiscussionProps {
  courseId: string;
  userId: string;
}

export default function CourseDiscussion({ courseId, userId }: CourseDiscussionProps) {
  const [messages, setMessages] = useState<DiscussionMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch messages on component mount
  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('course_discussions_with_users')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const insertTextAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = editingId ? editingText : newMessage;
    const newValue = currentValue.substring(0, start) + text + currentValue.substring(end);
    
    if (editingId) {
      setEditingText(newValue);
    } else {
      setNewMessage(newValue);
    }

    // Set cursor position after inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  const handleFormatting = (type: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    let formattedText = '';
    switch (type) {
      case 'bold':
        formattedText = `**${selectedText || 'bold text'}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText || 'italic text'}*`;
        break;
      case 'list':
        formattedText = `\n- ${selectedText || 'list item'}`;
        break;
      case 'orderedList':
        formattedText = `\n1. ${selectedText || 'list item'}`;
        break;
      case 'link':
        formattedText = `[${selectedText || 'link text'}](url)`;
        break;
      case 'image':
        formattedText = `![${selectedText || 'alt text'}](image-url)`;
        break;
    }

    insertTextAtCursor(formattedText);
  };

  const submitMessage = async () => {
    const messageText = editingId ? editingText : newMessage;
    if (!messageText.trim()) return;

    try {
      setSubmitting(true);

      if (editingId) {
        // Update existing message
        const { error } = await supabase
          .from('course_discussions')
          .update({ 
            message: messageText.trim(),
            is_edited: true 
          })
          .eq('id', editingId);

        if (error) throw error;
        
        setEditingId(null);
        setEditingText('');
      } else {
        // Insert new message
        const { error } = await supabase
          .from('course_discussions')
          .insert({
            course_id: courseId,
            user_id: userId,
            message: messageText.trim(),
            parent_id: replyingTo
          });

        if (error) throw error;
        
        setNewMessage('');
        setReplyingTo(null);
      }

      await fetchMessages();
    } catch (error) {
      console.error('Error submitting message:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('course_discussions')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      await fetchMessages();
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const startEditing = (message: DiscussionMessage) => {
    setEditingId(message.id);
    setEditingText(message.message);
    setReplyingTo(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingText('');
  };

  const startReply = (messageId: string) => {
    setReplyingTo(messageId);
    setEditingId(null);
    setEditingText('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const formatMessageText = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-sm rounded mt-2" />')
      .replace(/\n- (.*)/g, '<ul class="list-disc ml-4"><li>$1</li></ul>')
      .replace(/\n\d+\. (.*)/g, '<ol class="list-decimal ml-4"><li>$1</li></ol>');
  };

  const renderMessage = (message: DiscussionMessage, isReply = false) => {
    const isCurrentUser = message.user_id === userId;
    const replies = messages.filter(m => m.parent_id === message.id);

    return (
      <div key={message.id} className={`${isReply ? 'ml-8 mt-2' : 'mb-4'}`}>
        <div className="bg-gray-800 rounded-lg p-4">
          {/* Message Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {message.user_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <span className="text-white font-medium text-sm">{message.user_name}</span>
                <span className="text-gray-400 text-xs ml-2">
                  {new Date(message.created_at).toLocaleDateString()} {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {message.is_edited && <span className="ml-1">(edited)</span>}
                </span>
              </div>
            </div>
            
            {isCurrentUser && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-700 border-gray-600">
                  <DropdownMenuItem 
                    onClick={() => startEditing(message)}
                    className="text-white hover:bg-gray-600"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => deleteMessage(message.id)}
                    className="text-red-400 hover:bg-gray-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Message Content */}
          <div className="mb-2">
            {editingId === message.id ? (
              <div className="space-y-2">
                <Textarea
                  ref={textareaRef}
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Edit your message..."
                />
                <div className="flex space-x-2">
                  <Button 
                    onClick={submitMessage} 
                    disabled={submitting}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Save
                  </Button>
                  <Button 
                    onClick={cancelEditing} 
                    variant="outline" 
                    size="sm"
                    className="border-gray-600 text-white hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div 
                className="text-gray-200 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formatMessageText(message.message) }}
              />
            )}
          </div>

          {/* Reply Button */}
          {!isReply && editingId !== message.id && (
            <Button
              onClick={() => startReply(message.id)}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <Reply className="h-4 w-4 mr-1" />
              Reply
            </Button>
          )}
        </div>

        {/* Render Replies */}
        {replies.length > 0 && (
          <div className="mt-2">
            {replies.map(reply => renderMessage(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg sm:text-xl font-semibold text-white mb-3">Discussion</h3>
      
      {/* Message Composer */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
        {replyingTo && (
          <div className="mb-3 p-2 bg-gray-800 rounded text-sm text-gray-300">
            Replying to message...
            <Button 
              onClick={() => setReplyingTo(null)} 
              variant="ghost" 
              size="sm" 
              className="ml-2 text-gray-400 hover:text-white"
            >
              Cancel
            </Button>
          </div>
        )}
        
        {/* Formatting Toolbar */}
        <div className="flex flex-wrap gap-1 mb-3 p-2 bg-gray-800 rounded">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleFormatting('bold')}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleFormatting('italic')}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleFormatting('list')}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleFormatting('orderedList')}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleFormatting('link')}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <Link className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleFormatting('image')}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
            title="Insert image"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          <Textarea
            ref={textareaRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message here... Use **bold**, *italic*, [links](url), or ![images](url)"
            className="bg-gray-800 border-gray-600 text-white min-h-[100px]"
          />
          <div className="flex justify-end">
            <Button 
              onClick={submitMessage}
              disabled={submitting || !newMessage.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="h-4 w-4 mr-2" />
              {submitting ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 max-h-[600px] overflow-y-auto">
        {loading ? (
          <div className="text-center text-gray-400 py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            Loading messages...
          </div>
        ) : messages.filter(m => !m.parent_id).length > 0 ? (
          <div className="space-y-4">
            {messages
              .filter(message => !message.parent_id) // Only show top-level messages
              .map(message => renderMessage(message))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">
            <div className="text-4xl mb-4">💬</div>
            <p>No messages yet. Start the discussion!</p>
          </div>
        )}
      </div>
    </div>
  );
}