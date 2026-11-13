import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
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
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
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
  EyeOff,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  BarChart3,
  Copy
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

const VAPID_KEY = "BBlYEeyX10lSW1ur3PQxgTzgkc6S8BbgjYrOLRg8udfgc_rLSD71uTLXODoJEu_M1felLwMYmOwurNCeqGkVEg0";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "store-team-tasks-v1";
const SESSION_STORAGE_KEY = "taskflow_saved_user_v1";

// Standard Repetitive Task Presets & Expectations
const TASK_PRESETS = [
  { id: 'custom', label: 'Custom (Type Your Own)', title: '', description: '' },
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
    id: 'promo',
    label: 'Promo',
    title: 'Promo',
    description: 'Replenish promotional end-caps and features, verify correct promotional barkers/POS are displayed, face up stock, and upload a photo of the end-cap.'
  }
];

const PAUSE_REASONS = [
  'Called to Checkouts / Front End',
  'Pulled to Another Urgent Job',
  'On Break',
  'Helping a Customer',
  'Tipping Delivery / Warehouse'
];

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

const buildQrCodeUrl = (value) => {
  if (!value) return '';
  return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=16&data=${encodeURIComponent(value)}`;
};

let sharedAudioCtx = null;
const playNotificationChime = () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!sharedAudioCtx) sharedAudioCtx = new AudioContextClass();
    if (sharedAudioCtx.state === 'suspended') sharedAudioCtx.resume();

    const now = sharedAudioCtx.currentTime;
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
    console.error("Audio error:", err);
  }
};

// Uses a deterministic notification tag so Android collapses duplicate alerts into 1 banner
const triggerSystemNotification = async (title, body, uniqueTag = 'taskflow-alert') => {
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
          tag: uniqueTag,
          renotify: false
        });
        return;
      }
    }
    new Notification(title, { body, icon: '/vite.svg', tag: uniqueTag });
  } catch (err) {
    console.error("System notification error:", err);
  }
};

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

const sortTasksByPriorityAndDate = (taskList) => {
  return [...taskList].sort((a, b) => {
    const aHandover = a.progressStatus === 'incomplete' ? 1 : 0;
    const bHandover = b.progressStatus === 'incomplete' ? 1 : 0;
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

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [fcmEnabled, setFcmEnabled] = useState(false);
  const prevUnreadCountRef = useRef(null);
  const lastNotifiedIdRef = useRef(null);

  const [showPinModal, setShowPinModal] = useState(false);
  const [selfNewPin, setSelfNewPin] = useState('');

  const [editingUserId, setEditingUserId] = useState(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserRole, setEditUserRole] = useState('colleague');
  const [editUserPin, setEditUserPin] = useState('');

  const [activeTab, setActiveTab] = useState('tasks');
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // Performance Review Tab Filters (Manager Only)
  const [perfFilterUserId, setPerfFilterUserId] = useState('all');
  const [perfFilterView, setPerfFilterView] = useState('all_issues');

  // Collapsible Accordion States for Supervisor Board
  const [openSections, setOpenSections] = useState({
    reassigned: true,
    validation: true,
    inProgress: true,
    allocated: false,
    archive: false
  });

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [teamUsers, setTeamUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [selectedPreset, setSelectedPreset] = useState('custom');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('standard');
  const [taskAssigneeIds, setTaskAssigneeIds] = useState([]);
  const [taskPhoto, setTaskPhoto] = useState(null);

  const [delegatingTask, setDelegatingTask] = useState(null);
  const [delegateTargetIds, setDelegateTargetIds] = useState([]);
  const [delegateNote, setDelegateNote] = useState('');

  const [pausingTask, setPausingTask] = useState(null);
  const [pauseReason, setPauseReason] = useState(PAUSE_REASONS[0]);
  const [customPauseReason, setCustomPauseReason] = useState('');

  const [handoverTask, setHandoverTask] = useState(null);
  const [handoverNote, setHandoverNote] = useState('');

  const [completingTask, setCompletingTask] = useState(null);
  const [completionNote, setCompletionNote] = useState('');
  const [completionPhoto, setCompletionPhoto] = useState(null);

  const [commentInputs, setCommentInputs] = useState({});
  const [lightboxImage, setLightboxImage] = useState(null);
  const [lightboxTitle, setLightboxTitle] = useState('');

  const [reqType, setReqType] = useState('Time Off / Holiday');
  const [reqDates, setReqDates] = useState('');
  const [reqNote, setReqNote] = useState('');
  const [managerReplyInputs, setManagerReplyInputs] = useState({});

  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('colleague');
  const [newUserPin, setNewUserPin] = useState('1234');

  const [qrEmailInput, setQrEmailInput] = useState('');
  const [qrPasswordInput, setQrPasswordInput] = useState('');
  const [savedQrEmail, setSavedQrEmail] = useState('');
  const [savedQrPassword, setSavedQrPassword] = useState('');
  const [revealPasswordQr, setRevealPasswordQr] = useState(false);

  const [toast, setToast] = useState({ show: false, title: '', message: '' });

  const showToast = (title, message) => {
    setToast({ show: true, title, message });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 4500);
  };

  useEffect(() => {
    if (!currentUser) return;
    try {
      const raw = localStorage.getItem(`taskflow_terminal_qr_${currentUser.id}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        setSavedQrEmail(parsed.email || '');
        setSavedQrPassword(parsed.password || '');
        setQrEmailInput(parsed.email || '');
        setQrPasswordInput(parsed.password || '');
      } else {
        setSavedQrEmail('');
        setSavedQrPassword('');
        setQrEmailInput('');
        setQrPasswordInput('');
      }
      setRevealPasswordQr(false);
    } catch (err) {
      console.error("Error loading QR:", err);
    }
  }, [currentUser?.id]);

  const handleSaveEmailQr = (e) => {
    e.preventDefault();
    if (!currentUser) return;
    const trimmed = qrEmailInput.trim();
    setSavedQrEmail(trimmed);
    localStorage.setItem(
      `taskflow_terminal_qr_${currentUser.id}`,
      JSON.stringify({ email: trimmed, password: savedQrPassword })
    );
    showToast("Email QR Saved", "Your Asda Email QR code is saved on this phone.");
  };

  const handleSavePasswordQr = (e) => {
    e.preventDefault();
    if (!currentUser) return;
    const trimmed = qrPasswordInput.trim();
    setSavedQrPassword(trimmed);
    localStorage.setItem(
      `taskflow_terminal_qr_${currentUser.id}`,
      JSON.stringify({ email: savedQrEmail, password: trimmed })
    );
    showToast("Password QR Saved", "Your Password QR code is saved privately on this phone.");
  };

  const handleClearTerminalQr = () => {
    if (!currentUser) return;
    setSavedQrEmail('');
    setSavedQrPassword('');
    setQrEmailInput('');
    setQrPasswordInput('');
    localStorage.removeItem(`taskflow_terminal_qr_${currentUser.id}`);
    showToast("QR Codes Cleared", "Removed terminal login QR codes from this device.");
  };

  const handleSelectPreset = (presetId) => {
    setSelectedPreset(presetId);
    const found = TASK_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setTaskTitle(found.title);
      setTaskDesc(found.description);
    }
  };

  // Foreground FCM Listener: Only shows in-app toast & chime (does NOT spawn a second OS banner)
  useEffect(() => {
    let unsubFCM = null;
    const setupForegroundMessaging = async () => {
      try {
        const supported = await isSupported();
        if (!supported) return;
        const messaging = getMessaging(app);
        unsubFCM = onMessage(messaging, (payload) => {
          const title = payload.notification?.title || 'TaskFlow Alert';
          const body = payload.notification?.body || '';
          showToast(title, body);
        });
      } catch (err) {
        console.log('Foreground FCM skipped:', err);
      }
    };
    setupForegroundMessaging();
    return () => {
      if (typeof unsubFCM === 'function') unsubFCM();
    };
  }, []);

  const handleEnableLockScreenAlerts = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      showToast("Add to Home Screen First", "On iPhone, tap Share then Add to Home Screen to enable push alerts.");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        showToast("Permission Blocked", "Please allow notifications in your phone settings.");
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
          // Remove this device's token from any other user profiles on the same phone to stop duplicate banners
          for (const u of teamUsers) {
            if (u.id !== currentUser.id && Array.isArray(u.fcmTokens) && u.fcmTokens.includes(currentToken)) {
              const filtered = u.fcmTokens.filter((tk) => tk !== currentToken);
              await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', u.id), {
                fcmTokens: filtered
              });
            }
          }
          // Save deduplicated token to current user only
          const existingTokens = Array.isArray(currentUser.fcmTokens) ? currentUser.fcmTokens : [];
          const uniqueTokens = [...new Set([...existingTokens, currentToken])];
          const userDoc = doc(db, 'artifacts', appId, 'public', 'data', 'users', currentUser.id);
          await updateDoc(userDoc, { fcmTokens: uniqueTokens });
          setFcmEnabled(true);
          showToast("FCM Push Active", "Phone registered cleanly for single lock-screen notifications.");
          return;
        }
      }
      await triggerSystemNotification("Lock-Screen Alerts Enabled", "System notifications are active.", "taskflow-setup");
      setFcmEnabled(true);
    } catch (err) {
      console.error("FCM error:", err);
      showToast("Push Setup Note", "Ensure firebase-messaging-sw.js is in your public folder.");
    }
  };

  useEffect(() => {
    signInAnonymously(auth).catch((err) => console.error("Auth error:", err));
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFbUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!fbUser) return;
    const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'users');
    const tasksRef = collection(db, 'artifacts', appId, 'public', 'data', 'tasks');
    const requestsRef = collection(db, 'artifacts', appId, 'public', 'data', 'requests');
    const notifsRef = collection(db, 'artifacts', appId, 'public', 'data', 'notifications');

    const unsubUsers = onSnapshot(usersRef, async (snapshot) => {
      if (snapshot.empty) {
        for (const u of DEFAULT_USERS) {
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', u.id), u);
        }
      } else {
        const loaded = [];
        snapshot.forEach((d) => loaded.push({ id: d.id, ...d.data() }));
        const rolePriority = { manager: 1, team_leader: 2, colleague: 3 };
        loaded.sort((a, b) => (rolePriority[a.role] || 9) - (rolePriority[b.role] || 9) || a.name.localeCompare(b.name));
        setTeamUsers(loaded);
      }
    });

    const unsubTasks = onSnapshot(tasksRef, (snapshot) => {
      const loaded = [];
      snapshot.forEach((d) => loaded.push({ id: d.id, ...d.data() }));
      loaded.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setTasks(loaded);
    });

    const unsubReqs = onSnapshot(requestsRef, (snapshot) => {
      const loaded = [];
      snapshot.forEach((d) => loaded.push({ id: d.id, ...d.data() }));
      loaded.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setRequests(loaded);
    });

    const unsubNotifs = onSnapshot(notifsRef, (snapshot) => {
      const loaded = [];
      snapshot.forEach((d) => loaded.push({ id: d.id, ...d.data() }));
      loaded.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setNotifications(loaded);
    });

    return () => {
      unsubUsers();
      unsubTasks();
      unsubReqs();
      unsubNotifs();
    };
  }, [fbUser]);

  useEffect(() => {
    if (!currentUser || teamUsers.length === 0) return;
    const updatedProfile = teamUsers.find((u) => u.id === currentUser.id);
    if (updatedProfile) {
      setCurrentUser(updatedProfile);
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedProfile));
      if ((updatedProfile.fcmTokens || []).length > 0 && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        setFcmEnabled(true);
      }
    } else {
      setCurrentUser(null);
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [teamUsers]);

  const isSupervisor = currentUser?.role === 'manager' || currentUser?.role === 'team_leader';
  const myNotifications = currentUser
    ? notifications.filter((n) => {
        if ((n.clearedBy || []).includes(currentUser.id)) return false;
        if (n.targetUserId === currentUser.id) return true;
        if (n.targetRoleGroup === 'supervisors' && isSupervisor) return true;
        return false;
      })
    : [];
  const unreadNotifications = currentUser
    ? myNotifications.filter((n) => !(n.readBy || []).includes(currentUser.id))
    : [];
  const unreadCount = unreadNotifications.length;

  // Triple-banner fix: Only chime & show in-app toast when unread count increases.
  // Only fallback to local triggerSystemNotification if FCM push is NOT enabled on this profile.
  useEffect(() => {
    if (!currentUser) {
      prevUnreadCountRef.current = null;
      return;
    }
    if (prevUnreadCountRef.current !== null && unreadCount > prevUnreadCountRef.current) {
      const newestAlert = unreadNotifications[0];
      if (newestAlert && newestAlert.id !== lastNotifiedIdRef.current) {
        lastNotifiedIdRef.current = newestAlert.id;
        if (soundEnabled) playNotificationChime();
        showToast(newestAlert.title, newestAlert.message);

        const userHasFcmTokens = Array.isArray(currentUser.fcmTokens) && currentUser.fcmTokens.length > 0;
        if (!fcmEnabled && !userHasFcmTokens) {
          triggerSystemNotification(newestAlert.title, newestAlert.message, `notif-${newestAlert.id}`);
        }
      }
    }
    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount, currentUser?.id, soundEnabled, fcmEnabled]);

  const sendNotification = async (targetUserId, targetRoleGroup, title, message) => {
    try {
      const notifsRef = collection(db, 'artifacts', appId, 'public', 'data', 'notifications');
      const docRef = await addDoc(notifsRef, {
        targetUserId: targetUserId || null,
        targetRoleGroup: targetRoleGroup || null,
        title,
        message,
        readBy: [],
        clearedBy: [],
        createdAt: new Date().toISOString()
      });

      let targetTokens = [];
      if (targetUserId) {
        const targetUser = teamUsers.find((u) => u.id === targetUserId);
        if (targetUser && Array.isArray(targetUser.fcmTokens)) {
          targetTokens.push(...targetUser.fcmTokens);
        }
      } else if (targetRoleGroup === 'supervisors') {
        teamUsers
          .filter((u) => u.role === 'manager' || u.role === 'team_leader')
          .forEach((sup) => {
            if (Array.isArray(sup.fcmTokens)) targetTokens.push(...sup.fcmTokens);
          });
      }

      // Deduplicate tokens so the same phone never gets pinged 2 or 3 times for one alert
      const uniqueTokens = [...new Set(targetTokens.filter(Boolean))];

      if (uniqueTokens.length > 0) {
        fetch('/api/send-push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tokens: uniqueTokens,
            title,
            body: message,
            tag: `notif-${docRef.id}`
          })
        }).catch(() => {});
      }
    } catch (err) {
      console.error("Notification error:", err);
    }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!loginTarget) return;
    if (pinInput === (loginTarget.pin || '1234')) {
      prevUnreadCountRef.current = null;
      setCurrentUser(loginTarget);
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(loginTarget));
      setLoginTarget(null);
      setPinInput('');
      setLoginError('');
      setActiveTab('tasks');
    } else {
      setLoginError('Incorrect PIN. Please try again.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowNotifDropdown(false);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  };

  const handleSelfPinChange = async (e) => {
    e.preventDefault();
    if (!currentUser || !selfNewPin.trim()) return;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', currentUser.id), {
      pin: selfNewPin.trim()
    });
    setShowPinModal(false);
    setSelfNewPin('');
    showToast("PIN Updated", "Your new login PIN has been saved.");
  };

  const startEditUser = (u) => {
    setEditingUserId(u.id);
    setEditUserName(u.name);
    setEditUserRole(u.role);
    setEditUserPin(u.pin || '1234');
  };

  const handleSaveEditUser = async (userId) => {
    if (!editUserName.trim() || !editUserPin.trim()) return;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', userId), {
      name: editUserName.trim(),
      role: editUserRole,
      pin: editUserPin.trim()
    });
    setEditingUserId(null);
    showToast("Profile Updated", `Saved changes for ${editUserName.trim()}.`);
  };

  const handlePhotoUpload = async (e, setter) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setter(compressed);
    } catch {
      showToast("Photo Error", "Could not process photo.");
    }
  };

  const toggleTaskAssignee = (userId) => {
    setTaskAssigneeIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const toggleDelegateTarget = (userId) => {
    setDelegateTargetIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim() || taskAssigneeIds.length === 0) {
      showToast("Select Assignee", "Please tick at least one person.");
      return;
    }
    const selectedUsers = teamUsers.filter((u) => taskAssigneeIds.includes(u.id));
    if (selectedUsers.length === 0) return;

    const tasksRef = collection(db, 'artifacts', appId, 'public', 'data', 'tasks');
    const isUrgent = taskPriority === 'urgent';

    for (const assigneeObj of selectedUsers) {
      await addDoc(tasksRef, {
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        priority: taskPriority,
        progressStatus: 'not_started',
        startedAt: null,
        pausedAt: null,
        pauseReason: '',
        pauseHistory: [],
        handoverFromId: null,
        handoverFromName: null,
        handoverNote: '',
        handoverHistory: [],
        assigneeId: assigneeObj.id,
        assigneeName: assigneeObj.name,
        assigneeRole: assigneeObj.role,
        createdById: currentUser.id,
        createdByName: currentUser.name,
        delegatedByName: null,
        managerPhoto: taskPhoto || null,
        completionPhoto: null,
        completionNote: '',
        comments: [],
        status: 'active',
        createdAt: new Date().toISOString(),
        completedAt: null,
        validatedAt: null
      });

      await sendNotification(
        assigneeObj.id,
        null,
        isUrgent ? 'PRIORITY Task Assigned' : 'New Task Assigned',
        `${currentUser.name} assigned ${isUrgent ? '[PRIORITY] ' : ''}"${taskTitle.trim()}" to you.`
      );
    }

    setSelectedPreset('custom');
    setTaskTitle('');
    setTaskDesc('');
    setTaskPriority('standard');
    setTaskAssigneeIds([]);
    setTaskPhoto(null);
    showToast("Task Assigned", `Assigned to ${selectedUsers.map((u) => u.name).join(', ')}`);
  };

  const handleStartOrResumeTask = async (task) => {
    const nowIso = new Date().toISOString();
    const wasPaused = task.progressStatus === 'paused';
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', task.id), {
      progressStatus: 'in_progress',
      startedAt: task.startedAt || nowIso,
      pausedAt: null,
      pauseReason: ''
    });
    await sendNotification(
      null,
      'supervisors',
      wasPaused ? 'Task Resumed' : 'Task In Progress',
      `${currentUser.name} ${wasPaused ? 'resumed' : 'started'} "${task.title}".`
    );
    showToast(wasPaused ? "Task Resumed" : "Task Started", `"${task.title}" is now In Progress.`);
  };

  // Routine Pause: Logs context in pauseHistory, does NOT penalize colleague in handoverHistory
  const handleConfirmPauseTask = async (e) => {
    e.preventDefault();
    if (!pausingTask) return;
    const finalReason = pauseReason === 'Custom' ? customPauseReason.trim() || 'Paused' : pauseReason;
    const nowIso = new Date().toISOString();
    const updatedPauseHistory = [
      ...(pausingTask.pauseHistory || []),
      {
        userId: currentUser.id,
        userName: currentUser.name,
        reason: finalReason,
        pausedAt: nowIso
      }
    ];
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', pausingTask.id), {
      progressStatus: 'paused',
      pausedAt: nowIso,
      pauseReason: finalReason,
      pauseHistory: updatedPauseHistory
    });
    await sendNotification(null, 'supervisors', 'Task Paused', `${currentUser.name} paused "${pausingTask.title}" (${finalReason}).`);
    setPausingTask(null);
    setCustomPauseReason('');
    showToast("Task Paused", `Marked as paused: ${finalReason}`);
  };

  // Incomplete / Shift Handover: Logs permanent entry in handoverHistory for performance review
  const handleConfirmIncompleteHandover = async (e) => {
    e.preventDefault();
    if (!handoverTask || !handoverNote.trim()) return;
    const nowIso = new Date().toISOString();
    const newHandoverEntry = {
      id: Date.now().toString(),
      fromUserId: currentUser.id,
      fromUserName: currentUser.name,
      toUserName: null,
      type: 'Flagged Incomplete / Shift Handover',
      note: handoverNote.trim(),
      timestamp: nowIso
    };
    const updatedHandoverHistory = [...(handoverTask.handoverHistory || []), newHandoverEntry];

    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', handoverTask.id), {
      progressStatus: 'incomplete',
      handoverFromId: currentUser.id,
      handoverFromName: currentUser.name,
      handoverNote: handoverNote.trim(),
      handoverHistory: updatedHandoverHistory
    });
    await sendNotification(
      null,
      'supervisors',
      'Incomplete Task Needs Reassignment',
      `${currentUser.name} flagged "${handoverTask.title}" as incomplete: "${handoverNote.trim()}"`
    );
    setHandoverTask(null);
    setHandoverNote('');
    showToast("Flagged for Handover", "Supervisors alerted to reassign this task.");
  };

  const handleConfirmDelegation = async (e) => {
    e.preventDefault();
    if (!delegatingTask || delegateTargetIds.length === 0) return;
    const targetColleagues = teamUsers.filter((u) => delegateTargetIds.includes(u.id));
    if (targetColleagues.length === 0) return;

    const nowIso = new Date().toISOString();
    const wasStartedOrIncomplete =
      delegatingTask.progressStatus === 'in_progress' ||
      delegatingTask.progressStatus === 'paused' ||
      delegatingTask.progressStatus === 'incomplete';

    const previousWorkerId = wasStartedOrIncomplete
      ? delegatingTask.handoverFromId || delegatingTask.assigneeId
      : delegatingTask.handoverFromId || null;

    const previousWorker = wasStartedOrIncomplete
      ? delegatingTask.handoverFromName || delegatingTask.assigneeName
      : delegatingTask.handoverFromName || null;

    // If task was started/paused/incomplete and is now being reassigned to someone else, record in handoverHistory
    let updatedHandoverHistory = [...(delegatingTask.handoverHistory || [])];
    if (wasStartedOrIncomplete) {
      const targetNames = targetColleagues.map((u) => u.name).join(', ');
      const alreadyFlaggedIncomplete = delegatingTask.progressStatus === 'incomplete' && updatedHandoverHistory.length > 0;
      if (alreadyFlaggedIncomplete) {
        const lastIdx = updatedHandoverHistory.length - 1;
        updatedHandoverHistory[lastIdx] = {
          ...updatedHandoverHistory[lastIdx],
          toUserName: targetNames,
          reassignedBy: currentUser.name,
          reassignedAt: nowIso
        };
      } else {
        updatedHandoverHistory.push({
          id: Date.now().toString(),
          fromUserId: delegatingTask.assigneeId,
          fromUserName: delegatingTask.assigneeName,
          toUserName: targetNames,
          type: delegatingTask.progressStatus === 'paused' ? 'Reassigned While Paused' : 'Reassigned Unfinished',
          note: delegateNote.trim() || delegatingTask.pauseReason || 'Reassigned before completion',
          reassignedBy: currentUser.name,
          timestamp: nowIso
        });
      }
    }

    const extraNote = delegateNote.trim()
      ? `\n\n[Handover Note from ${currentUser.name}: ${delegateNote.trim()}]`
      : '';
    const updatedDescription = `${delegatingTask.description || ''}${extraNote}`.trim();

    if (targetColleagues.length === 1) {
      const target = targetColleagues[0];
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', delegatingTask.id), {
        assigneeId: target.id,
        assigneeName: target.name,
        assigneeRole: target.role,
        description: updatedDescription,
        progressStatus: 'not_started',
        startedAt: null,
        pausedAt: null,
        pauseReason: '',
        handoverFromId: previousWorkerId,
        handoverFromName: previousWorker,
        handoverNote: delegateNote.trim() || delegatingTask.handoverNote || '',
        handoverHistory: updatedHandoverHistory,
        delegatedByName: currentUser.name,
        delegatedAt: nowIso
      });
      await sendNotification(target.id, null, 'Task Assigned to You', `${currentUser.name} assigned "${delegatingTask.title}" to you.`);
    } else {
      const tasksRef = collection(db, 'artifacts', appId, 'public', 'data', 'tasks');
      for (const target of targetColleagues) {
        await addDoc(tasksRef, {
          title: delegatingTask.title,
          description: updatedDescription,
          priority: delegatingTask.priority || 'standard',
          progressStatus: 'not_started',
          startedAt: null,
          pausedAt: null,
          pauseReason: '',
          pauseHistory: delegatingTask.pauseHistory || [],
          handoverFromId: previousWorkerId,
          handoverFromName: previousWorker,
          handoverNote: delegateNote.trim() || delegatingTask.handoverNote || '',
          handoverHistory: updatedHandoverHistory,
          assigneeId: target.id,
          assigneeName: target.name,
          assigneeRole: target.role,
          createdById: delegatingTask.createdById || currentUser.id,
          createdByName: delegatingTask.createdByName || 'Manager',
          delegatedByName: currentUser.name,
          delegatedAt: nowIso,
          managerPhoto: delegatingTask.managerPhoto || null,
          completionPhoto: null,
          completionNote: '',
          comments: delegatingTask.comments || [],
          status: 'active',
          createdAt: nowIso,
          completedAt: null,
          validatedAt: null
        });
        await sendNotification(target.id, null, 'Task Assigned to You', `${currentUser.name} assigned "${delegatingTask.title}" to you.`);
      }
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', delegatingTask.id));
    }

    setDelegatingTask(null);
    setDelegateTargetIds([]);
    setDelegateNote('');
    showToast("Task Reassigned", `Assigned to ${targetColleagues.map((u) => u.name).join(', ')}.`);
  };

  const handleQuickReassign = async (task, newAssigneeId) => {
    if (!newAssigneeId || newAssigneeId === task.assigneeId) return;
    const newAssignee = teamUsers.find((u) => u.id === newAssigneeId);
    if (!newAssignee) return;

    const nowIso = new Date().toISOString();
    const wasStarted =
      task.progressStatus === 'in_progress' ||
      task.progressStatus === 'paused' ||
      task.progressStatus === 'incomplete';
    const previousWorkerId = wasStarted ? task.handoverFromId || task.assigneeId : task.handoverFromId || null;
    const previousWorker = wasStarted ? task.handoverFromName || task.assigneeName : task.handoverFromName || null;

    let updatedHandoverHistory = [...(task.handoverHistory || [])];
    if (wasStarted) {
      const alreadyFlaggedIncomplete = task.progressStatus === 'incomplete' && updatedHandoverHistory.length > 0;
      if (alreadyFlaggedIncomplete) {
        const lastIdx = updatedHandoverHistory.length - 1;
        updatedHandoverHistory[lastIdx] = {
          ...updatedHandoverHistory[lastIdx],
          toUserName: newAssignee.name,
          reassignedBy: currentUser.name,
          reassignedAt: nowIso
        };
      } else {
        updatedHandoverHistory.push({
          id: Date.now().toString(),
          fromUserId: task.assigneeId,
          fromUserName: task.assigneeName,
          toUserName: newAssignee.name,
          type: task.progressStatus === 'paused' ? 'Reassigned While Paused' : 'Reassigned Unfinished',
          note: task.handoverNote || task.pauseReason || 'Reassigned to another colleague before completion',
          reassignedBy: currentUser.name,
          timestamp: nowIso
        });
      }
    }

    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', task.id), {
      assigneeId: newAssignee.id,
      assigneeName: newAssignee.name,
      assigneeRole: newAssignee.role,
      progressStatus: 'not_started',
      pausedAt: null,
      pauseReason: '',
      handoverFromId: previousWorkerId,
      handoverFromName: previousWorker,
      handoverHistory: updatedHandoverHistory,
      delegatedByName: currentUser.name,
      delegatedAt: nowIso
    });

    await sendNotification(newAssignee.id, null, 'Task Reassigned to You', `${currentUser.name} reassigned "${task.title}" to your list.`);
    showToast("Task Reassigned", `Moved "${task.title}" to ${newAssignee.name}.`);
  };

  const handleDeleteTask = async (task) => {
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', task.id));
    showToast("Task Deleted", `Removed "${task.title}".`);
  };

  const handleConfirmCompletion = async (e) => {
    e.preventDefault();
    if (!completingTask) return;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', completingTask.id), {
      status: 'pending_validation',
      completionNote: completionNote.trim(),
      completionPhoto: completionPhoto || null,
      completedAt: new Date().toISOString()
    });
    await sendNotification(null, 'supervisors', 'Task Ready for Validation', `${currentUser.name} completed "${completingTask.title}".`);
    setCompletingTask(null);
    setCompletionNote('');
    setCompletionPhoto(null);
    showToast("Sent for Validation", "Supervisors have been alerted.");
  };

  const handleValidateTask = async (task) => {
    const nowIso = new Date().toISOString();
    const isDirect = task.status === 'active';
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', task.id), {
      status: 'archived',
      completedAt: task.completedAt || nowIso,
      completionNote: task.completionNote || (isDirect ? `Validated directly by ${currentUser.name}` : ''),
      validatedByName: currentUser.name,
      validatedAt: nowIso
    });
    await sendNotification(task.assigneeId, null, 'Task Validated & Cleared', `${currentUser.name} validated "${task.title}".`);
    showToast("Task Validated", `"${task.title}" archived.`);
  };

  const handleReturnTask = async (task) => {
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', task.id), {
      status: 'active',
      progressStatus: 'in_progress',
      completedAt: null
    });
    await sendNotification(task.assigneeId, null, 'Revision Requested', `${currentUser.name} sent "${task.title}" back to your active list.`);
    showToast("Returned to Colleague", "Task moved back to active status.");
  };

  const handleAddComment = async (task) => {
    const text = (commentInputs[task.id] || '').trim();
    if (!text) return;
    const updatedComments = [
      ...(task.comments || []),
      { id: Date.now().toString(), authorName: currentUser.name, authorRole: currentUser.role, text, createdAt: new Date().toISOString() }
    ];
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', task.id), { comments: updatedComments });
    setCommentInputs((prev) => ({ ...prev, [task.id]: '' }));
    if (currentUser.id !== task.assigneeId) {
      await sendNotification(task.assigneeId, null, 'New Task Comment', `${currentUser.name} commented on "${task.title}".`);
    } else {
      await sendNotification(null, 'supervisors', 'New Colleague Comment', `${currentUser.name} commented on "${task.title}".`);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!reqNote.trim()) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'requests'), {
      requesterId: currentUser.id,
      requesterName: currentUser.name,
      type: reqType,
      dates: reqDates.trim(),
      note: reqNote.trim(),
      status: 'pending',
      managerReply: '',
      reviewedBy: null,
      createdAt: new Date().toISOString()
    });
    await sendNotification(null, 'supervisors', 'New Manager Request', `${currentUser.name} submitted a ${reqType} request.`);
    setReqDates('');
    setReqNote('');
    showToast("Request Sent", "Your request has been sent to management.");
  };

  const handleDecisionRequest = async (req, newStatus) => {
    const reply = (managerReplyInputs[req.id] || '').trim();
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'requests', req.id), {
      status: newStatus,
      managerReply: reply,
      reviewedBy: currentUser.name,
      reviewedAt: new Date().toISOString()
    });
    await sendNotification(req.requesterId, null, `Request ${newStatus === 'approved' ? 'Approved' : 'Declined'}`, `${currentUser.name} ${newStatus} your ${req.type} request.`);
    showToast("Request Updated", `Marked as ${newStatus}.`);
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserPin.trim()) return;
    const newId = `user-${Date.now()}`;
    const randomColor = AVATAR_COLORS[teamUsers.length % AVATAR_COLORS.length];
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', newId), {
      id: newId,
      name: newUserName.trim(),
      role: newUserRole,
      pin: newUserPin.trim(),
      color: randomColor,
      fcmTokens: []
    });
    setNewUserName('');
    setNewUserPin('1234');
    showToast("Team Member Added", `${newUserName.trim()} can now log in.`);
  };

  const handleDeleteUser = async (u) => {
    if (u.id === currentUser.id) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', u.id));
    showToast("User Removed", `${u.name} has been removed.`);
  };

  const handleClearArchive = async () => {
    const archived = tasks.filter((t) => t.status === 'archived');
    for (const t of archived) {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', t.id));
    }
    showToast("Archive Cleared", "All archived tasks removed.");
  };

  const markNotifRead = async (notif) => {
    if (!currentUser) return;
    if (!(notif.readBy || []).includes(currentUser.id)) {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'notifications', notif.id), {
        readBy: arrayUnion(currentUser.id)
      });
    }
  };

  const handleDismissNotification = async (e, notif) => {
    e.stopPropagation();
    if (!currentUser) return;
    const notifDoc = doc(db, 'artifacts', appId, 'public', 'data', 'notifications', notif.id);
    if (notif.targetUserId === currentUser.id) {
      await deleteDoc(notifDoc);
    } else {
      await updateDoc(notifDoc, { clearedBy: arrayUnion(currentUser.id), readBy: arrayUnion(currentUser.id) });
    }
  };

  const handleClearAllNotifications = async () => {
    if (!currentUser || myNotifications.length === 0) return;
    for (const notif of myNotifications) {
      const notifDoc = doc(db, 'artifacts', appId, 'public', 'data', 'notifications', notif.id);
      if (notif.targetUserId === currentUser.id) {
        await deleteDoc(notifDoc);
      } else {
        await updateDoc(notifDoc, { clearedBy: arrayUnion(currentUser.id), readBy: arrayUnion(currentUser.id) });
      }
    }
    showToast("Notifications Cleared", "Your notification list has been cleared.");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <span className="text-sm font-medium">Loading TaskFlow Pro...</span>
      </div>
    );
  }

  // ==========================================
  // LOGIN PORTAL SCREEN
  // ==========================================
  if (!currentUser) {
    const managers = teamUsers.filter((u) => u.role === 'manager');
    const teamLeaders = teamUsers.filter((u) => u.role === 'team_leader');
    const colleagues = teamUsers.filter((u) => u.role === 'colleague');

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white/10 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl text-white space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg">
              <Layers className="w-7 h-7 text-white"/>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">TaskFlow Team Portal</h1>
            <p className="text-xs text-indigo-200">Select your name below to log into your private workspace</p>
          </div>

          {loginTarget && (
            <div className="bg-slate-900/95 border border-indigo-500/40 p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl ${loginTarget.color || 'bg-indigo-600'} flex items-center justify-center font-bold`}>
                    {loginTarget.name[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Log in as {loginTarget.name}</h3>
                    <p className="text-xs text-indigo-300 capitalize">{loginTarget.role.replace('_', ' ')}</p>
                  </div>
                </div>
                <button onClick={() => { setLoginTarget(null); setLoginError(''); }} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5"/>
                </button>
              </div>
              <form onSubmit={handleLoginSubmit} className="space-y-3">
                <input
                  type="password"
                  autoFocus
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Enter PIN (••••)"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {loginError && <p className="text-xs text-rose-400 font-medium">{loginError}</p>}
                <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold text-sm">
                  Unlock & Stay Signed In
                </button>
              </form>
            </div>
          )}

          <div className="space-y-5">
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-300 block">Manager</span>
              {managers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => { setLoginTarget(u); setPinInput(''); setLoginError(''); }}
                  className="w-full p-3.5 rounded-2xl bg-indigo-600/80 hover:bg-indigo-600 border border-indigo-400/30 transition-all flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-white"/>
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-sm">{u.name}</h3>
                      <p className="text-[11px] text-indigo-200">Full Store Oversight, Validation & User Admin</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-indigo-200"/>
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-300 block">Team Leaders ({teamLeaders.length})</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {teamLeaders.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => { setLoginTarget(u); setPinInput(''); setLoginError(''); }}
                    className="p-3 rounded-xl bg-violet-600/30 hover:bg-violet-600/50 border border-violet-400/30 transition-all text-left flex items-center justify-between">
                    <div className="flex items-center space-x-2.5 truncate">
                      <div className={`w-8 h-8 rounded-lg ${u.color || 'bg-violet-600'} text-white font-bold flex items-center justify-center text-xs`}>
                        {u.name[0]}
                      </div>
                      <div className="truncate">
                        <h4 className="font-bold text-xs truncate">{u.name}</h4>
                        <p className="text-[10px] text-indigo-200">Supervisor & Task Recipient</p>
                      </div>
                    </div>
                    <Lock className="w-3.5 h-3.5 text-indigo-300 shrink-0"/>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-300 block">Colleagues ({colleagues.length})</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {colleagues.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => { setLoginTarget(u); setPinInput(''); setLoginError(''); }}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-left flex items-center space-x-2.5">
                    <div className={`w-8 h-8 rounded-lg ${u.color || 'bg-blue-600'} text-white font-bold flex items-center justify-center text-xs shrink-0`}>
                      {u.name[0]}
                    </div>
                    <div className="truncate">
                      <h4 className="font-bold text-xs truncate">{u.name}</h4>
                      <p className="text-[10px] text-slate-400">Colleague</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // PERMISSIONS & FILTERED TASK BUCKETS
  // ==========================================
  const isManager = currentUser.role === 'manager';
  const assignableUsers = teamUsers.filter((u) => {
    if (isManager) return u.role === 'team_leader' || u.role === 'colleague';
    if (currentUser.role === 'team_leader') return u.role === 'colleague';
    return false;
  });

  const colleaguesOnly = teamUsers.filter((u) => u.role === 'colleague');
  const teamLeadersOnly = teamUsers.filter((u) => u.role === 'team_leader');

  const myAssignedTasks = sortTasksByPriorityAndDate(
    tasks.filter((t) => t.assigneeId === currentUser.id && t.status === 'active')
  );
  const myPendingTasks = tasks.filter((t) => t.assigneeId === currentUser.id && t.status === 'pending_validation');
  const myArchivedTasks = tasks.filter((t) => t.assigneeId === currentUser.id && t.status === 'archived');

  const allActiveTasks = sortTasksByPriorityAndDate(tasks.filter((t) => t.status === 'active'));
  const pausedOrHandoverTasks = allActiveTasks.filter(
    (t) => t.progressStatus === 'paused' || t.progressStatus === 'incomplete'
  );
  const inProgressTasks = allActiveTasks.filter((t) => t.progressStatus === 'in_progress');
  const allocatedNotStartedTasks = allActiveTasks.filter(
    (t) => !t.progressStatus || t.progressStatus === 'not_started'
  );
  const allPendingTasks = tasks.filter((t) => t.status === 'pending_validation');
  const allArchivedTasks = tasks.filter((t) => t.status === 'archived');
  const pendingRequestsCount = requests.filter((r) => r.status === 'pending').length;

  // ==========================================
  // PERFORMANCE & HANDOVER REVIEW ANALYTICS (MANAGER ONLY)
  // ==========================================
  const wasTaskHandedOver = (t) =>
    (Array.isArray(t.handoverHistory) && t.handoverHistory.length > 0) ||
    Boolean(t.handoverFromName) ||
    t.progressStatus === 'incomplete';

  const didUserHandOverTask = (t, user) => {
    if (Array.isArray(t.handoverHistory) && t.handoverHistory.length > 0) {
      return t.handoverHistory.some(
        (h) => h.fromUserId === user.id || h.fromUserName === user.name
      );
    }
    if (t.handoverFromId === user.id || t.handoverFromName === user.name) return true;
    if (t.progressStatus === 'incomplete' && t.assigneeId === user.id) return true;
    return false;
  };

  const reviewStaffList = teamUsers.filter((u) => u.role === 'colleague' || u.role === 'team_leader');

  const staffPerformanceMetrics = reviewStaffList.map((u) => {
    // Completed First-Time: Finished/Validated by this user AND never handed over by them
    // Routine pauses (breaks/checkouts) where the user resumed and completed it still count 100% here!
    const completedFirstTime = tasks.filter(
      (t) =>
        (t.status === 'archived' || t.status === 'pending_validation') &&
        t.assigneeId === u.id &&
        !t.handoverFromName &&
        (!Array.isArray(t.handoverHistory) || t.handoverHistory.length === 0)
    ).length;

    // Handed Over Completed by This User (Stepped in to finish someone else's incomplete job)
    constrescuedHandovers = tasks.filter(
      (t) =>
        (t.status === 'archived' || t.status === 'pending_validation') &&
        t.assigneeId === u.id &&
        (Boolean(t.handoverFromName) || (Array.isArray(t.handoverHistory) && t.handoverHistory.length > 0)) &&
        !didUserHandOverTask(t, u)
    ).length;

    // Handed Over / Left Incomplete by This User
    const handedOverCount = tasks.filter((t) => didUserHandOverTask(t, u)).length;

    // Currently Uncompleted on Their Active List Right Now
    const currentlyUncompleted = tasks.filter(
      (t) => t.status === 'active' && t.assigneeId === u.id
    ).length;

    return {
      user: u,
      completedFirstTime,
      rescuedHandovers: thescuedHandovers(tasks, u, didUserHandOverTask),
      handedOverCount,
      currentlyUncompleted
    };
  });

  function thescuedHandovers(taskList, u, checkHandoverFn) {
    return taskList.filter(
      (t) =>
        (t.status === 'archived' || t.status === 'pending_validation') &&
        t.assigneeId === u.id &&
        (Boolean(t.handoverFromName) || (Array.isArray(t.handoverHistory) && t.handoverHistory.length > 0)) &&
        !checkHandoverFn(t, u)
    ).length;
  }

  // Tasks matching the Performance Review Table filter
  const performanceReviewTasks = tasks.filter((t) => {
    const isUncompletedActive = t.status === 'active';
    const hasHandoverRecord = wasTaskHandedOver(t);

    if (!isUncompletedActive && !hasHandoverRecord) return false;

    if (perfFilterView === 'handovers_only' && !hasHandoverRecord) return false;
    if (perfFilterView === 'uncompleted_only' && !isUncompletedActive) return false;

    if (perfFilterUserId !== 'all') {
      const targetUser = teamUsers.find((u) => u.id === perfFilterUserId);
      if (!targetUser) return false;
      const isCurrentAssignee = t.assigneeId === targetUser.id;
      const handedItOver = didUserHandOverTask(t, targetUser);
      return isCurrentAssignee || handedItOver;
    }

    return true;
  });

  const handleCopyPerformanceSummary = () => {
    const selectedUserObj =
      perfFilterUserId === 'all' ? null : teamUsers.find((u) => u.id === perfFilterUserId);
    const headerTitle = selectedUserObj
      ? `PERFORMANCE & HANDOVER REVIEW — ${selectedUserObj.name.toUpperCase()}`
      : `TEAM PERFORMANCE & UNCOMPLETED/HANDOVER SUMMARY`;

    const lines = [
      headerTitle,
      `Generated: ${new Date().toLocaleString()}`,
      `--------------------------------------------------`
    ];

    const metricsToExport = selectedUserObj
      ? staffPerformanceMetrics.filter((m) => m.user.id === selectedUserObj.id)
      : staffPerformanceMetrics;

    metricsToExport.forEach((m) => {
      lines.push(
        `${m.user.name}: Completed First-Time: ${m.completedFirstTime} | Handed Over / Left Unfinished: ${m.handedOverCount} | Finished Others' Handovers: ${m.rescuedHandovers} | Currently Unfinished: ${m.currentlyUncompleted}`
      );
    });

    lines.push(`--------------------------------------------------`);
    lines.push(`DETAILED UNCOMPLETED & HANDED-OVER LOG (${performanceReviewTasks.length} Items):`);

    performanceReviewTasks.forEach((t, idx) => {
      const createdDate = t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'N/A';
      const statusLabel =
        t.status === 'archived'
          ? `Completed/Validated (Finished by ${t.assigneeName})`
          : t.status === 'pending_validation'
          ? `Awaiting Validation (Submitted by ${t.assigneeName})`
          : t.progressStatus === 'incomplete'
          ? `Flagged Incomplete by ${t.assigneeName}`
          : t.progressStatus === 'paused'
          ? `Currently Paused (${t.pauseReason || 'No reason'}) — Assigned to ${t.assigneeName}`
          : t.progressStatus === 'in_progress'
          ? `Currently In Progress — Assigned to ${t.assigneeName}`
          : `Not Started — Assigned to ${t.assigneeName}`;

      const handoverSummary =
        Array.isArray(t.handoverHistory) && t.handoverHistory.length > 0
          ? t.handoverHistory
              .map(
                (h) =>
                  `${h.fromUserName} (${h.type}: "${h.note || 'No note'}" on ${new Date(h.timestamp).toLocaleString()})`
              )
              .join(' -> ')
          : t.handoverFromName
          ? `Handed over from ${t.handoverFromName} (Note: "${t.handoverNote || 'None'}")`
          : 'No handover (Currently open)';

      lines.push(`${idx + 1}. [${createdDate}] ${t.title} — ${statusLabel}`);
      lines.push(`   Handover Trail: ${handoverSummary}`);
    });

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(lines.join('\n'));
      showToast("Summary Copied", "Performance & handover report copied to clipboard.");
    } else {
      showToast("Copy Note", "Clipboard access unavailable in this browser.");
    }
  };

  const renderSupervisorTaskCard = (t) => {
    const isUrgent = t.priority === 'urgent';
    const isInProgress = t.progressStatus === 'in_progress';
    const isPaused = t.progressStatus === 'paused';
    const isIncomplete = t.progressStatus === 'incomplete';

    return (
      <div
        key={t.id}
        className={`bg-white p-4 rounded-xl border text-xs space-y-3 shadow-xs ${
          isIncomplete
            ? 'border-orange-400 bg-orange-50/20'
            : isUrgent
            ? 'border-rose-300 bg-rose-50/10'
            : 'border-slate-200'
        }`}>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="px-2 py-0.5 bg-slate-900 text-white rounded text-[11px] font-bold">
                {t.assigneeName}
              </span>
              {isUrgent && (
                <span className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold uppercase flex items-center space-x-1">
                  <Flame className="w-2.5 h-2.5"/>
                  <span>Priority</span>
                </span>
              )}
              {isInProgress && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-bold">
                  Working On It {t.startedAt ? `(${new Date(t.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` : ''}
                </span>
              )}
              {isPaused && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded text-[10px] font-bold">
                  Paused: {t.pauseReason || 'Interrupted'}
                </span>
              )}
              {isIncomplete && (
                <span className="px-2 py-0.5 bg-orange-600 text-white rounded text-[10px] font-bold">
                  Incomplete / Handover Needed
                </span>
              )}
              {!isInProgress && !isPaused && !isIncomplete && (
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold">
                  Allocated (Not Started)
                </span>
              )}
              {t.handoverFromName && (
                <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded text-[10px] font-semibold">
                  Started by {t.handoverFromName}
                </span>
              )}
            </div>
            <h4 className="font-bold text-slate-900 text-sm pt-0.5">{t.title}</h4>
            <p className="text-slate-600 text-xs whitespace-pre-line">{t.description}</p>
            {t.handoverNote && (
              <p className="text-xs text-orange-900 bg-orange-100/70 px-2.5 py-1.5 rounded-lg border border-orange-200 font-medium">
                Handover Note: "{t.handoverNote}"
              </p>
            )}
          </div>
          <button
            onClick={() => handleDeleteTask(t)}
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50">
            <Trash2 className="w-4 h-4"/>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] font-semibold text-slate-500">Reassign:</span>
            <select
              value={t.assigneeId}
              onChange={(e) => handleQuickReassign(t, e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-800 font-medium">
              {assignableUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            <button
              onClick={() => {
                setDelegatingTask(t);
                setDelegateTargetIds([]);
                setDelegateNote(t.handoverNote || '');
              }}
              className="px-2.5 py-1 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-lg text-[11px] font-semibold">
              + Handover Note
            </button>
          </div>
          <button
            onClick={() => handleValidateTask(t)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs flex items-center space-x-1">
            <Check className="w-3.5 h-3.5"/>
            <span>Validate Directly</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center space-x-3 border border-slate-800">
            <Sparkles className="w-5 h-5 text-indigo-400"/>
            <div>
              <h4 className="text-xs font-semibold">{toast.title}</h4>
              <p className="text-xs text-slate-300">{toast.message}</p>
            </div>
          </div>
        </div>
      )}

      {lightboxImage && (
        <div
          onClick={() => { setLightboxImage(null); setLightboxTitle(''); }}
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 cursor-pointer">
          {lightboxTitle && (
            <div className="mb-4 px-4 py-1.5 rounded-full bg-white text-slate-900 font-bold text-sm">
              {lightboxTitle} — Point Terminal Scanner Here
            </div>
          )}
          <div className="bg-white p-4 rounded-3xl shadow-2xl">
            <img src={lightboxImage} alt="Enlarged" className="max-w-full max-h-[80vh] rounded-xl" />
          </div>
          <p className="text-xs text-slate-300 mt-4">Tap anywhere to close</p>
        </div>
      )}

      {/* Change PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">Change My Login PIN</h3>
              <button onClick={() => setShowPinModal(false)}><X className="w-5 h-5 text-slate-400"/></button>
            </div>
            <form onSubmit={handleSelfPinChange} className="space-y-4">
              <input
                type="text"
                required
                value={selfNewPin}
                onChange={(e) => setSelfNewPin(e.target.value)}
                placeholder="Enter new PIN"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setShowPinModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold">Save PIN</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pause Task Modal */}
      {pausingTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">Pause Task</h3>
              <button onClick={() => setPausingTask(null)}><X className="w-5 h-5 text-slate-400"/></button>
            </div>
            <form onSubmit={handleConfirmPauseTask} className="space-y-4">
              <div className="grid grid-cols-1 gap-1.5">
                {[...PAUSE_REASONS, 'Custom'].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setPauseReason(reason)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold ${
                      pauseReason === reason ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-50 text-slate-700'
                    }`}>
                    {reason}
                  </button>
                ))}
              </div>
              {pauseReason === 'Custom' && (
                <input
                  type="text"
                  required
                  value={customPauseReason}
                  onChange={(e) => setCustomPauseReason(e.target.value)}
                  placeholder="Enter reason..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                />
              )}
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setPausingTask(null)} className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-amber-500 text-white text-xs font-semibold">Confirm Pause</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Incomplete Handover Modal */}
      {handoverTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">Flag Incomplete / Shift Handover</h3>
              <button onClick={() => setHandoverTask(null)}><X className="w-5 h-5 text-slate-400"/></button>
            </div>
            <form onSubmit={handleConfirmIncompleteHandover} className="space-y-4">
              <textarea
                rows="3"
                required
                value={handoverNote}
                onChange={(e) => setHandoverNote(e.target.value)}
                placeholder="What is left to finish? (e.g. 2 cages left by bay 4)"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
              />
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setHandoverTask(null)} className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-orange-600 text-white text-xs font-semibold">Send Handover Alert</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supervisor Reassign Modal */}
      {delegatingTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">Reassign / Handover Task</h3>
              <button onClick={() => setDelegatingTask(null)}><X className="w-5 h-5 text-slate-400"/></button>
            </div>
            <form onSubmit={handleConfirmDelegation} className="space-y-4">
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1">
                {colleaguesOnly.map((col) => (
                  <label key={col.id} className="flex items-center space-x-2.5 p-2 rounded-lg cursor-pointer text-xs hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={delegateTargetIds.includes(col.id)}
                      onChange={() => toggleDelegateTarget(col.id)}
                    />
                    <span className="font-semibold">{col.name}</span>
                  </label>
                ))}
              </div>
              <input
                type="text"
                value={delegateNote}
                onChange={(e) => setDelegateNote(e.target.value)}
                placeholder="Optional handover instructions..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
              />
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setDelegatingTask(null)} className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold">Reassign Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Completion Modal */}
      {completingTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">Complete Task & Attach Proof</h3>
              <button onClick={() => setCompletingTask(null)}><X className="w-5 h-5 text-slate-400"/></button>
            </div>
            <form onSubmit={handleConfirmCompletion} className="space-y-4">
              <textarea
                rows="3"
                required
                value={completionNote}
                onChange={(e) => setCompletionNote(e.target.value)}
                placeholder="Add completion notes..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
              />
              <label className="flex items-center justify-center space-x-2 w-full py-3 px-4 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer">
                <Camera className="w-5 h-5 text-indigo-600"/>
                <span className="text-xs font-semibold">{completionPhoto ? 'Change Photo' : 'Take or Upload Photo'}</span>
                <input type="file" accept="image/*" capture="environment" onChange={(e) => handlePhotoUpload(e, setCompletionPhoto)} className="hidden"/>
              </label>
              {completionPhoto && <img src={completionPhoto} alt="Preview" className="h-32 w-full object-cover rounded-xl"/>}
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setCompletingTask(null)} className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold">Submit for Validation</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Top Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md">
              <Layers className="w-5 h-5"/>
            </div>
            <div>
              <h1 className="font-bold text-base text-slate-900 leading-tight">TaskFlow Pro</h1>
              <p className="text-[11px] text-slate-500 font-medium capitalize">
                {currentUser.name} • {currentUser.role.replace('_', ' ')}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleEnableLockScreenAlerts}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 ${
                fcmEnabled ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-100 text-amber-900'
              }`}>
              <BellRing className="w-3.5 h-3.5"/>
              <span className="hidden md:inline">{fcmEnabled ? 'Lock Push Active' : 'Enable Lock Alerts'}</span>
            </button>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 ${
                soundEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
              }`}>
              {soundEnabled ? <Volume2 className="w-4 h-4"/> : <VolumeX className="w-4 h-4"/>}
            </button>

            <button
              onClick={() => { setSelfNewPin(currentUser.pin || '1234'); setShowPinModal(true); }}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold flex items-center space-x-1">
              <Lock className="w-3.5 h-3.5 text-indigo-600"/>
              <span className="hidden sm:inline">PIN</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="p-2 rounded-xl bg-slate-100 text-slate-700 relative">
                <Bell className="w-5 h-5"/>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="font-bold text-xs">Notifications ({myNotifications.length})</span>
                    {myNotifications.length > 0 && (
                      <button onClick={handleClearAllNotifications} className="text-[11px] text-rose-600 font-semibold">
                        Clear All
                      </button>
                    )}
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {myNotifications.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-3">No notifications.</p>
                    ) : (
                      myNotifications.slice(0, 15).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markNotifRead(n)}
                          className="p-2.5 rounded-xl border bg-slate-50 text-xs flex items-start justify-between gap-2">
                          <div>
                            <p className="font-bold text-slate-800">{n.title}</p>
                            <p className="text-[11px] text-slate-600">{n.message}</p>
                          </div>
                          <button onClick={(e) => handleDismissNotification(e, n)} className="text-slate-400 hover:text-rose-600">
                            <X className="w-3.5 h-3.5"/>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button onClick={handleLogout} className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 text-xs font-semibold flex items-center space-x-1">
              <LogOut className="w-3.5 h-3.5"/>
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-2 border-t border-slate-100 py-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 ${
              activeTab === 'tasks' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}>
            {isSupervisor ? 'Team Task Board & Validation' : 'My Assigned Tasks'}
          </button>

          {currentUser.role === 'team_leader' && (
            <button
              onClick={() => setActiveTab('my_tl_tasks')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shrink-0 ${
                activeTab === 'my_tl_tasks' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}>
              <span>Tasks From Manager ({myAssignedTasks.length})</span>
            </button>
          )}

          {isManager && (
            <button
              onClick={() => setActiveTab('performance')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shrink-0 ${
                activeTab === 'performance' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}>
              <BarChart3 className="w-3.5 h-3.5"/>
              <span>Performance & Handover Review</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('requests')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shrink-0 ${
              activeTab === 'requests' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}>
            <Calendar className="w-3.5 h-3.5"/>
            <span>{isSupervisor ? `Colleague Requests (${pendingRequestsCount})` : 'Manager Requests'}</span>
          </button>

          {isManager && (
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shrink-0 ${
                activeTab === 'users' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}>
              <UserPlus className="w-3.5 h-3.5"/>
              <span>Manage Team ({teamUsers.length})</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* ================= SUPERVISOR DASHBOARD WITH 4 COLLAPSIBLE STATUS CARDS ================= */}
        {activeTab === 'tasks' && isSupervisor && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Assign New Task Form */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 h-fit space-y-5 shadow-xs">
              <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Plus className="w-4 h-4"/>
                </div>
                <h2 className="font-bold text-slate-800 text-base">Assign New Task</h2>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-600 uppercase">Quick Task Preset</label>
                  <select
                    value={selectedPreset}
                    onChange={(e) => handleSelectPreset(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 font-medium">
                    {TASK_PRESETS.map((preset) => (
                      <option key={preset.id} value={preset.id}>{preset.label}</option>
                    ))}
                  </select>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {TASK_PRESETS.filter((p) => p.id !== 'custom').map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                          selectedPreset === preset.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-indigo-50'
                        }`}>
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Priority Level</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTaskPriority('standard')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center space-x-1.5 ${
                        taskPriority === 'standard' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                      <Clock className="w-3.5 h-3.5"/>
                      <span>Standard</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaskPriority('urgent')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center space-x-1.5 ${
                        taskPriority === 'urgent' ? 'bg-rose-600 text-white border-rose-600' : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                      <Flame className="w-3.5 h-3.5"/>
                      <span>Priority / First Job</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Task Title</label>
                  <input
                    type="text"
                    required
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="e.g. Drop Tops - Aisles 4 to 6"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Standard Expectations</label>
                  <textarea
                    rows="4"
                    required
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    placeholder="Task expectations..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-600 uppercase">
                      Assign To ({taskAssigneeIds.length} Selected)
                    </label>
                    <button type="button" onClick={() => setTaskAssigneeIds([])} className="text-[11px] font-semibold text-slate-400">
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setTaskAssigneeIds(colleaguesOnly.map((c) => c.id))}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold">
                      All Colleagues ({colleaguesOnly.length})
                    </button>
                    {isManager && (
                      <button
                        type="button"
                        onClick={() => setTaskAssigneeIds(teamLeadersOnly.map((tl) => tl.id))}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold">
                        All Team Leaders ({teamLeadersOnly.length})
                      </button>
                    )}
                  </div>
                  <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1 bg-slate-50/50">
                    {assignableUsers.map((m) => (
                      <label
                        key={m.id}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs ${
                          taskAssigneeIds.includes(m.id) ? 'bg-indigo-50 font-semibold text-indigo-900' : 'text-slate-700'
                        }`}>
                        <div className="flex items-center space-x-2.5">
                          <input
                            type="checkbox"
                            checked={taskAssigneeIds.includes(m.id)}
                            onChange={() => toggleTaskAssignee(m.id)}
                          />
                          <span>{m.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 capitalize">{m.role.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="flex items-center justify-center space-x-2 w-full py-2.5 px-3 border border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50">
                    <Camera className="w-4 h-4 text-indigo-600"/>
                    <span className="text-xs font-medium text-slate-600">
                      {taskPhoto ? 'Reference Photo Attached' : 'Attach Reference Photo (Optional)'}
                    </span>
                    <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, setTaskPhoto)} className="hidden"/>
                  </label>
                </div>

                <button
                  type="submit"
                  className={`w-full py-3 px-4 text-white font-semibold rounded-xl text-sm shadow-md flex items-center justify-center space-x-2 ${
                    taskPriority === 'urgent' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}>
                  <Plus className="w-4 h-4"/>
                  <span>Drop Task onto List</span>
                </button>
              </form>
            </div>

            {/* Right 2 Columns: 4 Collapsible Accordion Cards */}
            <div className="lg:col-span-2 space-y-4">
              {/* 1. COLLAPSIBLE CARD: WAITING TO BE REASSIGNED / PAUSED */}
              <div className="bg-white rounded-2xl border-2 border-orange-200 overflow-hidden shadow-xs">
                <button
                  type="button"
                  onClick={() => toggleSection('reassigned')}
                  className="w-full p-4 bg-orange-50/80 hover:bg-orange-100/70 flex items-center justify-between text-left transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5"/>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Waiting to be Reassigned / Paused</h3>
                      <p className="text-[11px] text-orange-800">Incomplete shift handovers and paused shop-floor tasks</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded-full bg-orange-200 text-orange-900 font-bold text-xs">
                      {pausedOrHandoverTasks.length}
                    </span>
                    {openSections.reassigned ? <ChevronUp className="w-5 h-5 text-orange-800"/> : <ChevronDown className="w-5 h-5 text-orange-800"/>}
                  </div>
                </button>
                {openSections.reassigned && (
                  <div className="p-4 space-y-3 bg-white">
                    {pausedOrHandoverTasks.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-4">No paused or incomplete tasks right now.</p>
                    ) : (
                      pausedOrHandoverTasks.map((t) => renderSupervisorTaskCard(t))
                    )}
                  </div>
                )}
              </div>

              {/* 2. COLLAPSIBLE CARD: WAITING TO BE VALIDATED */}
              <div className="bg-white rounded-2xl border-2 border-amber-200 overflow-hidden shadow-xs">
                <button
                  type="button"
                  onClick={() => toggleSection('validation')}
                  className="w-full p-4 bg-amber-50/80 hover:bg-amber-100/70 flex items-center justify-between text-left transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                      <Bell className="w-5 h-5"/>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Waiting to be Validated</h3>
                      <p className="text-[11px] text-amber-800">Completed tasks with proof photos ready for sign-off</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded-full bg-amber-200 text-amber-900 font-bold text-xs">
                      {allPendingTasks.length}
                    </span>
                    {openSections.validation ? <ChevronUp className="w-5 h-5 text-amber-800"/> : <ChevronDown className="w-5 h-5 text-amber-800"/>}
                  </div>
                </button>
                {openSections.validation && (
                  <div className="p-4 space-y-4 bg-white">
                    {allPendingTasks.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-4">No tasks waiting for validation.</p>
                    ) : (
                      allPendingTasks.map((t) => (
                        <div key={t.id} className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[11px] font-bold">
                                  Completed by {t.assigneeName}
                                </span>
                                {t.handoverFromName && (
                                  <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded text-[11px] font-semibold">
                                    Started by {t.handoverFromName}
                                  </span>
                                )}
                              </div>
                              <h4 className="font-bold text-slate-900 text-sm mt-1">{t.title}</h4>
                              <p className="text-xs text-slate-600 mt-0.5">Note: "{t.completionNote || 'No note'}"</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleReturnTask(t)}
                                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl text-xs">
                                Send Back
                              </button>
                              <button
                                onClick={() => handleValidateTask(t)}
                                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs flex items-center space-x-1">
                                <Check className="w-4 h-4"/>
                                <span>Validate & Archive</span>
                              </button>
                            </div>
                          </div>
                          {t.completionPhoto && (
                            <img
                              src={t.completionPhoto}
                              alt="Proof"
                              onClick={() => { setLightboxTitle('Completion Proof'); setLightboxImage(t.completionPhoto); }}
                              className="h-28 w-40 object-cover rounded-xl border-2 border-emerald-500 cursor-pointer"
                            />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* 3. COLLAPSIBLE CARD: IN PROGRESS (WORKING ON IT NOW) */}
              <div className="bg-white rounded-2xl border border-blue-200 overflow-hidden shadow-xs">
                <button
                  type="button"
                  onClick={() => toggleSection('inProgress')}
                  className="w-full p-4 bg-blue-50/70 hover:bg-blue-100/60 flex items-center justify-between text-left transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                      <Play className="w-4 h-4 fill-current"/>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">In Progress — Working On It Now</h3>
                      <p className="text-[11px] text-blue-800">Tasks colleagues have actively started on the shop floor</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded-full bg-blue-200 text-blue-900 font-bold text-xs">
                      {inProgressTasks.length}
                    </span>
                    {openSections.inProgress ? <ChevronUp className="w-5 h-5 text-blue-800"/> : <ChevronDown className="w-5 h-5 text-blue-800"/>}
                  </div>
                </button>
                {openSections.inProgress && (
                  <div className="p-4 space-y-3 bg-white">
                    {inProgressTasks.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-4">No tasks currently marked In Progress.</p>
                    ) : (
                      inProgressTasks.map((t) => renderSupervisorTaskCard(t))
                    )}
                  </div>
                )}
              </div>

              {/* 4. COLLAPSIBLE CARD: ALLOCATED TASKS (NOT STARTED YET) */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <button
                  type="button"
                  onClick={() => toggleSection('allocated')}
                  className="w-full p-4 bg-slate-100/80 hover:bg-slate-200/60 flex items-center justify-between text-left transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-700 text-white flex items-center justify-center">
                      <ClipboardList className="w-5 h-5"/>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Allocated Tasks — Not Started Yet</h3>
                      <p className="text-[11px] text-slate-500">Assigned tasks waiting in colleague queues</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-800 font-bold text-xs">
                      {allocatedNotStartedTasks.length}
                    </span>
                    {openSections.allocated ? <ChevronUp className="w-5 h-5 text-slate-600"/> : <ChevronDown className="w-5 h-5 text-slate-600"/>}
                  </div>
                </button>
                {openSections.allocated && (
                  <div className="p-4 space-y-3 bg-white">
                    {allocatedNotStartedTasks.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-4">No unstarted allocated tasks.</p>
                    ) : (
                      allocatedNotStartedTasks.map((t) => renderSupervisorTaskCard(t))
                    )}
                  </div>
                )}
              </div>

              {/* 5. COLLAPSIBLE CARD: VALIDATED & ARCHIVED HISTORY LOG */}
              <div className="bg-white rounded-2xl border border-emerald-200 overflow-hidden shadow-xs">
                <button
                  type="button"
                  onClick={() => toggleSection('archive')}
                  className="w-full p-4 bg-emerald-50/70 hover:bg-emerald-100/60 flex items-center justify-between text-left transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                      <Archive className="w-5 h-5"/>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Validated & Archived History</h3>
                      <p className="text-[11px] text-emerald-800">Completed and signed-off department tasks</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-200 text-emerald-900 font-bold text-xs">
                      {allArchivedTasks.length}
                    </span>
                    {openSections.archive ? <ChevronUp className="w-5 h-5 text-emerald-800"/> : <ChevronDown className="w-5 h-5 text-emerald-800"/>}
                  </div>
                </button>
                {openSections.archive && (
                  <div className="p-4 space-y-3 bg-white">
                    {isManager && allArchivedTasks.length > 0 && (
                      <div className="flex justify-end">
                        <button onClick={handleClearArchive} className="text-xs font-semibold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg">
                          Clear Archive
                        </button>
                      </div>
                    )}
                    {allArchivedTasks.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-4">No archived tasks yet.</p>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {allArchivedTasks.map((t) => (
                          <div key={t.id} className="py-2.5 flex items-center justify-between text-xs">
                            <div>
                              <p className="font-bold text-slate-800">{t.title}</p>
                              <p className="text-slate-500">
                                Completed by {t.assigneeName}
                                {t.handoverFromName ? ` (Started by ${t.handoverFromName})` : ''}
                              </p>
                            </div>
                            <div className="text-right">
                              {t.completionPhoto && (
                                <button
                                  onClick={() => { setLightboxTitle('Proof Photo'); setLightboxImage(t.completionPhoto); }}
                                  className="text-indigo-600 font-semibold underline block">
                                  View Photo
                                </button>
                              )}
                              <span className="text-[11px] text-emerald-600 font-medium">
                                Signed off by {t.validatedByName || 'Manager'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= MANAGER PERFORMANCE & HANDOVER REVIEW TAB ================= */}
        {activeTab === 'performance' && isManager && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                    <BarChart3 className="w-5 h-5"/>
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 text-base">Manager Performance & Handover Review</h2>
                    <p className="text-xs text-slate-500">
                      Tracks uncompleted jobs and shift handovers. Routine pauses (breaks/checkouts) that the colleague resumes and finishes themselves count as Completed First-Time.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCopyPerformanceSummary}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 shrink-0 self-start sm:self-auto">
                  <Copy className="w-4 h-4"/>
                  <span>Copy Review Summary</span>
                </button>
              </div>

              {/* Colleague Scorecards Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Tap a Colleague Card to Filter Their Review Log
                  </span>
                  {perfFilterUserId !== 'all' && (
                    <button
                      onClick={() => setPerfFilterUserId('all')}
                      className="text-xs font-semibold text-indigo-600 hover:underline">
                      Show All Staff
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {staffPerformanceMetrics.map((m) => {
                    const isSelected = perfFilterUserId === m.user.id;
                    return (
                      <button
                        key={m.user.id}
                        type="button"
                        onClick={() => setPerfFilterUserId(isSelected ? 'all' : m.user.id)}
                        className={`p-4 rounded-2xl border text-left transition-all space-y-3 ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                            : 'border-slate-200 bg-slate-50/60 hover:bg-white'
                        }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2.5 truncate">
                            <div className={`w-8 h-8 rounded-lg ${m.user.color || 'bg-indigo-600'} text-white font-bold flex items-center justify-center text-xs shrink-0`}>
                              {m.user.name[0]}
                            </div>
                            <div className="truncate">
                              <h4 className="font-bold text-slate-900 text-xs truncate">{m.user.name}</h4>
                              <p className="text-[10px] text-slate-500 capitalize">{m.user.role.replace('_', ' ')}</p>
                            </div>
                          </div>
                          {m.handedOverCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 font-bold text-[10px]">
                              {m.handedOverCount} Handed Over
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/70 text-center">
                          <div className="bg-emerald-50 rounded-lg p-1.5">
                            <span className="block font-bold text-emerald-700 text-sm">{m.completedFirstTime}</span>
                            <span className="text-[10px] text-emerald-800 font-medium">1st-Time Done</span>
                          </div>
                          <div className="bg-orange-50 rounded-lg p-1.5">
                            <span className="block font-bold text-orange-700 text-sm">{m.handedOverCount}</span>
                            <span className="text-[10px] text-orange-800 font-medium">Handed Over</span>
                          </div>
                          <div className="bg-slate-200/70 rounded-lg p-1.5">
                            <span className="block font-bold text-slate-800 text-sm">{m.currentlyUncompleted}</span>
                            <span className="text-[10px] text-slate-600 font-medium">Open Now</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Filter Bar for Detailed Log */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPerfFilterView('all_issues')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                      perfFilterView === 'all_issues'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}>
                    All Handovers & Uncompleted ({performanceReviewTasks.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPerfFilterView('handovers_only')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                      perfFilterView === 'handovers_only'
                        ? 'bg-orange-600 text-white'
                        : 'bg-orange-50 text-orange-800 hover:bg-orange-100'
                    }`}>
                    Handed-Over Jobs Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setPerfFilterView('uncompleted_only')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                      perfFilterView === 'uncompleted_only'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100'
                    }`}>
                    Currently Uncompleted Only
                  </button>
                </div>

                <select
                  value={perfFilterUserId}
                  onChange={(e) => setPerfFilterUserId(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50">
                  <option value="all">Filter by Staff: Everyone</option>
                  {reviewStaffList.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              {/* Detailed Audit List */}
              <div className="space-y-3">
                {performanceReviewTasks.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2"/>
                    <p className="text-xs font-bold text-slate-700">No handed-over or uncompleted tasks match this filter.</p>
                  </div>
                ) : (
                  performanceReviewTasks.map((t) => {
                    const hasHandover = wasTaskHandedOver(t);
                    const isCompletedNow = t.status === 'archived' || t.status === 'pending_validation';

                    return (
                      <div
                        key={t.id}
                        className={`p-4 rounded-xl border text-xs space-y-3 ${
                          hasHandover
                            ? 'border-orange-300 bg-orange-50/20'
                            : 'border-slate-200 bg-white'
                        }`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {hasHandover && (
                                <span className="px-2 py-0.5 bg-orange-600 text-white rounded text-[10px] font-bold uppercase">
                                  Handed Over
                                </span>
                              )}
                              {isCompletedNow ? (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                                  Eventually Completed by {t.assigneeName}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded text-[10px] font-bold">
                                  Still Unfinished • Assigned to {t.assigneeName} ({(t.progressStatus || 'not_started').replace('_', ' ')})
                                </span>
                              )}
                              <span className="text-[11px] text-slate-400">
                                Assigned {t.createdAt ? new Date(t.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : ''}
                              </span>
                            </div>
                            <h4 className="font-bold text-slate-900 text-sm">{t.title}</h4>
                            <p className="text-slate-600">{t.description}</p>
                          </div>
                        </div>

                        {/* Permanent Handover Audit Trail */}
                        {(Array.isArray(t.handoverHistory) && t.handoverHistory.length > 0) ? (
                          <div className="bg-white/90 rounded-lg p-3 border border-orange-200 space-y-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-800 block">
                              Handover Audit Trail ({t.handoverHistory.length})
                            </span>
                            {t.handoverHistory.map((h, i) => (
                              <div key={h.id || i} className="text-xs border-l-2 border-orange-400 pl-2.5 py-0.5 space-y-0.5">
                                <p className="font-bold text-slate-800">
                                  {h.fromUserName}
                                  {h.toUserName ? ` → Reassigned to ${h.toUserName}` : ' (Flagged Incomplete)'}
                                  <span className="ml-2 text-[10px] font-normal text-slate-500">
                                    {h.timestamp ? new Date(h.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : ''}
                                  </span>
                                </p>
                                <p className="text-orange-900 font-medium">
                                  {h.type}: "{h.note || 'No note provided'}"
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : t.handoverFromName ? (
                          <div className="bg-white/90 rounded-lg p-3 border border-orange-200">
                            <p className="font-bold text-orange-900">
                              Originally started by {t.handoverFromName} → Finished by {t.assigneeName}
                            </p>
                            {t.handoverNote && (
                              <p className="text-orange-800 mt-0.5">Handover Note: "{t.handoverNote}"</p>
                            )}
                          </div>
                        ) : null}

                        {/* Context-Only Routine Pause Log (Does not count as handover) */}
                        {Array.isArray(t.pauseHistory) && t.pauseHistory.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[10px] font-semibold text-slate-400">Routine Pauses (Context Only):</span>
                            {t.pauseHistory.map((p, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]">
                                {p.userName}: {p.reason} ({p.pausedAt ? new Date(p.pausedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''})
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= PERSONAL TASK LIST (COLLEAGUES & TEAM LEADERS) ================= */}
        {((activeTab === 'tasks' && !isSupervisor) || activeTab === 'my_tl_tasks') && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      {currentUser.role === 'team_leader' ? 'Tasks Assigned to Me by Manager' : 'My Active Tasks'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Tap Start Task when you begin, Pause if pulled away, or Handover if you cannot finish before your shift ends.
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold">
                    {myAssignedTasks.length} Active
                  </span>
                </div>

                {myAssignedTasks.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3"/>
                    <h4 className="font-bold text-slate-700 text-sm">All caught up!</h4>
                    <p className="text-xs text-slate-400 mt-1">You have no active tasks on your list right now.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myAssignedTasks.map((t) => {
                      const isUrgent = t.priority === 'urgent';
                      const isInProgress = t.progressStatus === 'in_progress';
                      const isPaused = t.progressStatus === 'paused';
                      const isIncomplete = t.progressStatus === 'incomplete';

                      return (
                        <div
                          key={t.id}
                          className={`p-5 rounded-xl border space-y-4 ${
                            isUrgent ? 'bg-rose-50/30 border-rose-300' : isPaused ? 'bg-amber-50/30 border-amber-300' : 'bg-white border-slate-200'
                          }`}>
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="space-y-1.5">
                              <div className="flex flex-wrap items-center gap-1.5">
                                {isUrgent && (
                                  <span className="px-2.5 py-0.5 bg-rose-600 text-white rounded-md text-[11px] font-bold uppercase">
                                    Priority / First Job
                                  </span>
                                )}
                                {isInProgress && (
                                  <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-md text-[11px] font-bold">
                                    In Progress
                                  </span>
                                )}
                                {isPaused && (
                                  <span className="px-2.5 py-0.5 bg-amber-200 text-amber-900 rounded-md text-[11px] font-bold">
                                    Paused: {t.pauseReason}
                                  </span>
                                )}
                                {!isInProgress && !isPaused && !isIncomplete && (
                                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[11px] font-semibold">
                                    Not Started
                                  </span>
                                )}
                                {t.handoverFromName && (
                                  <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded-md text-[11px] font-semibold">
                                    Handover from {t.handoverFromName}
                                  </span>
                                )}
                              </div>
                              <h4 className="font-bold text-slate-900 text-base">{t.title}</h4>
                              <p className="text-xs text-slate-600 whitespace-pre-line">{t.description}</p>
                              {t.handoverNote && (
                                <p className="text-xs font-medium text-orange-900 bg-orange-50 p-2 rounded-lg border border-orange-200">
                                  Handover Note: "{t.handoverNote}"
                                </p>
                              )}
                            </div>

                            <div className="flex flex-wrap sm:flex-col sm:items-end gap-2 shrink-0">
                              {(!isInProgress || isPaused) && (
                                <button
                                  onClick={() => handleStartOrResumeTask(t)}
                                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs flex items-center space-x-1.5">
                                  <Play className="w-3.5 h-3.5 fill-current"/>
                                  <span>{isPaused ? 'Resume Task' : 'Start Task'}</span>
                                </button>
                              )}
                              {isInProgress && (
                                <button
                                  onClick={() => { setPausingTask(t); setPauseReason(PAUSE_REASONS[0]); setCustomPauseReason(''); }}
                                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl text-xs flex items-center space-x-1.5">
                                  <Pause className="w-3.5 h-3.5"/>
                                  <span>Pause Task</span>
                                </button>
                              )}
                              {(isInProgress || isPaused) && !isIncomplete && (
                                <button
                                  onClick={() => { setHandoverTask(t); setHandoverNote(''); }}
                                  className="px-3.5 py-1.5 bg-orange-50 text-orange-700 border border-orange-200 font-semibold rounded-xl text-xs">
                                  Handover / Incomplete
                                </button>
                              )}
                              <button
                                onClick={() => setCompletingTask(t)}
                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs flex items-center space-x-2">
                                <Camera className="w-4 h-4"/>
                                <span>Complete & Add Photo</span>
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2 pt-3 border-t border-slate-100">
                            {(t.comments || []).map((c) => (
                              <div key={c.id} className="text-xs bg-slate-50 p-2 rounded-lg">
                                <span className="font-bold">{c.authorName}: </span>
                                <span>{c.text}</span>
                              </div>
                            ))}
                            <div className="flex space-x-2">
                              <input
                                type="text"
                                value={commentInputs[t.id] || ''}
                                onChange={(e) => setCommentInputs((prev) => ({ ...prev, [t.id]: e.target.value }))}
                                placeholder="Leave a comment..."
                                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                              />
                              <button onClick={() => handleAddComment(t)} className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold">
                                Send
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-3">
                <h3 className="font-bold text-slate-900 text-sm">Awaiting Validation ({myPendingTasks.length})</h3>
                {myPendingTasks.map((t) => (
                  <div key={t.id} className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs font-bold">
                    {t.title}
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-3">
                <h3 className="font-bold text-slate-900 text-sm">Validated & Completed ({myArchivedTasks.length})</h3>
                {myArchivedTasks.map((t) => (
                  <div key={t.id} className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs font-bold">
                    {t.title}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= REQUESTS TAB ================= */}
        {activeTab === 'requests' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 h-fit space-y-4">
              <h2 className="font-bold text-slate-900 text-base">Submit Request to Manager</h2>
              <form onSubmit={handleCreateRequest} className="space-y-4">
                <select value={reqType} onChange={(e) => setReqType(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white">
                  <option value="Time Off / Holiday">Time Off / Holiday</option>
                  <option value="Shift Swap">Shift Swap</option>
                  <option value="Equipment / Uniform">Equipment / Uniform</option>
                  <option value="General Manager Request">General Manager Request</option>
                </select>
                <input
                  type="text"
                  value={reqDates}
                  onChange={(e) => setReqDates(e.target.value)}
                  placeholder="Relevant Dates (Optional)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
                <textarea
                  rows="3"
                  required
                  value={reqNote}
                  onChange={(e) => setReqNote(e.target.value)}
                  placeholder="Request details..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
                <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl text-sm">
                  Send Request
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
              <h2 className="font-bold text-slate-900 text-base">{isSupervisor ? 'All Team Requests' : 'My Requests'}</h2>
              {(isSupervisor ? requests : requests.filter((r) => r.requesterId === currentUser.id)).map((r) => (
                <div key={r.id} className="p-4 rounded-xl border border-slate-200 space-y-2 bg-slate-50">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-600">{r.requesterName} • {r.type} {r.dates ? `(${r.dates})` : ''}</span>
                    <span className="font-bold uppercase">{r.status}</span>
                  </div>
                  <p className="text-xs text-slate-700 bg-white p-3 rounded-lg border">{r.note}</p>
                  {isSupervisor && r.status === 'pending' && (
                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        value={managerReplyInputs[r.id] || ''}
                        onChange={(e) => setManagerReplyInputs((prev) => ({ ...prev, [r.id]: e.target.value }))}
                        placeholder="Reply note..."
                        className="flex-1 px-3 py-1.5 rounded-lg border text-xs bg-white"
                      />
                      <button onClick={() => handleDecisionRequest(r, 'approved')} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold">Approve</button>
                      <button onClick={() => handleDecisionRequest(r, 'declined')} className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold">Decline</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= USER MANAGEMENT TAB ================= */}
        {activeTab === 'users' && isManager && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 h-fit space-y-4">
              <h2 className="font-bold text-slate-900 text-base">Add Team Member</h2>
              <form onSubmit={handleAddUser} className="space-y-4">
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
                <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white">
                  <option value="colleague">Colleague</option>
                  <option value="team_leader">Team Leader</option>
                  <option value="manager">Manager</option>
                </select>
                <input
                  type="text"
                  required
                  value={newUserPin}
                  onChange={(e) => setNewUserPin(e.target.value)}
                  placeholder="Initial PIN (1234)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
                <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl text-sm">
                  Create Account
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
              <h2 className="font-bold text-slate-900 text-base">Current Team Roster ({teamUsers.length})</h2>
              <div className="divide-y divide-slate-100">
                {teamUsers.map((u) => (
                  <div key={u.id} className="py-3 flex items-center justify-between gap-3">
                    {editingUserId === u.id ? (
                      <div className="flex-1 flex flex-wrap gap-2 bg-indigo-50 p-3 rounded-xl">
                        <input type="text" value={editUserName} onChange={(e) => setEditUserName(e.target.value)} className="px-2.5 py-1 rounded border text-xs bg-white"/>
                        <select value={editUserRole} onChange={(e) => setEditUserRole(e.target.value)} className="px-2.5 py-1 rounded border text-xs bg-white">
                          <option value="colleague">Colleague</option>
                          <option value="team_leader">Team Leader</option>
                          <option value="manager">Manager</option>
                        </select>
                        <input type="text" value={editUserPin} onChange={(e) => setEditUserPin(e.target.value)} className="w-20 px-2.5 py-1 rounded border text-xs bg-white"/>
                        <button onClick={() => handleSaveEditUser(u.id)} className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-semibold">Save</button>
                        <button onClick={() => setEditingUserId(null)} className="px-2.5 py-1 bg-slate-200 rounded text-xs">Cancel</button>
                      </div>
                    ) : (
                      <>
                        <div>
                          <p className="font-bold text-sm text-slate-800">{u.name}</p>
                          <p className="text-xs text-slate-500 capitalize">{u.role.replace('_', ' ')} • PIN: {u.pin || '1234'}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button onClick={() => startEditUser(u)} className="px-3 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg">Edit / PIN</button>
                          {u.id !== currentUser.id && (
                            <button onClick={() => handleDeleteUser(u)} className="p-1.5 text-rose-600"><Trash2 className="w-4 h-4"/></button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= BOTTOM OF PROFILE: ASDA TERMINAL LOGIN QR CODES ================= */}
        <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                <QrCode className="w-5 h-5"/>
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-base">{currentUser.name}'s Terminal Login QR Codes</h2>
                <p className="text-xs text-slate-500">Saved privately on this phone only. Scan with your Zebra terminal to log in.</p>
              </div>
            </div>
            {(savedQrEmail || savedQrPassword) && (
              <button onClick={handleClearTerminalQr} className="text-xs font-semibold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl w-fit">
                Clear Saved QR Codes
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <form onSubmit={handleSaveEmailQr} className="space-y-2">
              <label className="block text-xs font-semibold text-slate-600 uppercase">Asda Email Address</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={qrEmailInput}
                  onChange={(e) => setQrEmailInput(e.target.value)}
                  placeholder="firstname.lastname@asda.co.uk"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                />
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl text-xs shrink-0">
                  Save Email QR
                </button>
              </div>
            </form>

            <form onSubmit={handleSavePasswordQr} className="space-y-2">
              <label className="block text-xs font-semibold text-slate-600 uppercase">Terminal Password</label>
              <div className="flex space-x-2">
                <input
                  type="password"
                  value={qrPasswordInput}
                  onChange={(e) => setQrPasswordInput(e.target.value)}
                  placeholder="Enter terminal password"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                />
                <button type="submit" className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-xl text-xs shrink-0">
                  Save Password QR
                </button>
              </div>
            </form>
          </div>

          {(savedQrEmail || savedQrPassword) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center text-center space-y-3">
                <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 font-bold text-xs uppercase">Email</span>
                {savedQrEmail ? (
                  <>
                    <div
                      onClick={() => { setLightboxTitle('Email QR Code'); setLightboxImage(buildQrCodeUrl(savedQrEmail)); }}
                      className="p-4 bg-white rounded-2xl border-2 border-slate-200 cursor-pointer">
                      <img src={buildQrCodeUrl(savedQrEmail)} alt="Email QR" className="w-44 h-44 object-contain"/>
                    </div>
                    <p className="text-xs text-slate-500 font-mono truncate max-w-xs">{savedQrEmail}</p>
                  </>
                ) : (
                  <p className="text-xs text-slate-400 italic py-12">No Email QR saved yet.</p>
                )}
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center text-center space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 rounded-full bg-slate-900 text-white font-bold text-xs uppercase">Password</span>
                  {savedQrPassword && (
                    <button
                      type="button"
                      onClick={() => setRevealPasswordQr(!revealPasswordQr)}
                      className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1">
                      {revealPasswordQr ? <EyeOff className="w-3.5 h-3.5"/> : <Eye className="w-3.5 h-3.5"/>}
                      <span>{revealPasswordQr ? 'Hide' : 'Reveal'}</span>
                    </button>
                  )}
                </div>
                {savedQrPassword ? (
                  <>
                    <div
                      onClick={() => {
                        if (!revealPasswordQr) setRevealPasswordQr(true);
                        else { setLightboxTitle('Password QR Code'); setLightboxImage(buildQrCodeUrl(savedQrPassword)); }
                      }}
                      className="p-4 bg-white rounded-2xl border-2 border-slate-200 cursor-pointer relative">
                      <img
                        src={buildQrCodeUrl(savedQrPassword)}
                        alt="Password QR"
                        className={`w-44 h-44 object-contain ${revealPasswordQr ? '' : 'blur-md'}`}
                      />
                    </div>
                    <p className="text-xs text-slate-500 font-mono">••••••••••••</p>
                  </>
                ) : (
                  <p className="text-xs text-slate-400 italic py-12">No Password QR saved yet.</p>
                )}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
