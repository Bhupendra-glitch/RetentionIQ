import React, { useState, useRef, useEffect } from "react";
import { Message } from "../types";
import { Bot, Send, Sparkles, X, MessageSquare, CornerDownLeft, HelpCircle } from "lucide-react";

export default function AiMentorSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I am your Senior D2C Database & Growth Consultant Mentor. I've designed this SQL and behavioral analysis sandbox to help you decode customer lifetime values. Ask me any advanced SQL, Pandas, or Power BI question—or prompt me to suggest professional margin preservation strategies!"
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputValue).trim();
    if (!textToSend || isLoading) return;

    if (!customText) {
      setInputValue("");
    }

    const newUserMessage: Message = { role: "user", content: textToSend };
    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: messages
        })
      });

      if (!response.ok) {
        throw new Error("Endpoint failed");
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I reached out to the mentor satellite, but encountered a connection error. Please verify that your `GEMINI_API_KEY` is saved correctly in your **Settings > Secrets** panel!"
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const sampleQuestions = [
    "Explain how to construct rolling retention SQL window functions in PostgreSQL.",
    "Draft a playbook to sunset broad D2C promotions without hurting core conversion.",
    "Why does Category Diversity highly correlate with higher customer retention scores?"
  ];

  // Simple formatter to render linebreaks and bold text dynamically
  const formatMsgContent = (rawText: string) => {
    return rawText.split("\n").map((para, pIdx) => {
      if (!para) return <div key={pIdx} className="h-2"></div>;
      
      // Parse basic markdown bolds **word**
      const parts = para.split(/\*\*(.*?)\*\*/g);
      const elements = parts.map((part, partIdx) => {
        if (partIdx % 2 === 1) {
          return <strong key={partIdx} className="font-bold text-slate-900 dark:text-white">{part}</strong>;
        }
        return part;
      });

      // Handle simple list bullets
      if (para.startsWith("- ") || para.startsWith("* ")) {
        return (
          <li key={pIdx} className="list-disc pl-5 mt-1 leading-relaxed text-xs">
            {elements}
          </li>
        );
      }

      return (
        <p key={pIdx} className="leading-relaxed mt-1.5 text-xs">
          {elements}
        </p>
      );
    });
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          id="btn-open-mentor"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 p-4 bg-indigo-650 bg-indigo-600 border border-slate-750/30 text-white rounded-full shadow-lg hover:bg-indigo-700 hover:scale-105 transition-all flex items-center justify-center cursor-pointer"
        >
          <Bot className="w-6 h-6 animate-pulse" />
        </button>
      )}

      {/* Floating Sidebar Chat panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-2rem)] h-[580px] bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-slide-in">
          {/* Header Panel */}
          <div className="bg-slate-900 border-b border-slate-800 px-5 py-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-indigo-500/15 border border-indigo-400/20 text-indigo-400 rounded-lg">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <span className="block font-sans font-semibold text-xs text-white">Senior Growth Mentor</span>
                <span className="block text-[9px] font-mono text-emerald-400 uppercase tracking-wide">● Advisor Live Connection</span>
              </div>
            </div>
            
            <button
              id="btn-close-mentor"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Message Thread Area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-slate-50 text-left">
            {messages.map((m, mIdx) => (
              <div key={mIdx} className={`flex gap-3 max-w-[85%] ${m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
                <div className={`p-1 shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs ${m.role === "user" ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-800"}`}>
                  {m.role === "user" ? "U" : "M"}
                </div>
                <div className={`p-4 rounded-xl text-xs font-sans shadow-3xs leading-relaxed ${m.role === "user" ? "bg-indigo-600 text-white text-right" : "bg-white text-slate-705 text-slate-800 border border-slate-205 border-slate-100"}`}>
                  <div className="space-y-1.5 break-words">
                    {formatMsgContent(m.content)}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 max-w-[85%] mr-auto">
                <div className="p-1 shrink-0 w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-slate-750 animate-bounce" />
                </div>
                <div className="p-3 bg-white border border-slate-100 rounded-xl text-3xs font-mono text-slate-400 italic">
                  Mentor drafting strategy insights...
                </div>
              </div>
            )}
          </div>

          {/* Quick-select prompt help list */}
          <div className="bg-slate-50/70 border-t border-slate-100 p-2.5 space-y-1 text-left select-none">
            <span className="text-[10px] font-mono text-slate-450 text-slate-400 uppercase tracking-wide block flex items-center gap-1.5 px-2">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              Suggested Mentoring Exercises:
            </span>
            <div className="flex gap-2 overflow-x-auto pb-1 px-1.5 max-w-full">
              {sampleQuestions.map((sq, sqIdx) => (
                <button
                  key={sqIdx}
                  onClick={() => handleSendMessage(sq)}
                  disabled={isLoading}
                  className="shrink-0 max-w-xs text-4xs font-sans text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 px-2 py-1 rounded transition-colors text-ellipsis overflow-hidden whitespace-nowrap cursor-pointer"
                >
                  {sq}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Control Bar */}
          <div className="p-3 border-t border-slate-150 border-slate-100 bg-white flex gap-2 items-center">
            <input
              id="inp-chat"
              type="text"
              placeholder="Ask mentor a SQL database or strategic growth question..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendMessage();
              }}
              className="flex-1 font-sans text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              id="btn-chat-send"
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputValue.trim()}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white rounded-lg transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
