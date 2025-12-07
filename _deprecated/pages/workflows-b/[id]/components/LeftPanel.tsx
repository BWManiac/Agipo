"use client";

import { useState, useRef, useEffect } from "react";
import { useWorkflowsBStore } from "../../editor/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Send, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight,
  User,
  Bot,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Message in the chat history
 */
type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

/**
 * Quick prompt suggestions
 */
const QUICK_PROMPTS = [
  "Add a step to scrape a URL",
  "Send results via email",
  "Add error handling",
  "Connect to my Gmail",
];

/**
 * LeftPanel - AI Chat Sidebar
 * Based on Variation 1 (lines 138-254)
 * 
 * Provides an AI assistant that can help build the workflow through
 * natural language commands.
 */
export function LeftPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm your workflow assistant. Tell me what you want to automate and I'll help you build it step by step.",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const isLeftPanelCollapsed = useWorkflowsBStore(state => state.isLeftPanelCollapsed);
  const toggleLeftPanel = useWorkflowsBStore(state => state.toggleLeftPanel);
  const workflow = useWorkflowsBStore(state => state.workflow);
  
  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    
    // Simulate AI response (in real implementation, this would call an AI endpoint)
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: getSimulatedResponse(userMessage.content, workflow?.name || "workflow"),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };
  
  const handleQuickPrompt = (prompt: string) => {
    setInputValue(prompt);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  // Collapsed state
  if (isLeftPanelCollapsed) {
    return (
      <aside className="w-12 border-r border-gray-200 bg-gray-50 flex flex-col items-center py-4 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleLeftPanel}
          className="text-gray-400 hover:text-gray-600"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <div className="mt-4 w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      </aside>
    );
  }
  
  return (
    <aside className="w-72 border-r border-gray-200 bg-gray-50 flex flex-col shrink-0">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 bg-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-medium text-gray-900">AI Assistant</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleLeftPanel}
          className="h-7 w-7 text-gray-400 hover:text-gray-600"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-2",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {message.role === "assistant" && (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                <Bot className="w-3 h-3 text-white" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[85%] rounded-xl px-3 py-2 text-sm",
                message.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-white border border-gray-200 text-gray-700"
              )}
            >
              {message.content}
            </div>
            {message.role === "user" && (
              <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                <User className="w-3 h-3 text-gray-600" />
              </div>
            )}
          </div>
        ))}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex gap-2 justify-start">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
              <Bot className="w-3 h-3 text-white" />
            </div>
            <div className="bg-white border border-gray-200 rounded-xl px-3 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Quick Prompts */}
      <div className="px-3 py-2 border-t border-gray-200 bg-white">
        <div className="text-xs text-gray-500 mb-2">Quick prompts:</div>
        <div className="flex flex-wrap gap-1">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleQuickPrompt(prompt)}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
      
      {/* Input */}
      <div className="p-3 border-t border-gray-200 bg-white">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            className="flex-1 text-sm"
            disabled={isLoading}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}

/**
 * Generate simulated AI responses for demo purposes.
 * In a real implementation, this would call an AI endpoint.
 */
function getSimulatedResponse(userMessage: string, workflowName: string): string {
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes("scrape") || lowerMessage.includes("url")) {
    return "I can help you add a web scraping step! Go to the Tools panel on the right and select 'Firecrawl > Scrape Page'. This will add a step that can extract content from any URL.";
  }
  
  if (lowerMessage.includes("email") || lowerMessage.includes("gmail")) {
    return "To send emails, you'll need to connect your Gmail account first. Go to the Connect tab, then add a Gmail Send Email step from the Tools panel. I'll help you configure the recipient and message content.";
  }
  
  if (lowerMessage.includes("error") || lowerMessage.includes("handling")) {
    return "Good thinking! Error handling is important. Each step in your workflow can be configured with retry logic. Select a step to see its settings, where you can set the number of retries and error behavior.";
  }
  
  if (lowerMessage.includes("help") || lowerMessage.includes("how")) {
    return `I'm here to help you build "${workflowName}"! You can:\n\n1. Add tools from the right panel\n2. Configure inputs in the Inputs tab\n3. Set up connections in the Connect tab\n4. Test your workflow with the Test button\n\nWhat would you like to do first?`;
  }
  
  return `I understand you want to "${userMessage}". Let me help you with that! You can add steps from the Tools panel on the right. Would you like me to suggest some specific tools for this task?`;
}


