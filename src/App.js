import React, { useState, useEffect, useRef } from 'react';
import { 
  GraduationCap, Moon, Sun, BookOpen, ArrowRight, 
  Home, PenTool, Search, ChevronsUpDown, Layers, 
  ChevronUp, ChevronDown, FileText, CheckCircle2, PlayCircle, Download, 
  Paperclip, DownloadCloud, FileWarning, X, Plus, Trash2, Edit2, 
  User, Users, LogOut, BarChart, UserCircle, Clock, Mail, GripVertical, Link,
  MessageSquare, Image as ImageIcon, Send
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp, getDoc, addDoc, updateDoc, arrayUnion, query, orderBy } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// --- YOUR Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyD9VyK1hQUD211xhW4sgFZHhFMYROJ04bI",
  authDomain: "education-homepage.firebaseapp.com",
  projectId: "education-homepage",
  storageBucket: "education-homepage.firebasestorage.app",
  messagingSenderId: "409453941950",
  appId: "1:409453941950:web:544600829ce62d55d53aef",
  measurementId: "G-RJNDD1X6ED"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// --- APPROVED TEACHERS ALLOWLIST ---
// Add the exact Google emails of anyone you want to have Teacher access here.
// Anyone else who logs in with Google will be restricted to a Student account.
const APPROVED_TEACHERS = [
  'charlesxcaliber@gmail.com', // Replace with your actual Google login email
].map(email => email.toLowerCase());

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 9);

export default function App() {
  const [user, setUser] = useState(null);
  const [allClasses, setAllClasses] = useState([]);
  const [appMode, setAppMode] = useState('student');
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if current user is an approved teacher
  const isTeacher = user && !user.isAnonymous && user.email && APPROVED_TEACHERS.includes(user.email.toLowerCase());

  // --- Auth & Firebase Setup ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // Automatically switch approved teachers to teacher view on login
      if (currentUser && !currentUser.isAnonymous && currentUser.email && APPROVED_TEACHERS.includes(currentUser.email.toLowerCase())) {
        setAppMode('teacher');
      } else {
        setAppMode('student');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- Data Fetching ---
  useEffect(() => {
    if (!user) return;
    
    const classesRef = collection(db, 'classes');
    const unsubscribe = onSnapshot(
      classesRef, 
      (snapshot) => {
        const classesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllClasses(classesData);
      },
      (error) => {
        console.error("Error fetching classes:", error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // --- Dark Mode ---
  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    if (isDark) document.documentElement.classList.add('dark');
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
    if (newMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500">Loading Portal...</div>;
  }

  if (!user) {
    return <LoginScreen darkMode={darkMode} toggleDarkMode={toggleDarkMode} />;
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen flex flex-col transition-colors font-sans">
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} user={user} isTeacher={isTeacher} />
      
      <main className="flex-1 flex flex-col items-center p-4 sm:p-8 overflow-auto custom-scrollbar relative">
        {appMode === 'student' ? (
          <StudentPortal allClasses={allClasses} user={user} db={db} storage={storage} isTeacher={isTeacher} />
        ) : (
          <TeacherPortal allClasses={allClasses} user={user} db={db} storage={storage} isTeacher={isTeacher} />
        )}
      </main>

      {/* Mode Switcher */}
      <div className="fixed bottom-4 right-4 flex bg-white dark:bg-slate-800 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
        <button 
          onClick={() => setAppMode('student')}
          className={`px-4 py-2 text-sm font-semibold flex items-center gap-2 transition-colors ${appMode === 'student' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
        >
          <Users className="w-4 h-4" /> Student View
        </button>
        {isTeacher && (
          <button 
            onClick={() => setAppMode('teacher')}
            className={`px-4 py-2 text-sm font-semibold flex items-center gap-2 transition-colors ${appMode === 'teacher' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
          >
            <User className="w-4 h-4" /> Teacher View
          </button>
        )}
      </div>
    </div>
  );
}

// ==========================================
// LOGIN SCREEN
// ==========================================
function LoginScreen({ darkMode, toggleDarkMode }) {
  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      alert("Login failed: " + error.message);
    }
  };

  const handleGuestLogin = async () => {
    try {
      await signInAnonymously(auth);
    } catch (error) {
      alert("Guest login failed: " + error.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors font-sans relative">
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} user={null} isTeacher={false} />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <GraduationCap className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">Sign in to access your classes and track your progress.</p>
          
          <div className="space-y-4">
            <button 
              onClick={handleGoogleLogin}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5 bg-white rounded-full p-0.5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Sign in with Google
            </button>
            
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
              <span className="flex-shrink-0 mx-4 text-slate-400 text-sm font-medium">OR</span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
            </div>

            <button 
              onClick={handleGuestLogin}
              className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-3 px-4 rounded-xl font-bold transition-all shadow-sm border border-slate-200 dark:border-slate-700"
            >
              Continue as Student Guest
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-6">
            Approved teachers will automatically be routed to the Teacher Dashboard upon Google sign-in.
          </p>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// HEADER COMPONENT
// ==========================================
function Header({ darkMode, toggleDarkMode, user, isTeacher }) {
  return (
    <header className="bg-slate-900 dark:bg-black text-white p-4 flex items-center justify-between shadow-md z-20 relative">
      <div className="flex items-center gap-3">
        <div className="bg-indigo-500 dark:bg-indigo-600 p-2 rounded-lg text-white">
          <GraduationCap className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold tracking-tight hidden sm:block">Mr. Byron Class Portal</h1>
        <h1 className="text-xl font-bold tracking-tight sm:hidden">Portal</h1>
      </div>
      <div className="flex items-center gap-3 sm:gap-4">
        <button onClick={toggleDarkMode} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors shrink-0" title="Toggle Dark Mode">
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        {user && (
          <div className="flex items-center gap-3 border-l border-slate-700 pl-3 sm:pl-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-bold leading-tight text-emerald-400">
                {user.isAnonymous ? 'Guest Student' : (isTeacher ? `Teacher: ${user.displayName}` : user.displayName)}
              </p>
              <p className="text-xs text-slate-400">{user.isAnonymous ? 'Local Progress Only' : 'Progress Synced'}</p>
            </div>
            <button 
              onClick={() => signOut(auth)}
              className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

// ==========================================
// STUDENT PORTAL
// ==========================================
function StudentPortal({ allClasses, user, db, storage, isTeacher }) {
  const [currentClass, setCurrentClass] = useState(null);
  const [classCodeInput, setClassCodeInput] = useState('');
  const [error, setError] = useState('');
  
  useEffect(() => {
    const lastClass = localStorage.getItem('last_class_code');
    if (lastClass && !currentClass && !classCodeInput) {
      setClassCodeInput(lastClass);
    }
  }, [currentClass, classCodeInput]);

  const handleJoinClass = async () => {
    const code = classCodeInput.trim().toLowerCase();
    if (!code) {
      setError('Please enter a class code.');
      return;
    }

    const foundClass = allClasses.find(c => c.code.toLowerCase() === code);
    if (foundClass) {
      setCurrentClass(foundClass);
      localStorage.setItem('last_class_code', foundClass.code);
      setError('');

      // Analytics Tracking: Register user access in Firestore
      if (!user.isAnonymous) {
        try {
          const studentRef = doc(db, 'classes', foundClass.id, 'students', user.uid);
          await setDoc(studentRef, {
            displayName: user.displayName || 'Anonymous Student',
            email: user.email || 'No Email',
            lastAccess: serverTimestamp()
          }, { merge: true });
        } catch (err) {
          console.error("Failed to sync analytics access", err);
        }
      }
    } else {
      setError('Class not found. Please verify your class code.');
    }
  };

  if (currentClass) {
    return <ClassViewer currentClass={currentClass} onBack={() => setCurrentClass(null)} user={user} db={db} storage={storage} isTeacher={isTeacher} />;
  }

  return (
    <section className="w-full mx-auto flex flex-col lg:flex-row gap-12 mt-8 transition-all">
      <div className="flex-1 flex flex-col gap-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4">Welcome to the Class Portal</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
            Hello students and parents! This portal is designed to give you easy access to all of our class materials and resources. The goal of this website is to help you stay organised and navigate the content easily and at your own pace.
          </p>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Please use the class code provided to you in class to access your specific materials. If you have misplaced your code, feel free to reach out to me via email.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-96 shrink-0">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col gap-6 sticky top-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Access Your Class</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Enter your class code below to view your lessons and materials.</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Class Code</label>
            <input 
              type="text" 
              value={classCodeInput}
              onChange={(e) => setClassCodeInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinClass()}
              placeholder="e.g., math101" 
              className="w-full p-3 bg-transparent border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-lg font-medium text-center uppercase text-slate-900 dark:text-slate-100"
            />
          </div>
          <button 
            onClick={handleJoinClass}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg flex items-center justify-center gap-2 font-semibold transition-all shadow-sm"
          >
            <ArrowRight className="w-5 h-5" /> Enter Class
          </button>
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm text-center border border-red-200 dark:border-red-800/50 font-medium">
              {error}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ClassViewer({ currentClass, onBack, user, db, readOnly = false, storage, isTeacher }) {
  const [activeTab, setActiveTab] = useState('content');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedUnits, setExpandedUnits] = useState(currentClass.units.map(u => u.id));
  const [completedItems, setCompletedItems] = useState({});
  const [previewFile, setPreviewFile] = useState(null);
  const [notes, setNotes] = useState('');
  const [saveStatus, setSaveStatus] = useState('');

  // Initial Progress Loading
  useEffect(() => {
    // 1. Load from localStorage first (for immediate UI & guest accounts)
    if (readOnly) {
      setCompletedItems(user.progress || {});
      return;
    }

    const savedCompleted = {};
    setNotes(localStorage.getItem(`notes_${currentClass.id}`) || '');

    currentClass.units.forEach(unit => {
      (unit.lessons || []).forEach(l => {
        if (localStorage.getItem(`completed_${currentClass.id}_${l.id}`) === 'true') savedCompleted[l.id] = true;
      });
      (unit.materials || []).forEach(m => {
        if (localStorage.getItem(`completed_${currentClass.id}_${m.id}`) === 'true') savedCompleted[m.id] = true;
      });
    });
    (currentClass.additionalMaterials || []).forEach(m => {
      if (localStorage.getItem(`completed_${currentClass.id}_${m.id}`) === 'true') savedCompleted[m.id] = true;
    });
    setCompletedItems(savedCompleted);

    // 2. If signed in, fetch authoritative cloud progress
    if (!user.isAnonymous) {
      const fetchCloudProgress = async () => {
        try {
          const studentDoc = await getDoc(doc(db, 'classes', currentClass.id, 'students', user.uid));
          if (studentDoc.exists() && studentDoc.data().progress) {
            setCompletedItems(prev => ({ ...prev, ...studentDoc.data().progress }));
            // Sync cloud state back down to local storage
            Object.entries(studentDoc.data().progress).forEach(([itemId, isCompleted]) => {
              if (isCompleted) {
                localStorage.setItem(`completed_${currentClass.id}_${itemId}`, 'true');
              } else {
                localStorage.removeItem(`completed_${currentClass.id}_${itemId}`);
              }
            });
          }
        } catch (err) {
          console.error("Failed to fetch cloud progress", err);
        }
      };
      fetchCloudProgress();
    }
  }, [currentClass, user, db, readOnly]);

  // Notes Auto-Save
  useEffect(() => {
    if (readOnly) return;
    const timer = setTimeout(() => {
      if (notes !== localStorage.getItem(`notes_${currentClass.id}`)) {
        localStorage.setItem(`notes_${currentClass.id}`, notes);
        setSaveStatus('Saved!');
        setTimeout(() => setSaveStatus(''), 2000);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [notes, currentClass.id, readOnly]);

  const toggleCompleted = async (itemId) => {
    if (readOnly) return;
    const isCompleted = completedItems[itemId];
    const newCompletedState = !isCompleted;
    
    // 1. Optimistic Local UI Update
    setCompletedItems(prev => ({ ...prev, [itemId]: newCompletedState }));
    if (newCompletedState) {
      localStorage.setItem(`completed_${currentClass.id}_${itemId}`, 'true');
    } else {
      localStorage.removeItem(`completed_${currentClass.id}_${itemId}`);
    }

    // 2. Sync to Cloud Analytics if signed in
    if (!user.isAnonymous) {
      try {
        const studentRef = doc(db, 'classes', currentClass.id, 'students', user.uid);
        await setDoc(studentRef, { 
          progress: { [itemId]: newCompletedState },
          lastAccess: serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.error("Failed to sync progress to cloud", err);
      }
    }
  };

  const toggleUnit = (unitId) => {
    setExpandedUnits(prev => 
      prev.includes(unitId) ? prev.filter(id => id !== unitId) : [...prev, unitId]
    );
  };

  const toggleAllUnits = () => {
    if (expandedUnits.length === currentClass.units.length) {
      setExpandedUnits([]);
    } else {
      setExpandedUnits(currentClass.units.map(u => u.id));
    }
  };

  // Calculate Class Progress Percentage
  let totalItems = 0;
  let totalCompleted = 0;
  
  currentClass.units.forEach(unit => {
    totalItems += (unit.lessons?.length || 0) + (unit.materials?.length || 0);
  });
  totalItems += (currentClass.additionalMaterials?.length || 0);

  Object.values(completedItems).forEach(val => { if (val) totalCompleted++; });
  const progressPct = totalItems === 0 ? 0 : Math.round((totalCompleted / totalItems) * 100);

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-6 mb-2">
        <div className="flex-1 pr-6">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{currentClass.title}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Select a lesson below to begin.</p>
          <div className="w-full max-w-md bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }}></div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{progressPct}% Completed</p>
        </div>
        <button onClick={onBack} className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm shrink-0">
          {readOnly ? <ArrowRight className="w-4 h-4 rotate-180" /> : <Home className="w-4 h-4" />} 
          {readOnly ? 'Back to Analytics' : 'Return Home'}
        </button>
      </div>

      {currentClass.feedbackEnabled && (
        <div className="flex gap-6 mb-4 border-b border-slate-200 dark:border-slate-800 px-2">
          <button 
            onClick={() => setActiveTab('content')} 
            className={`pb-3 font-medium text-sm transition-all relative ${activeTab === 'content' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Course Content
            {activeTab === 'content' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />}
          </button>
          <button 
            onClick={() => setActiveTab('feedback')} 
            className={`pb-3 font-medium text-sm transition-all relative flex items-center gap-2 ${activeTab === 'feedback' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <MessageSquare className="w-4 h-4" /> Student Feedback
            {activeTab === 'feedback' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />}
          </button>
        </div>
      )}

      {activeTab === 'content' ? (
        <>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl p-4 shadow-sm relative">
            <div className="flex items-center gap-2 mb-2">
              <PenTool className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h3 className="font-bold text-amber-800 dark:text-amber-300 text-sm uppercase tracking-wider">My Notes</h3>
              <span className={`text-xs text-amber-600 dark:text-amber-400 ml-auto transition-opacity ${saveStatus ? 'opacity-100' : 'opacity-0'}`}>
                {saveStatus}
              </span>
            </div>
            <textarea 
              value={notes}
              readOnly={readOnly}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={readOnly ? "No notes available in read-only mode." : "Jot down your notes here... (Saves automatically)"} 
              className="w-full bg-transparent border-0 p-0 text-sm text-slate-700 dark:text-slate-300 placeholder-amber-700/50 dark:placeholder-amber-300/50 focus:ring-0 resize-none h-20 outline-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 items-center justify-between">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search materials..." 
                className="w-full pl-9 pr-3 py-2 bg-transparent border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button onClick={toggleAllUnits} className="flex-1 sm:flex-none bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700">
                <ChevronsUpDown className="w-4 h-4" /> 
                {expandedUnits.length === currentClass.units.length ? 'Collapse All' : 'Expand All'}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {currentClass.units.map((unit, index) => {
              const isExpanded = expandedUnits.includes(unit.id);
              
              let unitTotal = (unit.lessons?.length || 0) + (unit.materials?.length || 0);
              let unitCompleted = 0;
              (unit.lessons || []).forEach(l => { if (completedItems[l.id]) unitCompleted++; });
              (unit.materials || []).forEach(m => { if (completedItems[m.id]) unitCompleted++; });
              const unitPct = unitTotal === 0 ? 0 : Math.round((unitCompleted / unitTotal) * 100);

              const filteredLessons = (unit.lessons || []).filter(l => l.title.toLowerCase().includes(searchQuery.toLowerCase()));
              const filteredMaterials = (unit.materials || []).filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()));
              
              if (searchQuery && filteredLessons.length === 0 && filteredMaterials.length === 0) return null;

              return (
                <div key={unit.id} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-all">
                  <div 
                    className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    onClick={() => toggleUnit(unit.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 p-2 rounded-lg shrink-0">
                          <Layers className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{unit.title || `Unit ${index + 1}`}</h3>
                      </div>
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                    </div>
                    <div className="flex items-center gap-3 pl-14 pr-2 sm:pr-8">
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${unitPct}%` }}></div>
                      </div>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 w-8 text-right">{unitPct}%</span>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-indigo-500" /> Lessons
                        </h4>
                        <div className="space-y-2">
                          {filteredLessons.length > 0 ? filteredLessons.map(lesson => (
                            <FileItem key={lesson.id} item={lesson} type="lesson" isCompleted={completedItems[lesson.id]} onToggle={() => toggleCompleted(lesson.id)} onPreview={() => setPreviewFile(lesson)} readOnly={readOnly} />
                          )) : <p className="text-sm text-slate-400 italic">No lessons available.</p>}
                        </div>
                      </div>
                      {(unit.materials?.length > 0 || filteredMaterials.length > 0) && (
                        <div>
                          <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <Paperclip className="w-3.5 h-3.5 text-emerald-500" /> Materials
                          </h4>
                          <div className="space-y-2">
                            {filteredMaterials.length > 0 ? filteredMaterials.map(mat => (
                              <FileItem key={mat.id} item={mat} type="material" isCompleted={completedItems[mat.id]} onToggle={() => toggleCompleted(mat.id)} onPreview={() => setPreviewFile(mat)} readOnly={readOnly} />
                            )) : <p className="text-sm text-slate-400 italic">No materials available.</p>}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {currentClass.additionalMaterials?.length > 0 && (
               <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mt-6">
                  <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 p-2 rounded-lg">
                        <Paperclip className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Global Additional Materials</h3>
                    </div>
                  </div>
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {currentClass.additionalMaterials.map(mat => (
                       <FileItem key={mat.id} item={mat} type="global" isCompleted={completedItems[mat.id]} onToggle={() => toggleCompleted(mat.id)} onPreview={() => setPreviewFile(mat)} readOnly={readOnly} />
                    ))}
                  </div>
               </div>
            )}
          </div>
        </>
      ) : (
        <FeedbackBoard classId={currentClass.id} user={user} db={db} storage={storage} isTeacher={isTeacher} readOnly={readOnly} />
      )}

      {previewFile && <PreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}
    </div>
  );
}

function FileItem({ item, type, isCompleted, onToggle, onPreview, readOnly }) {
  const Icon = type === 'lesson' ? PlayCircle : DownloadCloud;
  const colorClass = type === 'lesson' ? 'indigo' : 'emerald';
  
  return (
    <div className={`flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-${colorClass}-300 dark:hover:border-${colorClass}-500/50 hover:bg-${colorClass}-50 dark:hover:bg-${colorClass}-900/20 transition-all group shadow-sm`}>
      <button onClick={readOnly ? undefined : onToggle} className={`text-slate-300 dark:text-slate-600 ${!readOnly ? 'hover:text-emerald-500 dark:hover:text-emerald-400 cursor-pointer' : 'cursor-default'} transition-colors shrink-0 ${isCompleted ? 'text-emerald-500 dark:text-emerald-400' : ''}`}>
        <CheckCircle2 className={`w-5 h-5 ${isCompleted ? 'fill-emerald-100 dark:fill-emerald-900/50' : ''}`} />
      </button>
      {item.isLink ? (
        <a href={item.url} target="_blank" rel="noreferrer" className={`flex-1 flex items-center gap-2 group-hover:text-${colorClass}-700 dark:group-hover:text-${colorClass}-300 overflow-hidden text-left`}>
          <Icon className={`w-5 h-5 text-slate-400 dark:text-slate-500 group-hover:text-${colorClass}-500 transition-colors shrink-0`} />
          <span className={`font-medium text-sm text-slate-700 dark:text-slate-300 group-hover:text-${colorClass}-700 dark:group-hover:text-${colorClass}-300 truncate`}>{item.title}</span>
        </a>
      ) : (
        <button onClick={onPreview} className={`flex-1 flex items-center gap-2 group-hover:text-${colorClass}-700 dark:group-hover:text-${colorClass}-300 overflow-hidden text-left`}>
          <Icon className={`w-5 h-5 text-slate-400 dark:text-slate-500 group-hover:text-${colorClass}-500 transition-colors shrink-0`} />
          <span className={`font-medium text-sm text-slate-700 dark:text-slate-300 group-hover:text-${colorClass}-700 dark:group-hover:text-${colorClass}-300 truncate`}>{item.title}</span>
        </button>
      )}
      {item.tag && (
        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full shrink-0 ${
          item.tag === 'Complete' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
        }`}>
          {item.tag}
        </span>
      )}
      {!item.isLink && (
        <a href={item.url} target="_blank" rel="noreferrer" download className={`opacity-0 group-hover:opacity-100 text-slate-400 hover:text-${colorClass}-600 dark:hover:text-${colorClass}-400 transition-all p-1.5 shrink-0 bg-slate-50 dark:bg-slate-700 hover:bg-${colorClass}-100 dark:hover:bg-${colorClass}-600/30 rounded-md border border-slate-200 dark:border-slate-600 hover:border-${colorClass}-300`}>
          <Download className="w-4 h-4" />
        </a>
      )}
    </div>
  );
}

function PreviewModal({ file, onClose }) {
  const extension = file.fileName?.split('.').pop().toLowerCase() || '';
  
  let content = null;
  if (['mp4', 'webm', 'ogg'].includes(extension)) {
    content = <video controls autoPlay className="w-full h-full max-h-full rounded object-contain bg-black"><source src={file.url} />Video not supported.</video>;
  } else if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension)) {
    content = <img src={file.url} alt={file.title} className="max-w-full max-h-full object-contain rounded" />;
  } else if (['pdf', 'txt', 'html'].includes(extension)) {
    content = <iframe src={file.url} className="w-full h-full border-0 bg-white rounded" title="Preview" />;
  } else if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(extension)) {
    const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(file.url)}&embedded=true`;
    content = <iframe src={viewerUrl} className="w-full h-full border-0 bg-white rounded" title="Preview" />;
  } else {
    content = (
      <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 gap-4 h-full">
        <FileWarning className="w-16 h-16 text-slate-400" />
        <p className="text-lg font-medium">Preview not available for this file type.</p>
        <a href={file.url} target="_blank" rel="noreferrer" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-semibold transition-all flex items-center gap-2">
          <Download className="w-4 h-4" /> Download File
        </a>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-8 animate-in fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full h-[85vh] flex flex-col overflow-hidden relative animate-in zoom-in-95">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" /> {file.title}
          </h3>
          <div className="flex items-center gap-2">
            <a href={file.url} target="_blank" rel="noreferrer" className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-100 p-2 rounded-lg transition-colors">
              <Download className="w-5 h-5" />
            </a>
            <button onClick={onClose} className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 p-2 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 bg-slate-100 dark:bg-slate-950 relative overflow-hidden flex items-center justify-center p-4">
          {content}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// TEACHER PORTAL & ANALYTICS
// ==========================================
function TeacherPortal({ allClasses, user, db, storage, isTeacher }) {
  const [selectedClass, setSelectedClass] = useState(null);
  const [viewingAnalytics, setViewingAnalytics] = useState(null);
  const [viewingStudent, setViewingStudent] = useState(null);
  const teacherClasses = allClasses; // Show all classes to approved teachers

  if (viewingStudent && viewingAnalytics) {
    const activeClass = allClasses.find(c => c.id === viewingAnalytics.id) || viewingAnalytics;
    const studentUser = { 
      uid: viewingStudent.id, 
      isAnonymous: false, 
      displayName: viewingStudent.displayName, 
      email: viewingStudent.email,
      progress: viewingStudent.progress
    };
    return (
      <div className="w-full flex flex-col gap-4 animate-in fade-in">
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <h3 className="font-bold text-indigo-800 dark:text-indigo-300">Viewing Student Dashboard</h3>
            <p className="text-sm text-indigo-600 dark:text-indigo-400">You are viewing {viewingStudent.displayName || 'Anonymous'}'s progress in read-only mode.</p>
          </div>
        </div>
        <ClassViewer currentClass={activeClass} onBack={() => setViewingStudent(null)} user={studentUser} db={db} storage={storage} readOnly={true} isTeacher={isTeacher} />
      </div>
    );
  }

  if (!isTeacher) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <FileWarning className="w-16 h-16 text-red-400 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Access Denied</h2>
        <p className="text-slate-500">Your account ({user?.email}) is not approved for teacher access.</p>
      </div>
    );
  }

  const handleCreateClass = async () => {
    const code = Math.random().toString(36).substring(2, 8).toLowerCase();
    const newClass = {
      code,
      title: 'New Class',
      teacherId: user.uid,
      units: [],
      additionalMaterials: []
    };
    try {
      const classRef = doc(collection(db, 'classes'));
      await setDoc(classRef, newClass);
      setSelectedClass({ id: classRef.id, ...newClass });
    } catch (e) {
      alert("Error creating class: " + e.message);
    }
  };

  const handleDeleteClass = async (classId) => {
    if (!window.confirm("Are you sure you want to delete this class? All data will be lost.")) return;
    try {
      await deleteDoc(doc(db, 'classes', classId));
      if (selectedClass?.id === classId) setSelectedClass(null);
      if (viewingAnalytics?.id === classId) setViewingAnalytics(null);
    } catch (e) {
      alert("Error deleting class: " + e.message);
    }
  };

  if (selectedClass) {
    const activeClass = allClasses.find(c => c.id === selectedClass.id) || selectedClass;
    return <ClassEditor classData={activeClass} onBack={() => setSelectedClass(null)} db={db} storage={storage} />;
  }

  if (viewingAnalytics) {
    const activeClass = allClasses.find(c => c.id === viewingAnalytics.id) || viewingAnalytics;
    return <AnalyticsViewer classData={activeClass} onBack={() => setViewingAnalytics(null)} db={db} onViewStudent={setViewingStudent} />;
  }

  return (
    <div className="w-full animate-in fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Teacher Dashboard</h2>
          <p className="text-slate-500 mt-1">Manage your classes and learning materials.</p>
        </div>
        <button onClick={handleCreateClass} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all">
          <Plus className="w-5 h-5" /> Create Class
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teacherClasses.length === 0 ? (
          <div className="col-span-full bg-slate-100 dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-12 flex flex-col items-center justify-center text-slate-500">
            <BookOpen className="w-12 h-12 mb-4 text-slate-400" />
            <p className="text-lg font-medium">No classes yet.</p>
            <p className="text-sm">Create your first class to get started.</p>
          </div>
        ) : (
          teacherClasses.map(cls => (
            <div key={cls.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative group">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 p-3 rounded-lg">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <button onClick={() => handleDeleteClass(cls.id)} className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">{cls.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 inline-block px-2 py-1 rounded">Code: {cls.code}</p>
              
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1"><Layers className="w-4 h-4"/> {cls.units?.length || 0} Units</span>
              </div>
              
              <div className="flex gap-2 mt-4">
                <button onClick={() => setViewingAnalytics(cls)} className="flex-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 border border-emerald-200 dark:border-emerald-800/50 transition-colors">
                  <BarChart className="w-4 h-4" /> Analytics
                </button>
                <button onClick={() => setSelectedClass(cls)} className="flex-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 transition-colors">
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function AnalyticsViewer({ classData, onBack, db, onViewStudent }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Calculate total items in the class
  let totalItems = 0;
  classData.units?.forEach(unit => {
    totalItems += (unit.lessons?.length || 0) + (unit.materials?.length || 0);
  });
  totalItems += (classData.additionalMaterials?.length || 0);

  useEffect(() => {
    const studentsRef = collection(db, 'classes', classData.id, 'students');
    const unsubscribe = onSnapshot(studentsRef, (snapshot) => {
      const studentData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStudents(studentData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [classData.id, db]);

  return (
    <div className="w-full animate-in fade-in">
      <div className="flex items-center justify-between mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <ArrowRight className="w-6 h-6 rotate-180" />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Class Analytics</h2>
            <p className="text-slate-500 font-medium mt-1">{classData.title} <span className="text-slate-400 font-mono text-sm ml-2 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">Code: {classData.code}</span></p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <h3 className="font-bold flex items-center gap-2"><Users className="w-5 h-5 text-indigo-500" /> Enrolled Students ({students.length})</h3>
          <p className="text-sm text-slate-500 font-medium">Total Materials: {totalItems}</p>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading student data...</div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <UserCircle className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-lg font-medium text-slate-600 dark:text-slate-400">No students have joined yet.</p>
            <p className="text-sm text-slate-400 mt-1">Students must sign in with Google to appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold border-b border-slate-200 dark:border-slate-700">Student Name</th>
                  <th className="p-4 font-semibold border-b border-slate-200 dark:border-slate-700">Contact</th>
                  <th className="p-4 font-semibold border-b border-slate-200 dark:border-slate-700 w-1/3">Course Progress</th>
                  <th className="p-4 font-semibold border-b border-slate-200 dark:border-slate-700 text-right">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {students.map(student => {
                  let completedCount = 0;
                  if (student.progress) {
                    Object.values(student.progress).forEach(val => { if (val) completedCount++; });
                  }
                  const pct = totalItems === 0 ? 0 : Math.round((completedCount / totalItems) * 100);
                  
                  // Format timestamp
                  let lastActiveStr = "Unknown";
                  if (student.lastAccess && student.lastAccess.toDate) {
                    const date = student.lastAccess.toDate();
                    lastActiveStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                  }

                  return (
                    <tr key={student.id} onClick={() => onViewStudent(student)} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group">
                      <td className="p-4 font-medium text-slate-800 dark:text-slate-200 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                          {student.displayName?.charAt(0) || '?'}
                        </div>
                        <span className="group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{student.displayName || 'Anonymous'}</span>
                      </td>
                      <td className="p-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 shrink-0" /> <span className="truncate max-w-[150px] inline-block">{student.email}</span></span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden flex-1">
                            <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                          </div>
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 w-10 text-right shrink-0">{pct}%</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-500 text-right">
                        <span className="flex items-center justify-end gap-1.5"><Clock className="w-3.5 h-3.5 shrink-0" /> {lastActiveStr}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ClassEditor({ classData, onBack, db, storage }) {
  const [title, setTitle] = useState(classData.title);

  useEffect(() => {
    if (title === classData.title) return;
    const timer = setTimeout(async () => {
      await setDoc(doc(db, 'classes', classData.id), { title }, { merge: true });
    }, 1000);
    return () => clearTimeout(timer);
  }, [title, classData.id, classData.title, db]);

  const addUnit = async () => {
    const newUnit = { id: generateId(), title: 'New Unit', lessons: [], materials: [] };
    const updatedUnits = [...(classData.units || []), newUnit];
    await setDoc(doc(db, 'classes', classData.id), { units: updatedUnits }, { merge: true });
  };

  const removeUnit = async (unitId) => {
    if (!window.confirm("Remove this unit?")) return;
    const updatedUnits = classData.units.filter(u => u.id !== unitId);
    await setDoc(doc(db, 'classes', classData.id), { units: updatedUnits }, { merge: true });
  };

  const updateUnitTitle = async (unitId, newTitle) => {
    const updatedUnits = classData.units.map(u => u.id === unitId ? { ...u, title: newTitle } : u);
    await setDoc(doc(db, 'classes', classData.id), { units: updatedUnits }, { merge: true });
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <ArrowRight className="w-6 h-6 rotate-180" />
          </button>
          <div>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              className="text-3xl font-bold bg-transparent outline-none border-b border-transparent focus:border-indigo-500 transition-colors"
            />
            <p className="text-slate-500 font-mono mt-1">Class Code: <span className="font-bold text-indigo-600 dark:text-indigo-400">{classData.code}</span></p>
          </div>
        </div>
        <div className="flex items-center bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={classData.feedbackEnabled || false} 
              onChange={async (e) => {
                await setDoc(doc(db, 'classes', classData.id), { feedbackEnabled: e.target.checked }, { merge: true });
              }} 
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" 
            />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Enable Feedback Module</span>
          </label>
        </div>
      </div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold flex items-center gap-2"><Layers className="w-5 h-5 text-indigo-500" /> Course Units</h3>
        <button onClick={addUnit} className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400 px-3 py-1.5 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-semibold flex items-center gap-1">
          <Plus className="w-4 h-4" /> Add Unit
        </button>
      </div>

      <div className="space-y-6">
        {(classData.units || []).map((unit, idx) => (
          <div key={unit.id} className="bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-5 relative">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded">UNIT {idx + 1}</span>
              <input 
                type="text" 
                value={unit.title} 
                onChange={(e) => updateUnitTitle(unit.id, e.target.value)}
                placeholder="Unit Title" 
                className="flex-1 p-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold bg-white dark:bg-slate-800"
              />
              <button onClick={() => removeUnit(unit.id)} className="text-slate-400 hover:text-red-500 p-2"><Trash2 className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FileListEditor 
                title="Lessons" 
                icon={FileText} 
                color="indigo" 
                items={unit.lessons || []} 
                classData={classData} 
                unitId={unit.id} 
                field="lessons" 
                db={db} storage={storage} 
              />
              <FileListEditor 
                title="Materials" 
                icon={Paperclip} 
                color="emerald" 
                items={unit.materials || []} 
                classData={classData} 
                unitId={unit.id} 
                field="materials" 
                db={db} storage={storage} 
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeedbackBoard({ classId, user, db, storage, isTeacher, readOnly }) {
  const [posts, setPosts] = useState([]);
  const [newPostText, setNewPostText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [commentInputs, setCommentInputs] = useState({});

  useEffect(() => {
    const q = query(collection(db, 'classes', classId, 'feedback_posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setPosts(postsData);
    });
    return () => unsubscribe();
  }, [classId, db]);

  const handlePost = async () => {
    if ((!newPostText.trim() && !imageFile) || readOnly) return;
    setUploading(true);
    let imageUrl = null;

    try {
      if (imageFile) {
        const uniqueName = `${Date.now()}_${generateId()}_${imageFile.name}`;
        const storageRef = ref(storage, `feedback_images/${classId}/${uniqueName}`);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, 'classes', classId, 'feedback_posts'), {
        text: newPostText.trim(),
        imageUrl,
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous Student',
        createdAt: serverTimestamp(),
        comments: []
      });

      setNewPostText('');
      setImageFile(null);
    } catch (err) {
      console.error(err);
      alert('Error posting feedback.');
    } finally {
      setUploading(false);
    }
  };

  const handleComment = async (postId) => {
    const text = commentInputs[postId]?.trim();
    if (!text || readOnly) return;

    try {
      const postRef = doc(db, 'classes', classId, 'feedback_posts', postId);
      await updateDoc(postRef, {
        comments: arrayUnion({
          id: generateId(),
          text,
          authorId: user.uid,
          authorName: user.displayName || 'Anonymous Student',
          createdAt: new Date().toISOString()
        })
      });
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    } catch (err) {
      console.error(err);
      alert('Error posting comment.');
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in">
      {!readOnly && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4">
          <textarea
            value={newPostText}
            onChange={(e) => setNewPostText(e.target.value)}
            placeholder="Share your work or ask for feedback..."
            className="w-full bg-transparent border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none min-h-[100px] mb-3 dark:text-slate-100"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input type="file" accept="image/*" id="feedback-image" className="hidden" onChange={(e) => setImageFile(e.target.files[0])} />
              <label htmlFor="feedback-image" className="cursor-pointer text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 text-sm font-medium transition-colors">
                <ImageIcon className="w-5 h-5" />
                {imageFile ? imageFile.name : 'Attach Image'}
              </label>
              {imageFile && <button onClick={() => setImageFile(null)} className="text-red-500 hover:text-red-700 ml-2"><X className="w-4 h-4" /></button>}
            </div>
            <button 
              onClick={handlePost} 
              disabled={uploading || (!newPostText.trim() && !imageFile)}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all shadow-sm"
            >
              {uploading ? 'Posting...' : <><Send className="w-4 h-4" /> Post</>}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {posts.map(post => (
          <div key={post.id} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800/50">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                    {isTeacher ? (post.authorName?.charAt(0) || '?') : '?'}
                  </div>
                  <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                    {isTeacher ? post.authorName : 'Anonymous Student'}
                  </span>
                </div>
                {isTeacher && (
                  <button 
                    onClick={async () => {
                      if (window.confirm('Delete this post?')) {
                        await deleteDoc(doc(db, 'classes', classId, 'feedback_posts', post.id));
                      }
                    }}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              {post.text && <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap">{post.text}</p>}
              {post.imageUrl && (
                <div className="mt-3 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2">
                  <img src={post.imageUrl} alt="Feedback attachment" className="max-w-full max-h-96 object-contain mx-auto rounded" />
                </div>
              )}
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-800/30 p-4">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Comments ({post.comments?.length || 0})</h4>
              <div className="space-y-3 mb-3">
                {(post.comments || []).map(comment => (
                  <div key={comment.id} className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-bold text-xs uppercase shrink-0 mt-0.5">
                      {isTeacher ? (comment.authorName?.charAt(0) || '?') : '?'}
                    </div>
                    <div className="flex-1 bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm shadow-sm">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-0.5">
                        {isTeacher ? comment.authorName : 'Anonymous Student'}
                      </span>
                      <p className="text-slate-600 dark:text-slate-400">{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              {!readOnly && (
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={commentInputs[post.id] || ''}
                    onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)}
                    placeholder="Add a comment..."
                    className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-slate-100"
                  />
                  <button 
                    onClick={() => handleComment(post.id)}
                    disabled={!commentInputs[post.id]?.trim()}
                    className="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 disabled:opacity-50 px-3 py-2 rounded-lg transition-colors flex items-center justify-center border border-indigo-200 dark:border-indigo-800"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {posts.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-700" />
            <p className="font-medium text-lg text-slate-600 dark:text-slate-400">No feedback posted yet.</p>
            <p className="text-sm">Be the first to ask for feedback!</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FileListEditor({ title, icon: Icon, color, items, classData, unitId, field, db, storage }) {
  const [uploading, setUploading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    setUploading(true);
    try {
      const newItems = [];
      for (const file of files) {
        const uniqueName = `${Date.now()}_${generateId()}_${file.name}`;
        const storageRef = ref(storage, `class_materials/${classData.id}/${uniqueName}`);
        
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);

        newItems.push({
          id: generateId(),
          title: file.name.split('.')[0],
          fileName: file.name,
          url: url
        });
      }

      const updatedUnits = classData.units.map(u => {
        if (u.id === unitId) {
          return { ...u, [field]: [...(u[field] || []), ...newItems] };
        }
        return u;
      });

      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';

      await setDoc(doc(db, 'classes', classData.id), { units: updatedUnits }, { merge: true });
    } catch (err) {
      console.error("Upload failed", err);
      alert("File upload failed. Ensure your Firebase Storage Rules allow read/write. Error: " + err.message);
      
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } 
  };

  const handleAddLink = async () => {
    let url = window.prompt("Enter the link URL (e.g., https://example.com):");
    if (!url) return;
    
    // Basic sanitization to ensure proper hyperlinking
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }

    const title = window.prompt("Enter a title for this link:") || "New Link";
    
    const newItem = {
      id: generateId(),
      title: title,
      fileName: 'External Link',
      url: url,
      isLink: true
    };

    const updatedUnits = classData.units.map(u => {
      if (u.id === unitId) {
        return { ...u, [field]: [...(u[field] || []), newItem] };
      }
      return u;
    });

    await setDoc(doc(db, 'classes', classData.id), { units: updatedUnits }, { merge: true });
  };

  const removeItem = async (itemId) => {
    const updatedUnits = classData.units.map(u => {
      if (u.id === unitId) {
        return { ...u, [field]: u[field].filter(i => i.id !== itemId) };
      }
      return u;
    });
    await setDoc(doc(db, 'classes', classData.id), { units: updatedUnits }, { merge: true });
  };

  const updateItemProps = async (itemId, updates) => {
    const updatedUnits = classData.units.map(u => {
      if (u.id === unitId) {
        return { 
          ...u, 
          [field]: u[field].map(i => i.id === itemId ? { ...i, ...updates } : i) 
        };
      }
      return u;
    });
    await setDoc(doc(db, 'classes', classData.id), { units: updatedUnits }, { merge: true });
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    const rowElement = e.currentTarget.parentElement;
    if (rowElement) {
      const rect = rowElement.getBoundingClientRect();
      e.dataTransfer.setDragImage(rowElement, e.clientX - rect.left, e.clientY - rect.top);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newItems = [...items];
    const [movedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(dropIndex, 0, movedItem);

    const updatedUnits = classData.units.map(u => {
      if (u.id === unitId) {
        return { ...u, [field]: newItems };
      }
      return u;
    });

    setDraggedIndex(null);
    await setDoc(doc(db, 'classes', classData.id), { units: updatedUnits }, { merge: true });
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className={`flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-700 pb-2`}>
        <h3 className="text-sm font-bold flex items-center gap-2">
          <Icon className={`w-4 h-4 text-${color}-500`} /> {title}
        </h3>
        <div className="flex items-center gap-3">
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple className="hidden" />
          <button 
            onClick={() => fileInputRef.current.click()} 
            disabled={uploading}
            className={`text-xs text-${color}-600 dark:text-${color}-400 hover:text-${color}-800 font-semibold flex items-center gap-1 transition-colors`}
          >
            {uploading ? <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /> : <Plus className="w-3 h-3" />} Upload
          </button>
          <button 
            onClick={handleAddLink} 
            disabled={uploading}
            className={`text-xs text-${color}-600 dark:text-${color}-400 hover:text-${color}-800 font-semibold flex items-center gap-1 transition-colors`}
          >
            <Link className="w-3 h-3" /> Link
          </button>
        </div>
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <FileItemEditor 
            key={item.id} 
            item={item} 
            index={index}
            onUpdate={updateItemProps} 
            onRemove={removeItem} 
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={() => setDraggedIndex(null)}
            isDragging={draggedIndex === index}
          />
        ))}
        {items.length === 0 && <p className="text-xs text-slate-400 italic text-center py-2">Empty</p>}
      </div>
    </div>
  );
}

function FileItemEditor({ item, onUpdate, onRemove, index, onDragStart, onDragOver, onDrop, onDragEnd, isDragging }) {
  const [title, setTitle] = useState(item.title);

  useEffect(() => {
    setTitle(item.title);
  }, [item.title]);

  useEffect(() => {
    if (title === item.title) return;
    const timer = setTimeout(() => {
      onUpdate(item.id, { title });
    }, 1000);
    return () => clearTimeout(timer);
  }, [title, item.id, item.title, onUpdate]);

  const handleTagChange = (e) => {
    onUpdate(item.id, { tag: e.target.value });
  };

  return (
    <div 
      className={`flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-opacity ${isDragging ? 'opacity-50' : ''}`}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div 
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        className="cursor-grab text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 active:cursor-grabbing p-1 -ml-1 shrink-0"
      >
        <GripVertical className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0 flex flex-col">
        <input 
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-sm font-medium bg-transparent outline-none border-b border-transparent focus:border-indigo-500 transition-colors w-full dark:text-slate-200 mb-1"
          placeholder="File Title"
        />
        <p className="text-xs text-slate-500 truncate font-mono">{item.fileName}</p>
      </div>
      <select 
        value={item.tag || ''} 
        onChange={handleTagChange}
        className="text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded p-1 outline-none text-slate-700 dark:text-slate-300 shrink-0"
      >
        <option value="">No Tag</option>
        <option value="Complete">Complete</option>
        <option value="This Class">This Class</option>
      </select>
      <button onClick={() => onRemove(item.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1 shrink-0"><X className="w-4 h-4"/></button>
    </div>
  );
}