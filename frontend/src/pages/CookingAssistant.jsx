import React, { useState, useEffect, useRef } from 'react';
import { chatService, recipeService } from '../api/services';
import { GuidedCookingModal } from '../components/GuidedCookingModal';
import { DemoNoticeBanner } from '../components/DemoNoticeBanner';
import {
  Send,
  Image as ImageIcon,
  Mic,
  MicOff,
  ChefHat,
  Sparkles,
  Bookmark,
  Play,
  Clock,
  Flame,
  Plus,
  Trash2,
  X,
  MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';

const QUICK_PROMPTS = [
  "What can I cook with chickpeas, coconut milk, and spinach?",
  "High-protein Mediterranean dinner in under 20 minutes",
  "Healthy egg-free substitutes for baking",
  "How to properly rescue an oversalted soup or curry",
];

export const CookingAssistant = () => {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [guidedRecipe, setGuidedRecipe] = useState(null);
  const [savingRecipeId, setSavingRecipeId] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Load chat sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadSessions = async () => {
    try {
      const res = await chatService.listSessions();
      if (res.data.length > 0) {
        setSessions(res.data);
        setActiveSessionId(res.data[0].id);
        setMessages(res.data[0].messages || []);
      } else {
        createNewSession();
      }
    } catch (err) {
      console.error(err);
      createNewSession();
    }
  };

  const createNewSession = async () => {
    try {
      const res = await chatService.createSession('Culinary Assistant Chat');
      setSessions((prev) => [res.data, ...prev]);
      setActiveSessionId(res.data.id);
      setMessages(res.data.messages || []);
      return res.data.id;
    } catch (err) {
      console.error(err);
      toast.error('Failed to create new session.');
      return null;
    }
  };

  const switchSession = async (id) => {
    try {
      const res = await chatService.getSession(id);
      setActiveSessionId(id);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSession = async (e, id) => {
    e.stopPropagation();
    try {
      await chatService.deleteSession(id);
      const remaining = sessions.filter((s) => s.id !== id);
      setSessions(remaining);
      if (activeSessionId === id) {
        if (remaining.length > 0) {
          switchSession(remaining[0].id);
        } else {
          createNewSession();
        }
      }
      toast.success('Session removed.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error('Image exceeds 8 MB.');
      return;
    }
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  // Web Speech API voice input
  const toggleListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Web Speech API is not supported by your browser. Please type your query.', { duration: 4000 });
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setListening(true);
        toast('Listening to your cooking query...', { icon: '🎙️' });
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setListening(false);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setListening(false);
        toast.error(`Voice error: ${event.error}`);
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error(e);
      setListening(false);
      toast.error('Could not activate voice input.');
    }
  };

  const handleSend = async (textToSend) => {
    const messageContent = textToSend || inputText;
    if (!messageContent.trim() && !selectedImage) return;

    let targetSessionId = activeSessionId;
    if (!targetSessionId) {
      targetSessionId = await createNewSession();
      if (!targetSessionId) {
        setLoading(false);
        return;
      }
    }

    const currentMsg = messageContent.trim();
    setInputText('');
    const currentImg = selectedImage;
    const currentPreview = imagePreview;
    setSelectedImage(null);
    setImagePreview(null);

    // Optimistic UI update
    const optimisticUserMsg = {
      role: 'user',
      content: currentMsg,
      image_url: currentPreview,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUserMsg]);
    setLoading(true);

    const formData = new FormData();
    formData.append('message', currentMsg);
    if (currentImg) {
      formData.append('image', currentImg);
    }

    try {
      const res = await chatService.sendMessage(targetSessionId, formData);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to send message.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRecipe = async (recipe) => {
    setSavingRecipeId(recipe.id);
    try {
      await recipeService.saveRecipe(recipe);
      toast.success(`"${recipe.title}" saved to your recipes!`, { icon: '📖' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to save recipe.');
    } finally {
      setSavingRecipeId(null);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)] animate-fadeIn">
      {/* Sessions Sidebar */}
      <div className="w-full lg:w-64 bg-white rounded-card border border-mint-light shadow-soft p-4 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif font-bold text-sm text-forest">Conversations</h3>
            <button
              onClick={createNewSession}
              className="p-1.5 rounded-lg bg-mint-light hover:bg-mint text-forest transition"
              title="New Chat Session"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1 overflow-y-auto max-h-[300px] lg:max-h-[500px]">
            {sessions.map((ses) => (
              <div
                key={ses.id}
                onClick={() => switchSession(ses.id)}
                className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition ${
                  activeSessionId === ses.id
                    ? 'bg-forest text-white'
                    : 'text-charcoal hover:bg-mint-soft border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{ses.title || 'Cooking Assistant'}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteSession(e, ses.id)}
                  className={`p-1 rounded hover:text-terracotta transition shrink-0 ${
                    activeSessionId === ses.id ? 'text-white/70 hover:text-white' : 'text-charcoal-muted'
                  }`}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-mint-light text-[11px] text-charcoal-muted flex items-center gap-1.5">
          <ChefHat className="w-4 h-4 text-forest shrink-0" />
          <span>Food Verse AI Culinary Agent</span>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 bg-white rounded-card border border-mint-light shadow-soft flex flex-col min-w-0 overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={index}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-forest text-mint flex items-center justify-center shrink-0 mt-1 shadow-sm">
                    <ChefHat className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[85%] md:max-w-[75%] space-y-3`}>
                  {/* User attached image preview */}
                  {msg.image_url && (
                    <img
                      src={msg.image_url}
                      alt="Uploaded query"
                      className="max-h-48 rounded-xl object-cover border border-mint shadow-sm mb-1"
                    />
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`p-4 rounded-2xl text-xs md:text-sm leading-relaxed shadow-sm ${
                      isUser
                        ? 'bg-forest text-white rounded-tr-none'
                        : 'bg-cream/80 text-charcoal border border-mint-light rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>

                  {/* Render Recipe Card if Present */}
                  {msg.recipe && (
                    <div className="bg-white rounded-2xl border-2 border-mint p-5 shadow-elevated text-left space-y-4 animate-fadeIn">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-mint-light pb-3">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-forest block">
                            {msg.recipe.cuisine || 'Recipe Proposal'}
                          </span>
                          <h4 className="font-serif font-bold text-lg text-charcoal">
                            {msg.recipe.title}
                          </h4>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-charcoal-muted">
                          <span className="flex items-center gap-1 font-semibold text-forest">
                            <Clock className="w-3.5 h-3.5" />
                            {msg.recipe.prep_time_minutes + msg.recipe.cook_time_minutes}m total
                          </span>
                          <span className="flex items-center gap-1 font-semibold text-amber-700">
                            <Flame className="w-3.5 h-3.5" />
                            ~{msg.recipe.calories_per_serving} kcal/serv
                          </span>
                        </div>
                      </div>

                      {/* Ingredients list */}
                      <div>
                        <span className="text-[11px] font-bold text-charcoal-muted uppercase tracking-wider block mb-1.5">
                          Ingredients ({msg.recipe.ingredients?.length})
                        </span>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-charcoal">
                          {msg.recipe.ingredients?.map((ing, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-forest shrink-0 mt-1.5"></span>
                              <span>{ing}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Substitutions */}
                      {msg.recipe.substitutions?.length > 0 && (
                        <div className="p-3 rounded-xl bg-mint-soft/70 border border-mint/40 text-xs text-charcoal-muted">
                          <strong className="text-forest font-semibold block mb-0.5">
                            Smart Substitutions:
                          </strong>
                          {msg.recipe.substitutions.map((sub, sIdx) => (
                            <p key={sIdx}>• {sub}</p>
                          ))}
                        </div>
                      )}

                      {/* Actions: Start Guided Cooking Mode & Save */}
                      <div className="flex items-center justify-between gap-3 pt-2">
                        <button
                          onClick={() => setGuidedRecipe(msg.recipe)}
                          className="px-4 py-2.5 rounded-xl bg-forest hover:bg-forest-light text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          Start Guided Cooking Mode
                        </button>

                        <button
                          onClick={() => handleSaveRecipe(msg.recipe)}
                          disabled={savingRecipeId === msg.recipe.id}
                          className="px-3.5 py-2.5 rounded-xl border border-mint-light hover:bg-mint-soft text-forest text-xs font-semibold flex items-center gap-1.5 transition"
                        >
                          <Bookmark className="w-3.5 h-3.5 text-forest" />
                          Save Recipe
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 justify-start items-center text-xs text-charcoal-muted animate-pulse">
              <div className="w-8 h-8 rounded-xl bg-forest text-mint flex items-center justify-center shrink-0">
                <ChefHat className="w-4 h-4" />
              </div>
              <div className="p-3 rounded-2xl bg-cream border border-mint-light flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-forest animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-forest animate-bounce delay-150"></div>
                <div className="w-2 h-2 rounded-full bg-forest animate-bounce delay-300"></div>
                <span>Chef is drafting your reply & recipe timers...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompt Chips */}
        <div className="px-4 py-2 bg-cream/40 border-t border-mint-light flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] uppercase font-bold text-charcoal-muted shrink-0">
            Ideas:
          </span>
          {QUICK_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              className="px-2.5 py-1 rounded-full bg-white border border-mint-light hover:border-mint text-[11px] font-medium text-charcoal-muted hover:text-forest shrink-0 transition"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Image Attachment Preview */}
        {imagePreview && (
          <div className="px-4 py-2 bg-mint-soft/60 border-t border-mint flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src={imagePreview}
                alt="Selected"
                className="w-10 h-10 rounded-lg object-cover border border-mint"
              />
              <span className="text-xs text-charcoal font-medium">Image attached</span>
            </div>
            <button onClick={removeSelectedImage} className="p-1 text-charcoal-muted hover:text-terracotta">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Chat Input Bar */}
        <div className="p-4 bg-white border-t border-mint-light flex items-center gap-2">
          {/* Image button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl border border-mint-light hover:bg-mint-soft text-forest transition"
            title="Attach image"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />

          {/* Voice Input Button */}
          <button
            type="button"
            onClick={toggleListening}
            className={`p-2.5 rounded-xl border transition ${
              listening
                ? 'bg-terracotta text-white border-terracotta animate-pulse'
                : 'border-mint-light hover:bg-mint-soft text-forest'
            }`}
            title={listening ? 'Listening... click to stop' : 'Voice input (Web Speech)'}
          >
            {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={listening ? 'Listening to your voice...' : 'Ask about cooking, recipes, ingredients...'}
            className="flex-1 px-4 py-2.5 rounded-xl border border-mint-light bg-cream/40 text-charcoal text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest transition"
          />

          {/* Send Button */}
          <button
            onClick={() => handleSend()}
            disabled={loading || (!inputText.trim() && !selectedImage)}
            className={`p-2.5 rounded-xl font-semibold shadow-sm transition ${
              loading || (!inputText.trim() && !selectedImage)
                ? 'bg-mint-light text-forest/40 cursor-not-allowed'
                : 'bg-forest hover:bg-forest-light text-white'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Guided Cooking Modal */}
      {guidedRecipe && (
        <GuidedCookingModal
          recipe={guidedRecipe}
          onClose={() => setGuidedRecipe(null)}
        />
      )}
    </div>
  );
};
