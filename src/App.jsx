import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  onSnapshot,
  arrayUnion
} from 'firebase/firestore';
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported
} from 'firebase/messaging';
import {
  CheckCircle,
  Clock,
  Plus,
  LogOut,
  Bell,
  BellRing,
  ShieldCheck,
  Archive,
  Users,
  Sparkles,
  Check,
  ArrowRight,
  Layers,
  Camera,
  Trash2,
  UserPlus,
  Send,
  X,
  Calendar,
  RotateCcw,
  Lock,
  Volume2,
  VolumeX,
  Share2,
  Flame,
  Play,
  Pause,
  AlertTriangle,
  QrCode,
  Eye,
  EyeOff
} from 'lucide-react';

// ==========================================
// FIREBASE INITIALIZATION & CONFIG
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyA6dgN0VTqc34dsGbjFP5yunBtosMIYCx0",
  authDomain: "task-manager-ef880.firebaseapp.com",
  projectId: "task-manager-ef880",
  storageBucket: "task-manager-ef880.firebasestorage.app",
  messagingSenderId: "1096600194298",
  appId: "1:1096600194298:web:2bed3f9223d9224780cd43",
  measurementId: "G-VT8VQQ1HB0"
};

// YOUR FIREBASE WEB PUSH CERTIFICATE KEY PAIR (VAPID KEY):
const VAPID_KEY = "BBlYEeyX10lSW1ur3PQxgTzgkc6S8BbgjYrOLRg8udfgc_rLSD71uTLXODoJEu_M1felLwMYmOwurNCeqGkVEg0";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "store-team-tasks-v1";
const SESSION_STORAGE_KEY = "taskflow_saved_user_v1";

// Standard Repetitive Task Presets & Expectations
const TASK_PRESETS = [
  {
    id: 'custom',
    label: 'Custom (Type Your Own)',
    title: '',
    description: ''
  },
  {
    id: 'waste',
    label: 'Waste',
    title: 'Waste',
    description: 'Process all damages, splits, and out-of-date stock. Scan everything accurately, clear the waste cages/area, and upload a photo of the cleared area.'
  },
  {
    id: 'drop_tops',
    label: 'Drop Tops',
    title: 'Drop Tops',
    description: 'Pull down top-stock across the assigned aisles to fill shelf gaps, face up as you go, update any capacity issues, and upload a photo of the completed bays.'
  },
  {
    id: 'gifting',
    label: 'Gifting',
    title: 'Gifting',
    description: 'Replenish and dress the seasonal/gifting bays, ensure all price labels are present and aligned, remove empty cardboard, and upload a photo of the finished display.'
  },
  {
    id: 'hb',
    label: 'H&B',
    title: 'H&B',
    description: 'Work Health & Beauty delivery/backstock, check security tags on high-value lines, face up shelves, and upload a photo of completed bays.'
  },
  {
    id: 'horseshoe',
    label: 'Horseshoe',
    title: 'Horseshoe',
    description: 'Work and replenish the Horseshoe area, keep promotional lines topped up and faced, clear all rubbish, and upload a photo of the finished section.'
  },
  {
    id: 'modular_compliance',
    label: 'Modular Compliance',
    title: 'Modular Compliance',
    description: 'Relay/check bays against the current modular plan, ensure all SELs/ESLs are aligned to the left edge and match product facings, and upload a clear photo of the bay.'
  },
  {
    id: 'camera_tasks',
    label: 'Camera Tasks',
    title: 'Camera Tasks',
    description: 'Action the latest overhead camera gap/stock alerts, replenish or zero-check flagged lines, and upload a photo of the resolved bays.'
  },
  {
    id: 'clear',
    label: 'Warehouse',
    title: 'Warehouse',
    description: 'Wrap and clear cardboard and plastic cages, ensure there is one empty cardboard cage and one empty plastic cage ready to use. remove all unused pallets and place in designated area. Esure safety areas and fire routes are clear (inc fat barrel and gas canister areas).'
  },
  {
    id: 'shippers',
    label: 'Shippers',
    title: 'Shippers',
    description: 'Work all shippers from the warehouse maximising potential sales. Ensure all shippers are complete with SELs, upload photo of shipper area in the warehouse when done.'
  },
  {
    id: 'Euros',
    label: 'Euros',
    title: 'Euros',
    description: 'Work all MUs and euros (inc Water and paper and seasonal) ensure SELs and flags are present. Upload photo when complete  .'
  },
  {
    id: 'promo',
    label: 'Promo',
    title: 'Promo',
    description: 'Replenish promotional end-caps and features, verify correct promotional barkers/POS are displayed, face up stock, and upload a photo of the end-cap.'
  }
];

const PAUSE_REASONS = [
  'Called to Checkouts / Front End',
  'Covering Colleague Break',
  'Pulled to Another Urgent Job',
  'Tipping Delivery Wagon / Backdoor',
  'Helping Customer Inquiry'
];

// Default Seeded Team Structure: 1 Manager, 2 Team Leaders, 7 Colleagues
const DEFAULT_USERS = [
  { id: 'mgr-1', name: 'Lee (Manager)', role: 'manager', pin: '1234', color: 'bg-indigo-600', fcmTokens: [] },
  { id: 'tl-1', name: 'Team Leader 1', role: 'team_leader', pin: '1234', color: 'bg-violet-600', fcmTokens: [] },
  { id: 'tl-2', name: 'Team Leader 2', role: 'team_leader', pin: '1234', color: 'bg-purple-600', fcmTokens: [] },
  { id: 'col-1', name: 'Colleague 1', role: 'colleague', pin: '1234', color: 'bg-blue-600', fcmTokens: [] },
  { id: 'col-2', name: 'Colleague 2', role: 'colleague', pin: '1234', color: 'bg-emerald-600', fcmTokens: [] },
  { id: 'col-3', name: 'Colleague 3', role: 'colleague', pin: '1234', color: 'bg-amber-600', fcmTokens: [] },
  { id: 'col-4', name: 'Colleague 4', role: 'colleague', pin: '1234', color: 'bg-rose-600', fcmTokens: [] },
  { id: 'col-5', name: 'Colleague 5', role: 'colleague', pin: '1234', color: 'bg-cyan-600', fcmTokens: [] },
  { id: 'col-6', name: 'Colleague 6', role: 'colleague', pin: '1234', color: 'bg-teal-600', fcmTokens: [] },
  { id: 'col-7', name: 'Colleague 7', role: 'colleague', pin: '1234', color: 'bg-orange-600', fcmTokens: [] }
];

const AVATAR_COLORS = [
  'bg-blue-600', 'bg-emerald-600', 'bg-violet-600',
  'bg-amber-600', 'bg-rose-600', 'bg-cyan-600', 'bg-teal-600'
];

// Built-in Web Audio API two-tone notification chime (when app is open)
let sharedAudioCtx = null;
const playNotificationChime = () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioContextClass();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume();
    }

    const now = sharedAudioCtx.currentTime;

    // First tone (A5 - 880Hz)
    const osc1 = sharedAudioCtx.createOscillator();
    const gain1 = sharedAudioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc1.connect(gain1);
    gain1.connect(sharedAudioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.25);

    // Second tone (C#6 - 1108.73Hz)
    const osc2 = sharedAudioCtx.createOscillator();
    const gain2 = sharedAudioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1108.73, now + 0.15);
    gain2.gain.setValueAtTime(0.3, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(sharedAudioCtx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.55);

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  } catch (err) {
    console.error("Audio playback error:", err);
  }
};

// Trigger Native OS Lock-Screen / System Banner Notification
const triggerSystemNotification = async (title, body) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          body,
          icon: '/vite.svg',
          badge: '/vite.svg',
          vibrate: [200, 100, 200],
          requireInteraction: false,
          tag: 'taskflow-' + Date.now()
        });
        return;
      }
    }
    new Notification(title, {
      body,
      icon: '/vite.svg'
    });
  } catch (err) {
    console.error("System notification error:", err);
  }
};

// Helper to compress mobile photos so they fit cleanly in Firestore
const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const scaleSize = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
        canvas.width = img.width * scaleSize;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

// Helper to generate a high-contrast QR code image URL for Zebra terminal scanners
const getQrImageUrl = (value) => {
  if (!value) return '';
  return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=14&ecc=M&data=${encodeURIComponent(value)}`;
};

// Helper to sort active tasks so Needs Reassignment and Urgent Priority tasks always sit at the top
const sortTasksByPriorityAndDate = (taskList) => {
  return [...taskList].sort((a, b) => {
    const aHandover = a.progressStatus === 'incomplete_handover' ? 1 : 0;
    const bHandover = b.progressStatus === 'incomplete_handover' ? 1 : 0;
    if (aHandover !== bHandover) return bHandover - aHandover;

    const aUrgent = a.priority === 'urgent' ? 1 : 0;
    const bUrgent = b.priority === 'urgent' ? 1 : 0;
    if (aUrgent !== bUrgent) return bUrgent - aUrgent;
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });
};

export default function App() {
  const [fbUser, setFbUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Logged-in User Profile (Initialized from localStorage so you stay signed in)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loginTarget, setLoginTarget] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Audible & System Lock-Screen Notification State
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [fcmEnabled, setFcmEnabled] = useState(false);
  const prevUnreadCountRef = useRef(null);

  // Self-Service Change PIN Modal State
  const [showPinModal, setShowPinModal] = useState(false);
  const [selfNewPin, setSelfNewPin] = useState('');

  // Manager Inline User Edit State
  const [editingUserId, setEditingUserId] = useState(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserRole, setEditUserRole] = useState('colleague');
  const [editUserPin, setEditUserPin] = useState('');

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState('tasks');
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // Firestore Collections State
  const [teamUsers, setTeamUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // New Task Form State (Manager / Team Leader - Supports Presets, Priority & Multiple Assignees)
  const [selectedPreset, setSelectedPreset] = useState('custom');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('standard'); // 'standard' | 'urgent'
  const [taskAssigneeIds, setTaskAssigneeIds] = useState([]);
  const [taskPhoto, setTaskPhoto] = useState(null);

  // Team Leader Reassign / Delegate OR Supervisor Incomplete Handover Modal State
  const [delegatingTask, setDelegatingTask] = useState(null);
  const [delegateTargetIds, setDelegateTargetIds] = useState([]);
  const [delegateNote, setDelegateNote] = useState('');

  // Pause Task Modal State
  const [pausingTask, setPausingTask] = useState(null);
  const [pauseReason, setPauseReason] = useState('');

  // Colleague Incomplete / Shift Handover Modal State
  const [handoverTask, setHandoverTask] = useState(null);
  const [handoverNote, setHandoverNote] = useState('');
  const [handoverPhoto, setHandoverPhoto] = useState(null);

  // Colleague Task Completion Modal State
  const [completingTask, setCompletingTask] = useState(null);
  const [completionNote, setCompletionNote] = useState('');
  const [completionPhoto, setCompletionPhoto] = useState(null);

  // Task Comment Input State (by taskId)
  const [commentInputs, setCommentInputs] = useState({});

  // Photo & QR Fullscreen Lightbox State
  const [lightboxImage, setLightboxImage] = useState(null);
  const [qrZoomModal, setQrZoomModal] = useState(null); // { title: 'Email' | 'Password', value: string }

  // LocalStorage Terminal Login QR State (Saved strictly on user's own device)
  const [terminalEmailInput, setTerminalEmailInput] = useState('');
  const [terminalPasswordInput, setTerminalPasswordInput] = useState('');
  const [savedTerminalQr, setSavedTerminalQr] = useState({ email: '', password: '' });
  const [revealPasswordQr, setRevealPasswordQr] = useState(false);

  // Colleague Manager Request Form State
  const [reqType, setReqType] = useState('Time Off / Holiday');
  const [reqDates, setReqDates] = useState('');
  const [reqNote, setReqNote] = useState('');
  const [managerReplyInputs, setManagerReplyInputs] = useState({});

  // User Management Form State (Manager Only)
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('colleague');
  const [newUserPin, setNewUserPin] = useState('1234');

  // Toast Notification State
  const [toast, setToast] = useState({ show: false, title: '', message: '' });

  const showToast = (title, message) => {
    setToast({ show: true, title, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4500);
  };

  // Load User's LocalStorage Terminal QR Credentials when they log in
  useEffect(() => {
    if (!currentUser) {
      setSavedTerminalQr({ email: '', password: '' });
      setTerminalEmailInput('');
      setTerminalPasswordInput('');
      setRevealPasswordQr(false);
      return;
    }
    try {
      const storageKey = `taskflow_terminal_qr_${currentUser.id}`;
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setSavedTerminalQr({
          email: parsed.email || '',
          password: parsed.password || ''
        });
        setTerminalEmailInput(parsed.email || '');
        setTerminalPasswordInput(parsed.password || '');
      } else {
        setSavedTerminalQr({ email: '', password: '' });
        setTerminalEmailInput('');
        setTerminalPasswordInput('');
      }
    } catch (err) {
      console.error("Error loading terminal QR from localStorage:", err);
    }
  }, [currentUser?.id]);

  // Save Terminal QR Credentials to Device LocalStorage Only
  const handleSaveTerminalQr = (e) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      const storageKey = `taskflow_terminal_qr_${currentUser.id}`;
      const payload = {
        email: terminalEmailInput.trim(),
        password: terminalPasswordInput
      };
      localStorage.setItem(storageKey, JSON.stringify(payload));
      setSavedTerminalQr(payload);
      showToast("Terminal QR Codes Saved", "Saved privately on this phone for terminal scanning.");
    } catch (err) {
      console.error("Error saving terminal QR:", err);
      showToast("Error", "Could not save QR codes to local storage.");
    }
  };

  // Clear Terminal QR Credentials from Device LocalStorage
  const handleClearTerminalQr = () => {
    if (!currentUser) return;
    try {
      localStorage.removeItem(`taskflow_terminal_qr_${currentUser.id}`);
      setSavedTerminalQr({ email: '', password: '' });
      setTerminalEmailInput('');
      setTerminalPasswordInput('');
      setRevealPasswordQr(false);
      showToast("QR Codes Cleared", "Removed terminal login QR codes from this device.");
    } catch (err) {
      console.error("Error clearing terminal QR:", err);
    }
  };

  // Handle Selecting a Repetitive Task Preset
  const handleSelectPreset = (presetId) => {
    setSelectedPreset(presetId);
    const found = TASK_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setTaskTitle(found.title);
      setTaskDesc(found.description);
    }
  };

  // Register FCM Service Worker & Listen for Foreground Push Messages
  useEffect(() => {
    const setupForegroundMessaging = async () => {
      try {
        const supported = await isSupported();
        if (!supported) return;
        const messaging = getMessaging(app);
        onMessage(messaging, (payload) => {
          const title = payload.notification?.title || 'TaskFlow Alert';
          const body = payload.notification?.body || '';
          if (soundEnabled) playNotificationChime();
          showToast(title, body);
        });
      } catch (err) {
        console.log('Foreground FCM init skipped:', err);
      }
    };
    setupForegroundMessaging();
  }, [soundEnabled]);

  // Subscribe User Device to FCM Background Push Token
  const handleEnableLockScreenAlerts = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      showToast(
        "Add to Home Screen First",
        "On iPhone, tap Share then Add to Home Screen to enable lock-screen push alerts."
      );
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        showToast("Permission Blocked", "Please allow notifications in your phone/browser settings.");
        return;
      }

      playNotificationChime();

      const supported = await isSupported();
      if (supported && VAPID_KEY) {
        const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        const messaging = getMessaging(app);
        const currentToken = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: swRegistration
        });

        if (currentToken && currentUser) {
          const userDoc = doc(db, 'artifacts', appId, 'public', 'data', 'users', currentUser.id);
          await updateDoc(userDoc, {
            fcmTokens: arrayUnion(currentToken)
          });
          setFcmEnabled(true);
          showToast("FCM Push Active", "Phone registered for lock-screen push notifications even when closed.");
          return;
        }
      }

      await triggerSystemNotification(
        "Lock-Screen Alerts Enabled",
        "System notifications are now active on this device."
      );
      setFcmEnabled(true);
      showToast("Alerts Enabled", "Local lock-screen notifications enabled.");
    } catch (err) {
      console.error("FCM Token registration error:", err);
      showToast("Push Setup Note", "Ensure firebase-messaging-sw.js is inside your public folder.");
    }
  };

  // 1. Firebase Auth Connection
  useEffect(() => {
    signInAnonymously(auth).catch((err) => console.error("Auth error:", err));
    const unsubscribe = onAuthStateChange
