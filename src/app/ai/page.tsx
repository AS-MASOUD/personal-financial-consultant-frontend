"use client";

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Bot,
  Send,
  ShieldCheck,
  User,
  Wrench,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";

const SUGGESTED_PROMPTS = [
  "Explain my current financial position and net worth.",
  "Where is most of my money concentrated?",
  "Analyze my monthly cash flow and savings rate.",
  "What liabilities should I prioritize paying off first?",
  "Are my emergency fund cash reserves adequate?",
];

export default function AIAssistantPage() {
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<
    Array<{
      role: string;
      content: string;
      tool_calls?: Record<string, unknown>[] | Record<string, unknown> | null;
    }>
  >([
    {
      role: "assistant",
      content:
        "Welcome to your Financial Command Center Intelligence Layer. I can analyze your net worth, review asset concentration, diagnose debt structures, and simulate scenarios using deterministic backend calculations. How can I assist you today?",
    },
  ]);

  const chatMutation = useMutation({
    mutationFn: (text: string) => api.sendAIChat(text),
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.content,
          tool_calls: data.tool_calls,
        },
      ]);
    },
  });

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || chatMutation.isPending) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInputMessage("");
    chatMutation.mutate(text);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] space-y-4">
      {/* Header Info */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Bot className="h-5 w-5 text-indigo-500" />
            <span>Financial AI Assistant</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Natural language interpretation grounded in verified deterministic accounting rules
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Deterministic Tool Guardrails</span>
        </div>
      </div>

      {/* Suggested Prompts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => handleSend(prompt)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 text-slate-600 dark:text-slate-300 font-medium transition-all shrink-0 active:scale-95 text-[11px]"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 fin-card p-4 overflow-y-auto space-y-4">
        {messages.map((msg, index) => {
          const isUser = msg.role === "user";

          return (
            <div
              key={index}
              className={`flex gap-3 text-xs ${isUser ? "justify-end" : "justify-start"}`}
            >
              {!isUser && (
                <div className="h-7 w-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-2xl p-4 rounded-xl space-y-2 ${
                  isUser
                    ? "bg-slate-900 text-white dark:bg-sky-600 dark:text-white"
                    : "bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60"
                }`}
              >
                {/* Tool trace tag */}
                {!isUser && msg.tool_calls && (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20 mb-1">
                    <Wrench className="h-2.5 w-2.5" />
                    <span>Tool Invoked: get_financial_overview()</span>
                  </div>
                )}

                <div className="leading-relaxed whitespace-pre-line text-xs font-normal">
                  {msg.content}
                </div>
              </div>

              {isUser && (
                <div className="h-7 w-7 rounded-lg bg-slate-700 text-white flex items-center justify-center shrink-0">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          );
        })}

        {chatMutation.isPending && (
          <div className="flex gap-3 text-xs items-center text-slate-400">
            <div className="h-7 w-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
              <span>Querying verified accounting models & synthesizing analysis...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          placeholder="Ask a financial question, request concentration analysis, or scenario review..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || chatMutation.isPending}
          className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-40 flex items-center gap-1.5 shrink-0"
        >
          <Send className="h-4 w-4" />
          <span>Ask</span>
        </button>
      </form>
    </div>
  );
}
