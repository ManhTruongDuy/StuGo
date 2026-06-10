import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2, Sparkles } from 'lucide-react';
import { chatbotService } from '../../services/chatbot.service';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'react-hot-toast';

export const AIChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, isPro: checkIsPro } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isProUser = checkIsPro();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!user || user.role !== 'user' || !isProUser) {
    return null; // Only render for premium users
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await chatbotService.chat(userMessage);
      if (response.success && response.data) {
        setMessages(prev => [...prev, { role: 'ai', content: response.data as string }]);
      } else {
        toast.error(response.message || 'Không thể lấy phản hồi từ AI');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi kết nối với Trợ lý AI');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="bg-white rounded-3xl shadow-2xl w-80 sm:w-96 h-[500px] flex flex-col border border-gray-100/80 overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 via-indigo-600 to-secondary-500 p-4 text-white flex justify-between items-center shrink-0 shadow-md">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
                <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm tracking-wide">Trợ lý ảo StuGo</h3>
                <p className="text-[10px] text-blue-100/90 font-medium">Cố vấn phương tiện Premium</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/10 p-1.5 rounded-full transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-8 p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm mx-4">
                <p className="text-sm font-semibold text-gray-800">Xin chào bạn! 👋</p>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                  Mình là Trợ lý AI của StuGo. Mình có thể giúp bạn tìm kiếm các nhà xe và thông tin di chuyển tối ưu nhất. Bạn đang muốn đi đâu thế?
                </p>
              </div>
            )}
            
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-tr-none' 
                      : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 shadow-sm border border-gray-100 rounded-2xl rounded-tl-none px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    <span className="text-xs text-gray-400">Đang trả lời...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100 shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Hỏi về phương tiện di chuyển..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-200"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 shrink-0 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-md shadow-indigo-500/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="relative bg-gradient-to-tr from-primary-600 via-indigo-600 to-secondary-500 text-white p-4 rounded-full shadow-2xl hover:scale-105 hover:shadow-indigo-500/40 transition-all duration-300 flex items-center group animate-float border border-white/20 shrink-0"
        >
          {/* Inner ring pulse */}
          <span className="absolute -inset-1 rounded-full bg-gradient-to-tr from-primary-500 to-secondary-500 opacity-30 blur-sm animate-pulse-slow group-hover:opacity-60 transition-opacity"></span>
          
          <div className="relative flex items-center justify-center w-6 h-6">
            <MessageSquare className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 absolute -top-1.5 -right-1.5 animate-pulse" />
          </div>

          <span className="max-w-0 overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap opacity-0 group-hover:opacity-100 group-hover:max-w-xs group-hover:ml-2.5 font-display font-semibold text-sm">
            Trợ lý AI
          </span>
          
          {/* Red notification dot */}
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-white shadow-md">
            <span className="absolute inset-0 rounded-full bg-rose-400 animate-ping opacity-75"></span>
          </span>
        </button>
      )}
    </div>
  );
};
