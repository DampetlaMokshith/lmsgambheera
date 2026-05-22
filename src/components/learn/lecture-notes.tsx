'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StickyNote, Save, Loader2, Trash2, BookOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface SavedNote {
  id: string;
  lecture_id: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface LectureNotesProps {
  courseId: string;
  lectureId: string;
  userId: string;
}

export default function LectureNotes({ courseId, lectureId, userId }: LectureNotesProps) {
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>([]);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [selectedNote, setSelectedNote] = useState<SavedNote | null>(null);

  // Load existing notes
  useEffect(() => {
    const loadNotes = async () => {
      try {
        const { data, error } = await supabase
          .from('user_lecture_notes')
          .select('notes, updated_at')
          .eq('user_id', userId)
          .eq('lecture_id', lectureId)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          setNotes(data.notes || '');
          setLastSaved(new Date(data.updated_at));
        }
      } catch (error) {
toast.error('Failed to load your notes');
      } finally {
        setIsLoading(false);
      }
    };

    loadNotes();
  }, [userId, lectureId]);

  // Load all saved notes for this course
  const loadAllNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('user_lecture_notes')
        .select('id, lecture_id, notes, created_at, updated_at')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      setSavedNotes(data || []);
      setShowNotesDialog(true);
    } catch (error) {
toast.error('Failed to load saved notes');
    }
  };

  const handleSaveNotes = async () => {
    if (!notes.trim()) {
      toast.error('Please write some notes before saving');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('user_lecture_notes')
        .upsert({
          user_id: userId,
          course_id: courseId,
          lecture_id: lectureId,
          notes: notes.trim(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,lecture_id'
        });

      if (error) throw error;

      setLastSaved(new Date());
      toast.success('Notes saved successfully!');
    } catch (error) {
toast.error('Failed to save notes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('user_lecture_notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', userId);

      if (error) throw error;

      setSavedNotes(savedNotes.filter(note => note.id !== noteId));
      toast.success('Note deleted successfully');
      
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
      }
    } catch (error) {
toast.error('Failed to delete note');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <Card className="bg-black border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white text-lg">
            <StickyNote className="w-5 h-5 text-yellow-500" />
            Lecture Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-accent rounded animate-pulse"></div>
            <div className="h-4 bg-accent rounded animate-pulse"></div>
            <div className="h-4 bg-accent rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white text-lg">
            <StickyNote className="w-5 h-5 text-yellow-500" />
            Lecture Notes
          </CardTitle>
          {lastSaved && (
            <span className="text-xs text-gray-500">
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-400 mt-1">
          Take notes while watching the lecture to help retain information
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Start typing your notes here...&#10;&#10;"
          className="min-h-[120px] bg-gray-800 border text-white placeholder:text-gray-500 focus:border-yellow-500 focus:ring-yellow-500/20 resize-none"
        />
        
        <Button
          onClick={handleSaveNotes}
          disabled={isSaving || !notes.trim()}
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Notes
            </>
          )}
        </Button>

        <Button
          onClick={loadAllNotes}
          variant="outline"
          className="w-full border text-gray-300 hover:bg-gray-800 hover:text-white"
        >
          <BookOpen className="w-4 h-4 mr-2" />
          View All Saved Notes
        </Button>

        <p className="text-xs text-gray-500 text-center">
          Your notes are private and only visible to you
        </p>
      </CardContent>

      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent className="bg-black border text-white max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-yellow-500" />
              All Saved Notes
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              View and manage all your notes for this course
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[500px] pr-4">
            {savedNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <StickyNote className="w-12 h-12 mb-3 opacity-50" />
                <p>No saved notes yet</p>
                <p className="text-sm">Start taking notes during lectures!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedNotes.map((note) => (
                  <Card key={note.id} className="bg-black border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <p className="text-xs text-gray-400">
                            {formatDate(note.updated_at)}
                          </p>
                        </div>
                        <Button
                          onClick={() => handleDeleteNote(note.id)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-950/50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="text-sm text-gray-300 whitespace-pre-wrap break-words">
                        {note.notes}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
