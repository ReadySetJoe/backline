"use client";

import { useState, useTransition, useRef } from "react";
import { Button } from "@/components/ui/button";
import { sendMessage } from "@/actions/message";

interface MessageInputProps {
  conversationId: string;
  onMessageSent: (message: {
    id: string;
    conversationId: string;
    senderId: string;
    senderEmail: string;
    body: string;
    read: boolean;
    createdAt: string;
  }) => void;
  currentUserId: string;
  currentUserEmail: string;
}

export function MessageInput({
  conversationId,
  onMessageSent,
  currentUserId,
  currentUserEmail,
}: MessageInputProps) {
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit() {
    const trimmed = body.trim();
    if (!trimmed) return;

    // Optimistic: add message to local state immediately
    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticMessage = {
      id: optimisticId,
      conversationId,
      senderId: currentUserId,
      senderEmail: currentUserEmail,
      body: trimmed,
      read: false,
      createdAt: new Date().toISOString(),
    };

    onMessageSent(optimisticMessage);
    setBody("");

    startTransition(async () => {
      await sendMessage({ conversationId, body: trimmed });
      // The real message will arrive via Pusher and reconcile
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="flex items-end gap-2 border-t border-border p-4 bg-card">
      <textarea
        ref={textareaRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        rows={1}
        className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[40px] max-h-[120px]"
        disabled={isPending}
      />
      <Button
        size="sm"
        onClick={handleSubmit}
        disabled={isPending || !body.trim()}
      >
        <SendIcon className="h-4 w-4" />
        <span className="sr-only">Send</span>
      </Button>
    </div>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}
