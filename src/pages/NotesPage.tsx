import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { StickyNote, Plus, Trash2, Save, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";

type Note = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

const NotesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    fetchNotes();
  }, [user]);

  const fetchNotes = async () => {
    const { data, error } = await supabase.from("notes").select("*").order("updated_at", { ascending: false });
    if (error) toast.error("Failed to load notes");
    else setNotes(data || []);
    setLoading(false);
  };

  const saveNote = async () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    if (!user) return;

    if (editing) {
      const { error } = await supabase.from("notes").update({ title: title.trim(), content }).eq("id", editing.id);
      if (error) toast.error("Failed to update");
      else { toast.success("Note updated"); fetchNotes(); setEditing(null); }
    } else {
      const { error } = await supabase.from("notes").insert({ title: title.trim(), content, user_id: user.id });
      if (error) toast.error("Failed to create note");
      else { toast.success("Note created"); fetchNotes(); }
    }
    setTitle("");
    setContent("");
  };

  const deleteNote = async (id: string) => {
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const startEdit = (note: Note) => {
    setEditing(note);
    setTitle(note.title);
    setContent(note.content);
  };

  const cancelEdit = () => {
    setEditing(null);
    setTitle("");
    setContent("");
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 overflow-y-auto p-4 sm:p-6">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-xl font-bold text-foreground mb-1">Notes</h2>
        <p className="text-sm text-muted-foreground mb-6">Save your DSA study notes</p>

        {/* Note form */}
        <motion.div layout className="bg-card border border-border rounded-xl p-4 mb-6">
          <Input
            placeholder="Note title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-secondary border-border mb-3"
          />
          <Textarea
            placeholder="Write your notes here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="bg-secondary border-border mb-3 resize-none"
          />
          <div className="flex gap-2">
            <Button onClick={saveNote} size="sm" className="gap-1.5">
              {editing ? <Save className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {editing ? "Update" : "Add Note"}
            </Button>
            {editing && (
              <Button variant="ghost" size="sm" onClick={cancelEdit} className="gap-1.5">
                <X className="h-3.5 w-3.5" /> Cancel
              </Button>
            )}
          </div>
        </motion.div>

        {/* Notes list */}
        {notes.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <StickyNote className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No notes yet. Create your first note!</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <AnimatePresence>
              {notes.map((note) => (
                <motion.div
                  key={note.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3
                      className="text-sm font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
                      onClick={() => startEdit(note)}
                    >
                      {note.title}
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => deleteNote(note.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-3 mb-2">{note.content || "Empty note"}</p>
                  <p className="text-[10px] text-muted-foreground/60">
                    {format(new Date(note.updated_at), "MMM d, yyyy")}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default NotesPage;
