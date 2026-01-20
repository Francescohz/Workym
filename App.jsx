import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, Play, Pause, Plus, ChevronRight, 
  Calendar, Settings, Trash2, Edit2, 
  Save, User as UserIcon, ChevronLeft, LogOut, Award,
  Zap, Layout, ShieldCheck, Check, Flame
} from 'lucide-react';

// Firebase Imports
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInAnonymously, onAuthStateChanged, 
  signInWithCustomToken, signOut 
} from 'firebase/auth';
import { 
  getFirestore, doc, setDoc, collection, 
  onSnapshot, updateDoc, deleteDoc, addDoc, query 
} from 'firebase/firestore';

// Inizializzazione Firebase
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'workym-elite-final';

const App = () => {
  const [user, setUser] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [workouts, setWorkouts] = useState([]);
  const [activeTab, setActiveTab] = useState('workout');
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);

  // Feedback Aptico
  const haptic = {
    light: () => { if (navigator.vibrate) navigator.vibrate(15); }, 
    success: () => { if (navigator.vibrate) navigator.vibrate([20, 40, 20]); }, 
    warning: () => { if (navigator.vibrate) navigator.vibrate(100); }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { 
        console.error("Auth Error", err);
        setIsInitialLoading(false);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      // Caricamento estetico Workym
      setTimeout(() => setIsInitialLoading(false), 2500);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const workoutCol = collection(db, 'artifacts', appId, 'users', user.uid, 'workouts');
    const unsubWorkouts = onSnapshot(workoutCol, (snapshot) => {
      setWorkouts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Firestore Error:", error));

    return () => unsubWorkouts();
  }, [user]);

  useEffect(() => {
    let interval;
    if (timerRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setTimerRunning(false);
      haptic.warning();
    }
    return () => clearInterval(interval);
  }, [timerRunning, timeLeft]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (isInitialLoading) {
    return (
      <div className="h-screen bg-[#020202] flex items-center justify-center overflow-hidden">
        <div className="relative flex flex-col items-center">
          <div className="absolute w-[500px] h-[500px] bg-blue-600/10 blur-[120px] animate-pulse"></div>
          <div className="relative w-32 h-32 mb-12 flex items-center justify-center">
             <div className="absolute inset-0 border-[3px] border-white/5 rounded-[3.5rem]"></div>
             <div className="absolute inset-0 border-[3px] border-t-blue-500 border-transparent rounded-[3.5rem] animate-spin"></div>
             <Dumbbell size={48} className="text-blue-500 animate-pulse" />
          </div>
          <h2 className="text-white font-[1000] italic text-4xl tracking-[0.3em] relative z-10 mb-2">WORKYM</h2>
          <p className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.8em] mb-10">Elite Edition</p>
          <div className="w-48 h-[2px] bg-zinc-900 rounded-full overflow-hidden relative">
             <div className="h-full bg-blue-600 shadow-[0_0_20px_#2563eb] animate-[loading_2.5s_ease-in-out_infinite]"></div>
          </div>
        </div>
        <style>{` @keyframes loading { 0% { width: 0%; left: 0; } 50% { width: 100%; left: 0; } 100% { width: 0%; left: 100%; } } `}</style>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#020202] text-zinc-100 font-sans overflow-hidden select-none">
      {/* HEADER CON PALLINO BLU LED */}
      <header className="px-6 pt-16 pb-6 bg-black/40 backdrop-blur-3xl border-b border-white/5 flex justify-between items-end z-50">
        <div>
          <h1 className="text-3xl font-[1000] text-white tracking-tighter italic uppercase leading-none">WORKYM</h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="relative flex items-center justify-center w-3 h-3">
              <div className="absolute inset-0 bg-blue-500/40 rounded-full animate-ping"></div>
              <div className="relative w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_12px_#3b82f6] border border-blue-300/30"></div>
            </div>
            <p className="text-[9px] text-zinc-500 uppercase font-black tracking-[0.3em]">System Online</p>
          </div>
        </div>
        <button className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center active:scale-95 transition-all">
          <UserIcon size={20} className="text-zinc-400" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-5 pb-44 no-scrollbar">
        {activeTab === 'workout' && (
          <div className="space-y-6">
            {!selectedWorkout ? (
              <>
                <div className="flex justify-between items-center px-2">
                  <h2 className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.4em]">I Tuoi Piani</h2>
                  <button onClick={async () => {
                    haptic.success();
                    const newW = { title: "NUOVO ALLENAMENTO", exercises: [{ id: Date.now(), name: "Esercizio", setsNum: 3, repsNum: 10 }] };
                    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'workouts'), newW);
                  }} className="bg-white text-black w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"><Plus size={22} /></button>
                </div>

                <div className="grid gap-4">
                  {workouts.map((w) => (
                    <button key={w.id} onClick={() => { haptic.light(); setSelectedWorkout(w); }} className="w-full bg-zinc-900/40 p-7 rounded-[2.5rem] border border-white/5 text-left flex items-center gap-6">
                       <div className="w-16 h-16 bg-black rounded-3xl flex items-center justify-center text-zinc-600"><Zap size={26} fill="currentColor" /></div>
                       <div className="flex-1">
                         <p className="font-[1000] text-white text-xl uppercase italic">{w.title}</p>
                         <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest italic">{w.exercises?.length || 0} Esercizi</p>
                       </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-6">
                <button onClick={() => setSelectedWorkout(null)} className="bg-zinc-900/50 p-3 rounded-2xl text-zinc-500"><ChevronLeft size={20} /></button>
                <h2 className="text-5xl font-[1000] text-white tracking-tighter uppercase italic leading-[0.9]">{selectedWorkout.title}</h2>
                <div className="space-y-3">
                  {selectedWorkout.exercises?.map((ex) => (
                    <div key={ex.id} className="bg-zinc-900/30 p-6 rounded-[3rem] border border-white/5 flex justify-between items-center">
                      <div>
                        <h3 className="font-[1000] text-white text-lg uppercase italic">{ex.name}</h3>
                        <p className="text-blue-500 font-black text-[12px]">{ex.setsNum} X {ex.repsNum}</p>
                      </div>
                      <button onClick={() => { haptic.success(); setTimeLeft(60); setTimerRunning(true); }} className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-blue-600/20"><Check size={26} strokeWidth={4} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <div className="fixed bottom-32 left-6 right-6 h-28 bg-zinc-900/90 backdrop-blur-3xl border border-white/10 rounded-[3.5rem] p-6 z-50 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className={`w-16 h-16 rounded-[2.2rem] flex items-center justify-center transition-all ${timerRunning ? 'bg-blue-600 shadow-[0_0_20px_#2563eb]' : 'bg-zinc-800'}`}>
              <Play className="text-white" size={26} fill={timerRunning ? "currentColor" : "none"} />
            </div>
            <div>
              <p className="text-4xl font-mono font-[1000] text-white">{formatTime(timeLeft)}</p>
              <p className="text-[8px] text-zinc-600 font-black uppercase tracking-[0.2em] italic">Recupero Attivo</p>
            </div>
          </div>
          <button onClick={() => { haptic.success(); setTimerRunning(!timerRunning); }} className="w-20 h-20 rounded-[2.8rem] bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-600/30">
            {timerRunning ? <Pause size={38} strokeWidth={4} /> : <Play size={38} strokeWidth={4} className="ml-1" />}
          </button>
      </div>

      <nav className="fixed bottom-0 w-full bg-black/95 border-t border-white/5 flex justify-around p-6 pb-12 z-40">
        <button onClick={() => setActiveTab('workout')} className={`flex flex-col items-center gap-2 ${activeTab === 'workout' ? 'text-blue-500' : 'text-zinc-800'}`}>
          <Layout size={26} />
          <span className="text-[9px] font-black uppercase">Piani</span>
        </button>
        <button onClick={() => setActiveTab('calendar')} className={`flex flex-col items-center gap-2 ${activeTab === 'calendar' ? 'text-blue-500' : 'text-zinc-800'}`}>
          <Calendar size={26} />
          <span className="text-[9px] font-black uppercase">Diario</span>
        </button>
        <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-2 ${activeTab === 'profile' ? 'text-blue-500' : 'text-zinc-800'}`}>
          <Flame size={26} />
          <span className="text-[9px] font-black uppercase">Elite</span>
        </button>
      </nav>
      <style>{` .no-scrollbar::-webkit-scrollbar { display: none; } `}</style>
    </div>
  );
};

export default App;
