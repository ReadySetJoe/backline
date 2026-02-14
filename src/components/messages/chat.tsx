"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getPusherClient } from "@/lib/pusher/client";
import { MessageInput } from "@/components/messages/message-input";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderEmail: string;
  body: string;
  read: boolean;
  createdAt: string;
}

interface ChatProps {
  conversationId: string;
  initialMessages: ChatMessage[];
  currentUserId: string;
  currentUserEmail: string;
  otherPartyName: string;
  showTitle: string | null;
  artistName: string;
  venueName: string;
}

function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatMessageDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

export function Chat({
  conversationId,
  initialMessages,
  currentUserId,
  currentUserEmail,
  otherPartyName,
  showTitle,
  artistName,
  venueName,
}: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Scroll to bottom on initial load
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
  }, []);

  // Subscribe to Pusher channel for real-time updates
  useEffect(() => {
    let channel: ReturnType<ReturnType<typeof getPusherClient>["subscribe"]>;

    try {
      const pusher = getPusherClient();
      channel = pusher.subscribe(`conversation-${conversationId}`);

      channel.bind("new-message", (data: ChatMessage) => {
        setMessages((prev) => {
          // Skip if this message is from the current user (we already added it optimistically)
          if (data.senderId === currentUserId) {
            // Replace optimistic message with real one if it exists
            const optimisticIndex = prev.findIndex(
              (m) =>
                m.id.startsWith("optimistic-") &&
                m.senderId === currentUserId &&
                m.body === data.body
            );
            if (optimisticIndex !== -1) {
              const updated = [...prev];
              updated[optimisticIndex] = data;
              return updated;
            }
            // Already have this message (not optimistic), skip
            if (prev.some((m) => m.id === data.id)) {
              return prev;
            }
          }

          // Skip duplicate messages
          if (prev.some((m) => m.id === data.id)) {
            return prev;
          }

          return [...prev, data];
        });
        scrollToBottom();
      });
    } catch {
      // Pusher not configured — real-time updates won't work but chat still functions
      console.warn("Pusher not available, real-time updates disabled");
    }

    return () => {
      try {
        const pusher = getPusherClient();
        pusher.unsubscribe(`conversation-${conversationId}`);
      } catch {
        // Ignore cleanup errors
      }
    };
  }, [conversationId, currentUserId, scrollToBottom]);

  function handleMessageSent(message: ChatMessage) {
    setMessages((prev) => [...prev, message]);
    scrollToBottom();
  }

  // Group messages by date
  const messagesByDate: { date: string; messages: ChatMessage[] }[] = [];
  let currentDate = "";

  for (const msg of messages) {
    const msgDate = formatMessageDate(msg.createdAt);
    if (msgDate !== currentDate) {
      currentDate = msgDate;
      messagesByDate.push({ date: msgDate, messages: [msg] });
    } else {
      messagesByDate[messagesByDate.length - 1].messages.push(msg);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      {/* Match context bar */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 bg-card border-b border-border">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/messages"
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <h2 className="font-semibold text-sm truncate">
              {otherPartyName}
            </h2>
            <p className="text-xs text-muted-foreground truncate">
              {showTitle || "Match conversation"} — {artistName} / {venueName}
            </p>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-muted-foreground text-sm">
              No messages yet. Say hello!
            </p>
          </div>
        )}

        {messagesByDate.map((group) => (
          <div key={group.date}>
            <div className="flex items-center gap-2 my-4">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {group.date}
              </span>
              <Separator className="flex-1" />
            </div>

            <div className="space-y-2">
              {group.messages.map((msg) => {
                const isOwn = msg.senderId === currentUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-lg px-3 py-2 ${
                        isOwn
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {!isOwn && (
                        <p className="text-xs font-medium mb-0.5 opacity-70">
                          {otherPartyName}
                        </p>
                      )}
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {msg.body}
                      </p>
                      <p
                        className={`text-[10px] mt-1 ${
                          isOwn ? "text-primary-foreground/60" : "text-muted-foreground"
                        }`}
                      >
                        {formatMessageTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <MessageInput
        conversationId={conversationId}
        onMessageSent={handleMessageSent}
        currentUserId={currentUserId}
        currentUserEmail={currentUserEmail}
      />
    </div>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
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
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}
