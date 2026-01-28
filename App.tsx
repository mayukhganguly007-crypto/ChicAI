
import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { AppTab, StyleSession } from './types';
import { generateDailyStyle, analyzeFit } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.TODAY);
  const [vibe, setVibe] = useState('Casual Afternoon');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentSession, setCurrentSession] = useState<StyleSession | null>(null);
  const [history, setHistory] = useState<StyleSession[]>([]);
  const [fitCheckLoading, setFitCheckLoading] = useState(false);
  const [cameraImage, setCameraImage] = useState<string | null>(null);

  // Load history from local storage
  useEffect(() => {
    const saved = localStorage.getItem('chic-ai-history');
    if (saved) {
      const parsed = JSON.parse(saved);
      setHistory(parsed);
      // If there's a session for today, set it as current
      const today = new Date().toLocaleDateString();
      const todaySession = parsed.find((s: StyleSession) => s.date === today);
      if (todaySession) setCurrentSession(todaySession);
    }
  }, []);

  const saveSession = useCallback((session: StyleSession) => {
    setHistory(prev => {
      const filtered = prev.filter(s => s.id !== session.id);
      const updated = [session, ...filtered];
      localStorage.setItem('chic-ai-history', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const { outfit, makeup } = await generateDailyStyle(vibe);
      const newSession: StyleSession = {
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toLocaleDateString(),
        vibe,
        outfit,
        makeup
      };
      setCurrentSession(newSession);
      saveSession(newSession);
    } catch (error) {
      console.error("Failed to generate style:", error);
      alert("Style generation failed. Please check your connection.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFitCheck = async (imageData: string) => {
    if (!currentSession) return;
    setFitCheckLoading(true);
    try {
      const { rating, feedback } = await analyzeFit(imageData, { outfit: currentSession.outfit, makeup: currentSession.makeup });
      const updatedSession = { ...currentSession, rating, feedback, imageUrl: imageData };
      setCurrentSession(updatedSession);
      saveSession(updatedSession);
    } catch (error) {
      console.error("Fit check failed:", error);
      alert("Fit check analysis failed. Try again.");
    } finally {
      setFitCheckLoading(false);
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === AppTab.TODAY && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-8">
            <h2 className="serif text-2xl mb-2">Today's Look</h2>
            <p className="text-gray-500 text-sm">Curated based on your current mood and environment.</p>
          </div>

          <div className="mb-6">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-2">Setting the Vibe</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={vibe}
                onChange={(e) => setVibe(e.target.value)}
                placeholder="e.g. Wedding Guest, Beach Day..."
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
              />
              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-6 py-3 bg-black text-white rounded-xl text-sm font-semibold disabled:opacity-50 active:scale-95 transition-all"
              >
                {isGenerating ? '...' : 'Plan'}
              </button>
            </div>
          </div>

          {currentSession ? (
            <div className="space-y-8 pb-10">
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-8 h-[1px] bg-black"></span>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em]">The Outfit</h3>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <ItemCard label="Top" value={currentSession.outfit.top} />
                  <ItemCard label="Bottom" value={currentSession.outfit.bottom} />
                  {currentSession.outfit.outerwear && <ItemCard label="Outerwear" value={currentSession.outfit.outerwear} />}
                  <ItemCard label="Shoes" value={currentSession.outfit.shoes} />
                  <div className="p-4 bg-gray-50 rounded-2xl">
                    <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Details</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {currentSession.outfit.accessories.map((acc, i) => (
                        <span key={i} className="px-3 py-1 bg-white border border-gray-100 rounded-full text-xs text-gray-600">
                          {acc}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 bg-gray-900 text-white rounded-2xl italic text-sm leading-relaxed">
                    "{currentSession.outfit.reasoning}"
                  </div>
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-8 h-[1px] bg-black"></span>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em]">Makeup Palette</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <MakeupItem label="Base" value={currentSession.makeup.face} />
                  <MakeupItem label="Eyes" value={currentSession.makeup.eyes} />
                  <MakeupItem label="Lips" value={currentSession.makeup.lips} />
                  <MakeupItem label="Style" value={currentSession.makeup.technique} />
                </div>
              </section>

              {currentSession.feedback && (
                <section className="p-6 bg-pink-50 rounded-3xl border border-pink-100 animate-in zoom-in duration-300">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-pink-900">Stylist's Verdict</h3>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(star => (
                        <svg key={star} className={`w-4 h-4 ${(currentSession.rating || 0) / 2 >= star ? 'text-pink-600' : 'text-pink-200'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-pink-900 leading-relaxed italic">"{currentSession.feedback}"</p>
                </section>
              )}
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center opacity-30 grayscale p-10">
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 20m0 0c1.398 0 2.72-.273 3.928-.766l.03-.013m-9.44-3.906a9.001 9.001 0 0113.37-13.37m-2.84 1.802A9.035 9.035 0 0119.86 3.6m-6.491 2.396A4.002 4.002 0 0116 11V12a4 4 0 01-8 0v-1c0-1.291.611-2.44 1.559-3.172m6.441 3.172a3.346 3.346 0 01-1.351 3.071m-2.13-3.641a3.346 3.346 0 00-1.092 3.13" /></svg>
              <p className="text-sm font-medium">Nothing planned yet.<br/>What are we doing today?</p>
            </div>
          )}
        </div>
      )}

      {activeTab === AppTab.FIT_CHECK && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center">
          <div className="mb-8 w-full">
            <h2 className="serif text-2xl mb-2">The Fit Check</h2>
            <p className="text-gray-500 text-sm">Upload a photo to get AI feedback on your implementation.</p>
          </div>

          {!currentSession ? (
            <div className="bg-yellow-50 p-6 rounded-2xl border border-yellow-100 text-sm text-yellow-800">
              Please generate a suggestion in the <strong>Today</strong> tab first before checking your fit!
            </div>
          ) : (
            <div className="w-full space-y-6">
              <div className="relative aspect-[3/4] bg-gray-100 rounded-3xl overflow-hidden shadow-inner group">
                {cameraImage ? (
                  <img src={cameraImage} className="w-full h-full object-cover" alt="Your outfit" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center text-gray-400">
                    <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <p className="text-sm">Click below to upload your look</p>
                  </div>
                )}
                
                {fitCheckLoading && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-10">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs font-bold uppercase tracking-widest animate-pulse">Analyzing Vibe...</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <label className="w-full py-4 bg-gray-100 text-black font-bold text-sm rounded-2xl text-center cursor-pointer hover:bg-gray-200 transition-colors">
                  {cameraImage ? 'Change Photo' : 'Choose Photo'}
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          const result = reader.result as string;
                          setCameraImage(result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
                
                {cameraImage && (
                  <button 
                    onClick={() => handleFitCheck(cameraImage)}
                    disabled={fitCheckLoading}
                    className="w-full py-4 bg-black text-white font-bold text-sm rounded-2xl shadow-xl active:scale-95 transition-all disabled:opacity-50"
                  >
                    Get Review
                  </button>
                )}
              </div>

              {currentSession.feedback && (
                <div className="mt-8 p-6 bg-green-50 rounded-3xl border border-green-100">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-green-900">AI Feedback</h4>
                    <span className="text-lg font-black text-green-900">{currentSession.rating}/10</span>
                  </div>
                  <p className="text-sm text-green-800 leading-relaxed italic">"{currentSession.feedback}"</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === AppTab.HISTORY && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-8">
            <h2 className="serif text-2xl mb-2">Past Styles</h2>
            <p className="text-gray-500 text-sm">A library of your previous looks and suggestions.</p>
          </div>

          <div className="space-y-4">
            {history.length === 0 ? (
              <p className="text-center text-gray-400 py-20 italic text-sm">Your style journey starts here.</p>
            ) : (
              history.map((session) => (
                <div key={session.id} className="p-4 border border-gray-100 rounded-3xl bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">{session.vibe}</h4>
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">{session.date}</p>
                    </div>
                    {session.rating && (
                      <span className="px-2 py-1 bg-black text-white text-[10px] font-bold rounded-lg">{session.rating}/10</span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 overflow-hidden">
                      {session.imageUrl ? (
                        <img src={session.imageUrl} className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] text-gray-600 line-clamp-2 italic leading-relaxed">
                        "{session.outfit.top} with {session.outfit.bottom}..."
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        setCurrentSession(session);
                        setActiveTab(AppTab.TODAY);
                      }}
                      className="text-[10px] font-black uppercase text-gray-300 hover:text-black transition-colors"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

// Helper Components
const ItemCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-gray-200 transition-colors">
    <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">{label}</p>
    <p className="text-sm font-medium text-gray-900">{value}</p>
  </div>
);

const MakeupItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="p-3 bg-pink-50/30 border border-pink-100 rounded-xl">
    <p className="text-[9px] font-bold uppercase text-pink-400 mb-1 tracking-tighter">{label}</p>
    <p className="text-[11px] font-semibold text-gray-800 leading-tight">{value}</p>
  </div>
);

export default App;
