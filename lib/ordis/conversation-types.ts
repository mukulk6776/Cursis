import type { ChatMessage } from '@/lib/dashboard/types';

export interface OrdisConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export type ChatConversation = OrdisConversation;
