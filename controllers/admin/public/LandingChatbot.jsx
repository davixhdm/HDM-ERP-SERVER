import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Trash2 } from 'lucide-react';
import { sendChatbotQuery, getChatbotConfig } from '../../api/public/aiApi';
import Spinner from '../ui/Spinner';

const LandingChatbot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState(null);
  const [hidden, setHidden] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    getChatbotConfig()
      .then(({ data }) => {
        setConfig(data.data);
        if (data.data.enabled) {
          setHidden(false);
          setMessages([{ role: 'assistant', content: data.data.welcomeMessage }]);
        }
      })
      .catch(() => setHidden(true));
  }, []);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleToggle = async () => {
    if (!open) {
      try {
        const { data } = await getChatbotConfig();
        if (data.data.enabled) {
          setHidden(false);
          setOpen(true);
          if (!messages.length) {
            setMessages([{ role: 'assistant', content: data.data.welcomeMessage }]);
          }
        } else {
          setHidden(true);
        }
      } catch {
        setHidden(true);
      }
    } else {
      setOpen(false);
    }
  };

  const send = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const response = await sendChatbotQuery(input);
      const reply =
        response?.data?.data?.data?.reply ||
        response?.data?.data?.reply ||
        response?.data?.reply ||
        'No response';
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I am unavailable right now.' }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: config?.welcomeMessage || 'Hello! How can I help you?' }]);
  };

  if (hidden) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <div className="w-80 h-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col mb-2">
          <div className="flex items-center justify-between px-4 py-3 bg-primary-500 text-white rounded-t-lg">
            <span className="font-medium">{config?.botName || 'HDM Assistant'}</span>
            <div className="flex items-center gap-1">
              <button onClick={clearChat} title="Clear chat">
                <Trash2 size={16} />
              </button>
              <button onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-lg whitespace-pre-wrap break-words ${
                    msg.role === 'user'
                      ? 'bg-primary-500 text-white rounded-br-none'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg rounded-bl-none">
                  <Spinner />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Ask anything..."
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <button
              onClick={send}
              disabled={loading}
              className="p-2 bg-primary-500 text-white rounded hover:bg-primary-600 disabled:opacity-50 transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
      <button
        onClick={handleToggle}
        style={{ backgroundColor: config?.color || '#10B981' }}
        className="p-3 text-white rounded-full shadow-lg hover:opacity-90 transition-opacity"
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
};

export default LandingChatbot;