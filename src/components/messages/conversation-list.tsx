"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export interface ConversationSummary {
  id: string;
  otherPartyName: string;
  showTitle: string | null;
  lastMessageBody: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

interface ConversationListProps {
  conversations: ConversationSummary[];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}

export function ConversationList({ conversations }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <MessageCircleIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h2 className="text-lg font-semibold text-muted-foreground">
          No conversations yet
        </h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Like some matches to start chatting! When both sides are interested,
          a conversation will open automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((convo) => (
        <Link key={convo.id} href={`/messages/${convo.id}`}>
          <Card className="transition-shadow hover:shadow-md cursor-pointer">
            <CardContent className="flex items-center gap-3 py-3 px-4">
              <Avatar>
                <AvatarFallback>{getInitials(convo.otherPartyName)}</AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm truncate">
                    {convo.otherPartyName}
                  </span>
                  {convo.lastMessageAt && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimeAgo(convo.lastMessageAt)}
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {convo.showTitle || "Match conversation"}
                </p>

                {convo.lastMessageBody && (
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    {truncate(convo.lastMessageBody, 80)}
                  </p>
                )}
              </div>

              {convo.unreadCount > 0 && (
                <Badge variant="default" className="rounded-full text-xs px-2 py-0.5">
                  {convo.unreadCount}
                </Badge>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function MessageCircleIcon({ className }: { className?: string }) {
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
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}
