import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import TopicSuggestions from "@/components/TopicSuggestions";
import TypingIndicator from "@/components/TypingIndicator";
import { streamChat, type ChatMessage as Msg } from "@/lib/streamChat";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session");

  const [messages, setMessages] = useState<Msg[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionId);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load session messages if session id is present
  useEffect(() => {
    if (sessionId && user) {
      loadSession(sessionId);
    } else if (!sessionId) {
      setMessages([]);
      setCurrentSessionId(null);
    }
  }, [sessionId, user]);

  const loadSession = async (sid: string) => {
    const { data } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("session_id", sid)
      .order("created_at", { ascending: true });
    if (data) setMessages(data as Msg[]);
    setCurrentSessionId(sid);
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = useCallback(
    async (input: string) => {
      // If not logged in, redirect to auth
      if (!user) {
        toast.info("Please create an account to start chatting!");
        navigate("/auth");
        return;
      }

      if (isLoading) return;
      const userMsg: Msg = { role: "user", content: input };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setIsLoading(true);

      // Create or get session
      let sid = currentSessionId;
      if (!sid) {
        const title = input.length > 50 ? input.slice(0, 50) + "..." : input;
        const { data, error } = await supabase
          .from("chat_sessions")
          .insert({ user_id: user.id, title })
          .select("id")
          .single();
        if (error || !data) {
          toast.error("Failed to create session");
          setIsLoading(false);
          return;
        }
        sid = data.id;
        setCurrentSessionId(sid);
      }

      // Save user message
      await supabase.from("chat_messages").insert({
        session_id: sid,
        user_id: user.id,
        role: "user",
        content: input,
      });

      let soFar = "";
      const upsert = (chunk: string) => {
        soFar += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: soFar } : m));
          }
          return [...prev, { role: "assistant", content: soFar }];
        });
      };

      try {
        await streamChat({
          messages: newMessages,
          onDelta: upsert,
          onDone: async () => {
            setIsLoading(false);
            // Save assistant message
            if (soFar && sid) {
              await supabase.from("chat_messages").insert({
                session_id: sid,
                user_id: user.id,
                role: "assistant",
                content: soFar,
              });
              // Update session title timestamp
              await supabase.from("chat_sessions").update({ updated_at: new Date().toISOString() }).eq("id", sid);
            }
          },
          onError: (err) => {
            toast.error(err);
            setIsLoading(false);
          },
        });
      } catch {
        toast.error("Failed to connect. Please try again.");
        setIsLoading(false);
      }
    },
    [messages, isLoading, user, currentSessionId, navigate]
  );

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
        {isEmpty ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center h-full px-4 py-12"
          >
            <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center glow-primary mb-6">
              <Sparkles className="h-8 w-8 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2 text-center">
              Master DSA with AI
            </h2>
            <p className="text-muted-foreground text-sm text-center max-w-md mb-8">
              Ask about any data structure or algorithm — from arrays to dynamic programming. Get clear explanations with code examples.
            </p>
            <TopicSuggestions onSelect={send} />
          </motion.div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChatMessage message={m} />
              </motion.div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <TypingIndicator />
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={send} disabled={isLoading} />
    </div>
  );
};

export default Index;
