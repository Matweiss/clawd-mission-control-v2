import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Bot, User, Sparkles, Loader2, Paperclip, X, Image as ImageIcon 
} from 'lucide-react';
import { hapticFeedback } from '../../lib/ios-utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  model?: string;
  attachments?: Attachment[];
}

interface Attachment {
  name: string;
  type: string;
  dataURL?: string;
}

export function MobileChatTab() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if OpenClaw Free server is running
  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 10000);
    return () => clearInterval(interval);
  }, []);

  const checkConnection = async () => {
    try {
      const response = await fetch('https://gemini.thematweiss.com/', { method: 'GET' });
      setIsConnected(response.ok);
    } catch {
      setIsConnected(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataURL = event.target?.result as string;
        setAttachments(prev => [...prev, {
          name: file.name,
          type: file.type,
          dataURL
        }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async () => {
    if ((!input.trim() && attachments.length === 0) || isLoading) return;

    hapticFeedback('medium');
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      attachments: attachments.length > 0 ? attachments : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachments([]);
    setIsLoading(true);

    try {
      // Build conversation history for context
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      // Add current message
      conversationHistory.push({
        role: 'user',
        content: userMessage.content
      });

      const requestBody: any = {
        messages: conversationHistory,
        stream: false
      };

      // Add attachments if present
      if (attachments.length > 0) {
        requestBody.attachments = attachments.map(att => ({
          name: att.name,
          type: att.type,
          dataURL: att.dataURL
        }));
      }

      const response = await fetch('https://gemini.thematweiss.com/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.choices?.[0]?.message?.content || 'No response',
          timestamp: new Date(),
          model: data.model
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Error: Could not connect to Gemini. Make sure the server is running and Chrome extension is open.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    hapticFeedback('medium');
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-work" />
          <span className="font-medium">Gemini Chat</span>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="text-xs text-gray-500 px-2 py-1"
            >
              Clear
            </button>
          )}
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-gray-500">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 px-2">
        {messages.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="mb-2">Chat with Gemini 3.1 Pro</p>
            <p className="text-sm">Conversation history enabled</p>
          </div>
        )}

        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === 'user' ? 'bg-work/20' : 'bg-green-500/20'
              }`}>
                {message.role === 'user' ? (
                  <User className="w-4 h-4 text-work" />
                ) : (
                  <Bot className="w-4 h-4 text-green-400" />
                )}
              </div>

              <div className={`max-w-[80%] rounded-2xl p-3 ${
                message.role === 'user' 
                  ? 'bg-work text-white' 
                  : 'bg-surface-light'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                
                {message.attachments && message.attachments.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap"
                  >
                    {message.attachments.map((att, i) => (
                      <div key={i} className="flex items-center gap-1 bg-black/20 rounded px-2 py-1"
                      >
                        <ImageIcon className="w-3 h-3" />
                        <span className="text-xs truncate max-w-[100px]">{att.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {message.model && index === messages.length - 1 && (
                  <p className="text-xs text-gray-500 mt-1">{message.model}</p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center"
            >
              <Bot className="w-4 h-4 text-green-400" />
            </div>
            <div className="bg-surface-light rounded-2xl p-3 flex items-center gap-2"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm text-gray-500">Thinking...</span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="flex gap-2 mb-2 px-2 overflow-x-auto"
        >
          {attachments.map((att, index) => (
            <div key={index} className="flex items-center gap-1 bg-surface-light rounded-lg px-2 py-1"
            >
              <ImageIcon className="w-3 h-3 text-gray-400" />
              <span className="text-xs truncate max-w-[100px]">{att.name}</span>
              <button
                onClick={() => removeAttachment(index)}
                className="p-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 p-2 bg-surface-light rounded-2xl"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*,.pdf,.txt,.doc,.docx"
          multiple
          className="hidden"
        />
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={!isConnected || isLoading}
          className="p-2 text-gray-400 hover:text-white disabled:opacity-50"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={isConnected ? "Message Gemini..." : "Server disconnected"}
          disabled={!isConnected || isLoading}
          className="flex-1 bg-transparent px-3 py-2 text-sm outline-none"
        />
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={sendMessage}
          disabled={(!input.trim() && attachments.length === 0) || !isConnected || isLoading}
          className="p-2 bg-work rounded-xl disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Connection hint */}
      {!isConnected && (
        <p className="text-xs text-center text-gray-500 mt-2"
        >
          Cloudflare tunnel connecting...
        </p>
      )}
    </div>
  );
}
