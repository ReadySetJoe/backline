import { z } from "zod";

export const messageSchema = z.object({
  conversationId: z.string().min(1),
  body: z.string().min(1, "Message cannot be empty").max(5000),
});

export type MessageInput = z.infer<typeof messageSchema>;
