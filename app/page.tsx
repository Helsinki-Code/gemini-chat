"use client";

import { GeminiAdvancedChat } from '@/components/gemini-chat';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f9fafb] dark:bg-zinc-900">
      <GeminiAdvancedChat />
    </main>
  );
}