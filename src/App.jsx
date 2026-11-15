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

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Default Built-In Task Presets & Expectations
const DEFAULT_TASK_PRESETS = [
  { id: 'custom', label: 'Custom (Type Your Own)', title: '', description: '', isBuiltIn: true },
  {
    id: 'warehouse',
    label: 'Warehouse',
    title: 'Warehouse',
    description: 'Maintain warehouse organisation, tip incoming deliveries safely, condense pallets and cages, keep walkways and fire exits clear, and upload photos of the cleared warehouse floor.',
    isBuiltIn: true
  },
  {
    id: 'finalising_deliveries',
    label: 'Finalising Deliveries',
    title: 'Finalising Deliveries',
    description: 'Verify all incoming deliveries are finalised on the system, check off paperwork/ASN discrepancies, and upload a photo of the finalised delivery screen or paperwork.',
    isBuiltIn: true
  },
  {
    id: 'waste',
    label: 'Waste',
    title: 'Waste',
    description: 'Process all damages, splits, and out-of-date stock. Scan everything accurately, clear the waste cages/area, and upload a photo of the cleared area.',
    isBuiltIn: true
  },
  {
    id: 'drop_tops',
    label: 'Drop Tops',
    title: 'Drop Tops',
    description: 'Pull down top-stock across the assigned aisles to fill shelf gaps, face up as you go, update any capacity issues, and upload a photo of the completed bays.',
    isBuiltIn: true
  },
  {
    id: 'gifting',
    label: 'Gifting',
    title: 'Gifting',
    description: 'Replenish and dress the seasonal/gifting bays, ensure all price labels are present and aligned, remove empty cardboard, and upload a photo of the finished display.',
    isBuiltIn: true
  },
  {
    id: 'hb',
    label: 'H&B',
    title: 'H&B',
    description: 'Work Health & Beauty delivery/backstock, check security tags on high-value lines, face up shelves, and upload a photo of completed bays.',
    isBuiltIn: true
  },
  {
    id: 'horseshoe',
    label: 'Horseshoe',
    title: 'Horseshoe',
    description: 'Work and replenish the Horseshoe area, keep promotional lines topped up and faced, clear all rubbish, and upload a photo of the finished section.',
    isBuiltIn: true
  },
  {
    id: 'modular_compliance',
    label: 'Modular Compliance',
    title: 'Modular Compliance',
    description: 'Relay/check bays against the current modular plan, ensure all SELs/ESLs are aligned to the left edge and match product facings, and upload a clear photo of the bay.',
    isBuiltIn: true
  },
  {
    id: 'camera_tasks',
    label: 'Camera Tasks',
    title: 'Camera Tasks',
    description: 'Action the latest overhead camera gap/stock alerts, replenish or zero-check flagged lines, and upload a photo of the resolved bays.',
    isBuiltIn: true
  },
  {
    id: 'promo',
    label: 'Promo',
    title: 'Promo',
    description: 'Replenish promotional end-caps and features, verify correct promotional barkers/POS are displayed, face up stock, and upload a photo of the end-cap.',
    isBuiltIn: true
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
  { id: 'mgr-1', name: 'Lee (Grocery Manager)', role: 'manager', pin: '1234', color: 'bg-indigo-600', fcmTokens: [], contractedDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], defaultPresets: [] },
  { id: 'tl-1', name: 'Team Leader 1', role: 'team_leader', pin: '1234', color: 'bg-violet-600', fcmTokens: [], contractedDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], defaultPresets: [] },
  { id: 'tl-2', name: 'Team Leader 2', role: 'team_leader', pin: '1234', color: 'bg-purple-600', fcmTokens: [], contractedDays: ['Wed', 'Thu', 'Fri', 'Sat', 'Sun'], defaultPresets: [] },
  { id: 'col-1', name: 'Colleague 1', role: 'colleague', pin: '1234', color: 'bg-blue-600', fcmTokens: [], contractedDays: [], defaultPresets: [] },
  { id: 'col-2', name: 'Colleague 2', role: 'colleague', pin: '1234', color: 'bg-emerald-600', fcmTokens: [], contractedDays: [], defaultPresets: [] },
  { id: 'col-3', name: 'Colleague 3', role: 'colleague', pin: '1234', color: 'bg-amber-600', fcmTokens: [], contractedDays: [], defaultPresets: [] },
  { id: 'col-4', name: 'Colleague 4', role: 'colleague', pin: '1234', color: 'bg-rose-600', fcmTokens: [], contractedDays: [], defaultPresets: [] },
  { id: 'col-5', name: 'Colleague 5', role: 'colleague', pin: '1234', color: 'bg-cyan-600', fcmTokens: [], contractedDays: [], defaultPresets: [] },
  { id: 'col-6', name: 'Colleague 6', role: 'colleague', pin: '1234', color: 'bg-teal-600', fcmTokens: [], contractedDays: [], defaultPresets: [] },
  { id: 'col-7', name: 'Colleague 7', role: 'colleague', pin: '1234', color: 'bg-orange-600', fcmTokens: [], contractedDays: [], defaultPresets: [] }
];

const AVATAR_COLORS = [
  'bg-blue-600', 'bg-emerald-600', 'bg-violet-600',
  'bg-amber-600', 'bg-rose-600', 'bg-cyan-600', 'bg-teal-600'
];

const buildQrCodeUrl = (value) => {
  if (!value) return '';
  return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=16&data=${encodeURIComponent(value)}`;
};

const getTaskCompletionPhotos = (task) => {
  if (!task) return [];
  if (Array.isArray(task.completionPhotos) && task.completionPhotos.length > 0) return task.completionPhotos;
  if (task.completionPhoto) return [task.completionPhoto];
  return [];
};

const getTaskManagerPhotos = (task) => {
  if (!task) return [];
  if (Array.isArray(task.managerPhotos) && task.managerPhotos.length > 0) return task.managerPhotos;
  if (task.managerPhoto) return [task.managerPhoto];
  return [];
};

const getTodayDayCode = () => {
  const dayIdx = new Date().getDay();
  const map = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return map[dayIdx];
};

const getTodayIsoDate = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getDueDateBadgeInfo = (dueDateStr) => {
  if (!dueDateStr) return null;
  const todayStr = getTodayIsoDate();
  const todayDate = new Date(todayStr + 'T00:00:00');
  const dueDate = new Date(dueDateStr + 'T00:00:00');
  if (isNaN(dueDate.getTime())) return null;

  const diffDays = Math.round((dueDate - todayDate) / (1000 * 60 * 60 * 24));
  const formatted = dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  if (diffDays < 0) {
    return {
      label: `OVERDUE (Due ${formatted})`,
      className: 'bg-rose-600 text-white',
      isOverdue: true
    };
  }
  if (diffDays === 0) {
    return {
      label: `DUE TODAY (${formatted})`,
      className: 'bg-rose-500 text-white',
      isOverdue: false
    };
  }
  if (diffDays <= 2) {
    return {
      label: `Due in ${diffDays}d (${formatted})`,
      className: 'bg-amber-500 text-white',
      isOverdue: false
    };
  }
  return {
    label: `Complete by ${formatted}`,
    className: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
    isOverdue: false
  };
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
        const MAX_WIDTH = 720;
        const scaleSize = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
        canvas.width = img.width * scaleSize;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.65));
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
    if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) {
      return a.dueDate.localeCompare(b.dueDate);
    }
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });
};

const sortPoolTasksByDeadline = (poolList) => {
  return [...poolList].sort((a, b) => {
    if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) {
      return a.dueDate.localeCompare(b.dueDate);
    }
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
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
  const autoDropRunningRef = useRef(false);

  const [showPinModal, setShowPinModal] = useState(false);
  const [selfNewPin, setSelfNewPin] = useState('');

  const [editingUserId, setEditingUserId] = useState(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserRole, setEditUserRole] = useState('colleague');
  const [editUserPin, setEditUserPin] = useState('');
  const [editUserDays, setEditUserDays] = useState([]);
  const [editUserPresets, setEditUserPresets] = useState([]);

  const [activeTab, setActiveTab] = useState('tasks');
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // Custom Presets & Standing Tasks Tab State (Manager Only)
  const [customPresets, setCustomPresets] = useState([]);
  const [newPresetLabel, setNewPresetLabel] = useState('');
  const [newPresetTitle, setNewPresetTitle] = useState('');
  const [newPresetDesc, setNewPresetDesc] = useState('');
  const [editingPresetId, setEditingPresetId] = useState(null);

  // Combined Quick-Select Presets (Built-in + Custom Manager Presets)
  const allTaskPresets = [...DEFAULT_TASK_PRESETS, ...customPresets];

  // Performance Review Tab Filters (Manager Only)
  const [perfFilterUserId, setPerfFilterUserId] = useState('all');
  const [perfFilterView, setPerfFilterView] = useState('all_issues');

  // Holiday Calendar & Blackout State
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null);
  const [managerBlackoutMode, setManagerBlackoutMode] = useState(false);
  const [blackoutDates, setBlackoutDates] = useState({});
  const [lastAutoDropDate, setLastAutoDropDate] = useState(null);

  // Seasonal Availability Tab State
  const [seasonalList, setSeasonalList] = useState([]);
  const [seasonalYear, setSeasonalYear] = useState(new Date().getFullYear());
  const [seasonalMonth, setSeasonalMonth] = useState(new Date().getMonth());
  const [selectedSeasonalDate, setSelectedSeasonalDate] = useState(getTodayIsoDate());
  const [seasonalMinStart, setSeasonalMinStart] = useState('06:00');
  const [seasonalMaxFinish, setSeasonalMaxFinish] = useState('22:00');
  const [seasonalStatus, setSeasonalStatus] = useState('available');
  const [seasonalNote, setSeasonalNote] = useState('');
  const [seasonalFilterUserId, setSeasonalFilterUserId] = useState('all');

  // Request & Manual Holiday Submission Form State
  const [reqTargetUserId, setReqTargetUserId] = useState('');
  const [reqAutoApprove, setReqAutoApprove] = useState(true);
  const [reqType, setReqType] = useState('Time Off / Holiday');
  const [reqStartDate, setReqStartDate] = useState('');
  const [reqEndDate, setReqEndDate] = useState('');
  const [reqNote, setReqNote] = useState('');
  const [managerReplyInputs, setManagerReplyInputs] = useState({});
  const [requestsListOpen, setRequestsListOpen] = useState(true); // Collapsible All Team Requests Card
  const [editingRequestId, setEditingRequestId] = useState(null);
  const [editReqTargetUserId, setEditReqTargetUserId] = useState('');
  const [editReqType, setEditReqType] = useState('Time Off / Holiday');
  const [editReqStartDate, setEditReqStartDate] = useState('');
  const [editReqEndDate, setEditReqEndDate] = useState('');
  const [editReqNote, setEditReqNote] = useState('');
  const [editReqStatus, setEditReqStatus] = useState('approved');

  // Collapsible Accordion States for Supervisor Board
  const [openSections, setOpenSections] = useState({
    taskPool: true,
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

  // Assign Task Form State
  const [selectedPreset, setSelectedPreset] = useState('custom');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('standard');
  const [isPoolTaskMode, setIsPoolTaskMode] = useState(false);
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskAssigneeIds, setTaskAssigneeIds] = useState([]);
  const [taskPhotos, setTaskPhotos] = useState([]);

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
  const [completionPhotos, setCompletionPhotos] = useState([]);

  const [commentInputs, setCommentInputs] = useState({});
  const [lightboxImage, setLightboxImage] = useState(null);
  const [lightboxTitle, setLightboxTitle] = useState('');

  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('colleague');
  const [newUserPin, setNewUserPin] = useState('1234');
  const [newUserDays, setNewUserDays] = useState([]);
  const [newUserPresets, setNewUserPresets] = useState([]);

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
    setReqTargetUserId(currentUser.id);
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

  useEffect(() => {
    if (!currentUser || !selectedSeasonalDate) return;
    const existing = seasonalList.find(
      (item) => item.userId === currentUser.id && item.date === selectedSeasonalDate
    );
    if (existing) {
      setSeasonalMinStart(existing.minStart || '06:00');
      setSeasonalMaxFinish(existing.maxFinish || '22:00');
      setSeasonalStatus(existing.status || 'available');
      setSeasonalNote(existing.note || '');
    } else {
      setSeasonalMinStart('06:00');
      setSeasonalMaxFinish('22:00');
      setSeasonalStatus('available');
      setSeasonalNote('');
    }
  }, [selectedSeasonalDate, currentUser?.id, seasonalList]);

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
    const found = allTaskPresets.find((p) => p.id === presetId);
    if (found) {
      setTaskTitle(found.title);
      setTaskDesc(found.description);
    }
  };

  useEffect(() => {
    let unsubFCM = null;
    const setupForegroundMessaging = async () => {
      try {
        const supported = await isSupported();
        if (!supported) return;
        const messaging = getMessaging(app);
        unsubFCM = onMessage(messaging, (payload) => {
          const title = payload.notification?.title || 'Grocery Task Manager';
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
          for (const u of teamUsers) {
            if (u.id !== currentUser.id && Array.isArray(u.fcmTokens) && u.fcmTokens.includes(currentToken)) {
              const filtered = u.fcmTokens.filter((tk) => tk !== currentToken);
              await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', u.id), {
                fcmTokens: filtered
              });
            }
          }
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
    const blackoutRef = doc(db, 'artifacts', appId, 'public', 'data', 'config', 'blackouts');
    const unsubBlackouts = onSnapshot(blackoutRef, (docSnap) => {
      if (docSnap.exists()) {
        setBlackoutDates(docSnap.data().dates || {});
      }
    });

    const dailyDropRef = doc(db, 'artifacts', appId, 'public', 'data', 'config', 'dailyAutoDrop');
    const unsubAutoDrop = onSnapshot(dailyDropRef, (docSnap) => {
      if (docSnap.exists()) {
        setLastAutoDropDate(docSnap.data().lastRunDate || '');
      } else {
        setLastAutoDropDate('');
      }
    });

    const customPresetsRef = doc(db, 'artifacts', appId, 'public', 'data', 'config', 'customPresets');
    const unsubCustomPresets = onSnapshot(customPresetsRef, (docSnap) => {
      if (docSnap.exists()) {
        setCustomPresets(docSnap.data().list || []);
      } else {
        setCustomPresets([]);
      }
    });

    return () => {
      unsubBlackouts();
      unsubAutoDrop();
      unsubCustomPresets();
    };
  }, [fbUser]);

  const handleToggleBlackoutDate = async (dateStr) => {
    if (!currentUser || currentUser.role !== 'manager') return;
    const updated = { ...blackoutDates };
    if (updated[dateStr]) {
      delete updated[dateStr];
      showToast("Blackout Removed", `${dateStr} is now available for booking.`);
    } else {
      updated[dateStr] = 'Management Embargo';
      showToast("Date Blacked Out", `${dateStr} is now restricted.`);
    }
    setBlackoutDates(updated);
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'config', 'blackouts'), { dates: updated }, { merge: true });
  };

  // Save or Update Custom Quick-Select Task Preset (Manager Only)
  const handleSaveCustomPreset = async (e) => {
    e.preventDefault();
    if (!newPresetLabel.trim() || !newPresetTitle.trim() || !newPresetDesc.trim()) return;

    let updatedList = [...customPresets];
    if (editingPresetId) {
      updatedList = updatedList.map((p) =>
        p.id === editingPresetId
          ? {
              ...p,
              label: newPresetLabel.trim(),
              title: newPresetTitle.trim(),
              description: newPresetDesc.trim()
            }
          : p
      );
    } else {
      const newPreset = {
        id: `custom_${Date.now()}`,
        label: newPresetLabel.trim(),
        title: newPresetTitle.trim(),
        description: newPresetDesc.trim(),
        isBuiltIn: false
      };
      updatedList.push(newPreset);
    }

    await setDoc(
      doc(db, 'artifacts', appId, 'public', 'data', 'config', 'customPresets'),
      { list: updatedList },
      { merge: true }
    );

    setNewPresetLabel('');
    setNewPresetTitle('');
    setNewPresetDesc('');
    setEditingPresetId(null);
    showToast("Quick-Select Saved", "Your custom preset is now live across the app.");
  };

  const handleDeleteCustomPreset = async (presetId) => {
    const updatedList = customPresets.filter((p) => p.id !== presetId);
    await setDoc(
      doc(db, 'artifacts', appId, 'public', 'data', 'config', 'customPresets'),
      { list: updatedList },
      { merge: true }
    );
    showToast("Preset Deleted", "Removed custom quick-select preset.");
  };

  // Toggle a colleague's standing task preset directly from the Standing Tasks tab
  const handleQuickToggleUserStandingPreset = async (userObj, presetId) => {
    const currentList = Array.isArray(userObj.defaultPresets) ? userObj.defaultPresets : [];
    const updatedList = currentList.includes(presetId)
      ? currentList.filter((id) => id !== presetId)
      : [...currentList, presetId];

    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', userObj.id), {
      defaultPresets: updatedList
    });
  };

  // Toggle a colleague's contracted shift day directly from the Standing Tasks tab
  const handleQuickToggleUserContractedDay = async (userObj, dayCode) => {
    const currentDays = Array.isArray(userObj.contractedDays) ? userObj.contractedDays : [];
    const updatedDays = currentDays.includes(dayCode)
      ? currentDays.filter((d) => d !== dayCode)
      : [...currentDays, dayCode];

    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', userObj.id), {
      contractedDays: updatedDays
    });
  };

  useEffect(() => {
    if (!fbUser) return;
    const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'users');
    const tasksRef = collection(db, 'artifacts', appId, 'public', 'data', 'tasks');
    const requestsRef = collection(db, 'artifacts', appId, 'public', 'data', 'requests');
    const notifsRef = collection(db, 'artifacts', appId, 'public', 'data', 'notifications');
    const seasonalRef = collection(db, 'artifacts', appId, 'public', 'data', 'seasonalAvailability');

    const unsubUsers = onSnapshot(usersRef, async (snapshot) => {
      if (snapshot.empty) {
        for (const u of DEFAULT_USERS) {
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', u.id), u);
        }
      } else {
        const loaded = [];
        snapshot.forEach((d) => loaded.push({ id: d.id, ...d.data() }));
        const rolePriority = { manager: 1, team_leader: 2, colleague: 3 };
        loaded.sort((a, b) => (rolePriority[a.role] || 9) - (rolePriority[b.role] || 9) || (a.name || '').localeCompare(b.name || ''));
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

    const unsubSeasonal = onSnapshot(seasonalRef, (snapshot) => {
      const loaded = [];
      snapshot.forEach((d) => loaded.push({ id: d.id, ...d.data() }));
      loaded.sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.userName || '').localeCompare(b.userName || ''));
      setSeasonalList(loaded);
    });

    return () => {
      unsubUsers();
      unsubTasks();
      unsubReqs();
      unsubNotifs();
      unsubSeasonal();
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

  const getDatesInRange = (startDateStr, endDateStr) => {
    if (!startDateStr) return [];
    const start = new Date(startDateStr);
    const end = endDateStr ? new Date(endDateStr) : new Date(startDateStr);
    if (isNaN(start.getTime())) return [];

    const arr = [];
    let current = new Date(start);
    let safety = 0;
    while (current <= (isNaN(end.getTime()) ? start : end) && safety < 366) {
      arr.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
      safety++;
    }
    return arr;
  };

  const isUserOnApprovedHoliday = (userId, isoDateStr) => {
    return requests.some((req) => {
      if (req.requesterId !== userId) return false;
      if (req.type !== 'Time Off / Holiday' || req.status !== 'approved') return false;
      const datesArr = getDatesInRange(req.startDate || req.dates, req.endDate || req.startDate || req.dates);
      return datesArr.includes(isoDateStr);
    });
  };

  const todayDayCode = getTodayDayCode();
  const todayIsoDate = getTodayIsoDate();

  const isUserOnShiftToday = (u) => {
    if (!Array.isArray(u.contractedDays) || !u.contractedDays.includes(todayDayCode)) return false;
    if (isUserOnApprovedHoliday(u.id, todayIsoDate)) return false;
    return true;
  };

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

  // ==========================================
  // SEASONAL AVAILABILITY HANDLERS
  // ==========================================
  const handleSaveSeasonalAvailability = async (e) => {
    e.preventDefault();
    if (!currentUser || !selectedSeasonalDate) return;

    if (seasonalStatus === 'available' && (!seasonalMinStart || !seasonalMaxFinish)) {
      showToast("Times Required", "Please enter both your minimum start time and maximum finish time.");
      return;
    }

    const docId = `${currentUser.id}_${selectedSeasonalDate}`;
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'seasonalAvailability', docId), {
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      userColor: currentUser.color || 'bg-indigo-600',
      date: selectedSeasonalDate,
      status: seasonalStatus,
      minStart: seasonalStatus === 'available' ? seasonalMinStart : '',
      maxFinish: seasonalStatus === 'available' ? seasonalMaxFinish : '',
      note: seasonalNote.trim(),
      updatedAt: new Date().toISOString()
    });

    showToast(
      "Availability Saved",
      seasonalStatus === 'available'
        ? `Saved ${selectedSeasonalDate}: ${seasonalMinStart} – ${seasonalMaxFinish}`
        : `Marked ${selectedSeasonalDate} as Unavailable.`
    );
  };

  const handleClearSeasonalAvailability = async (targetUserId, dateStr) => {
    const uid = targetUserId || currentUser?.id;
    if (!uid || !dateStr) return;
    const docId = `${uid}_${dateStr}`;
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'seasonalAvailability', docId));
    showToast("Availability Cleared", `Removed availability entry for ${dateStr}.`);
  };

  // ==========================================
  // DAILY STANDING ROUTINE AUTO-ALLOCATION
  // ==========================================
  const handleRunDailyStandingTasks = async (isManualTrigger = false) => {
    if (autoDropRunningRef.current || teamUsers.length === 0) return;
    autoDropRunningRef.current = true;

    try {
      const todayIso = getTodayIsoDate();
      const dayCode = getTodayDayCode();
      const tasksRef = collection(db, 'artifacts', appId, 'public', 'data', 'tasks');
      let createdCount = 0;

      for (const u of teamUsers) {
        const userDays = Array.isArray(u.contractedDays) ? u.contractedDays : [];
        const userPresets = Array.isArray(u.defaultPresets) ? u.defaultPresets : [];

        if (!userDays.includes(dayCode) || userPresets.length === 0) continue;
        if (isUserOnApprovedHoliday(u.id, todayIso)) continue;

        for (const presetId of userPresets) {
          const presetObj = allTaskPresets.find((p) => p.id === presetId);
          if (!presetObj || !presetObj.title) continue;

          const alreadyExistsToday = tasks.some(
            (t) =>
              t.assigneeId === u.id &&
              t.title === presetObj.title &&
              (t.autoAssignedDate === todayIso || (t.createdAt && t.createdAt.startsWith(todayIso)))
          );

          if (!alreadyExistsToday) {
            await addDoc(tasksRef, {
              title: presetObj.title,
              description: presetObj.description,
              priority: 'standard',
              dueDate: todayIso,
              progressStatus: 'not_started',
              startedAt: null,
              pausedAt: null,
              pauseReason: '',
              pauseHistory: [],
              handoverFromId: null,
              handoverFromName: null,
              handoverNote: '',
              handoverHistory: [],
              assigneeId: u.id,
              assigneeName: u.name,
              assigneeRole: u.role,
              createdById: 'system-auto',
              createdByName: 'Daily Shift Auto-Drop',
              autoAssignedDate: todayIso,
              claimedFromPoolBy: null,
              delegatedByName: null,
              managerPhoto: null,
              managerPhotos: [],
              completionPhoto: null,
              completionPhotos: [],
              completionNote: '',
              comments: [],
              status: 'active',
              createdAt: new Date().toISOString(),
              completedAt: null,
              validatedAt: null
            });

            await sendNotification(
              u.id,
              null,
              `Daily Shift Task (${dayCode})`,
              `Your contracted shift task "${presetObj.title}" has been added to your list.`
            );
            createdCount++;
          }
        }
      }

      await setDoc(
        doc(db, 'artifacts', appId, 'public', 'data', 'config', 'dailyAutoDrop'),
        { lastRunDate: todayIso, lastRunDay: dayCode, updatedAt: new Date().toISOString() },
        { merge: true }
      );

      if (createdCount > 0) {
        showToast("Daily Shift Tasks Dropped", `Auto-allocated ${createdCount} standing task(s) for ${dayCode}.`);
      } else if (isManualTrigger) {
        showToast("Up to Date", `All contracted ${dayCode} standing tasks are already on the board.`);
      }
    } catch (err) {
      console.error("Auto-drop error:", err);
    } finally {
      autoDropRunningRef.current = false;
    }
  };

  useEffect(() => {
    if (!fbUser || !currentUser || teamUsers.length === 0 || lastAutoDropDate === null) return;
    const todayIso = getTodayIsoDate();
    if (lastAutoDropDate !== todayIso) {
      handleRunDailyStandingTasks(false);
    }
  }, [fbUser, currentUser?.id, teamUsers.length, lastAutoDropDate, customPresets.length]);

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
    setEditUserName(u.name || '');
    setEditUserRole(u.role || 'colleague');
    setEditUserPin(u.pin || '1234');
    setEditUserDays(Array.isArray(u.contractedDays) ? u.contractedDays : []);
    setEditUserPresets(Array.isArray(u.defaultPresets) ? u.defaultPresets : []);
  };

  const toggleDayInList = (day, list, setter) => {
    setter(list.includes(day) ? list.filter((d) => d !== day) : [...list, day]);
  };

  const togglePresetInList = (presetId, list, setter) => {
    setter(list.includes(presetId) ? list.filter((p) => p !== presetId) : [...list, presetId]);
  };

  const handleSaveEditUser = async (userId) => {
    if (!editUserName.trim() || !editUserPin.trim()) return;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', userId), {
      name: editUserName.trim(),
      role: editUserRole,
      pin: editUserPin.trim(),
      contractedDays: editUserDays,
      defaultPresets: editUserPresets
    });
    setEditingUserId(null);
    showToast("Profile Updated", `Saved shift days & routine tasks for ${editUserName.trim()}.`);
  };

  const handleMultiPhotoUpload = async (e, currentPhotos, setter) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = 6 - currentPhotos.length;
    if (remainingSlots <= 0) {
      showToast("Maximum Photos Reached", "You can attach up to 6 photos per task.");
      e.target.value = '';
      return;
    }

    const filesToProcess = files.slice(0, remainingSlots);
    try {
      const compressedList = [];
      for (const file of filesToProcess) {
        const compressed = await compressImage(file);
        compressedList.push(compressed);
      }
      setter((prev) => [...prev, ...compressedList]);
      if (files.length > remainingSlots) {
        showToast("Limit Note", "Added up to the 6-photo maximum.");
      }
    } catch {
      showToast("Photo Error", "Could not process one or more photos.");
    }
    e.target.value = '';
  };

  const removePhotoFromList = (indexToRemove, setter) => {
    setter((prev) => prev.filter((_, idx) => idx !== indexToRemove));
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
    if (!taskTitle.trim()) {
      showToast("Missing Title", "Please enter a task title.");
      return;
    }

    const tasksRef = collection(db, 'artifacts', appId, 'public', 'data', 'tasks');
    const isUrgent = taskPriority === 'urgent';

    if (isPoolTaskMode) {
      if (!taskDueDate) {
        showToast("Complete By Date Required", "Please pick a 'Complete By' date for the Open Pool task.");
        return;
      }

      await addDoc(tasksRef, {
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        priority: taskPriority,
        dueDate: taskDueDate,
        progressStatus: 'not_started',
        startedAt: null,
        pausedAt: null,
        pauseReason: '',
        pauseHistory: [],
        handoverFromId: null,
        handoverFromName: null,
        handoverNote: '',
        handoverHistory: [],
        assigneeId: 'pool',
        assigneeName: 'Open Task Pool (Unclaimed)',
        assigneeRole: 'team_leader',
        createdById: currentUser.id,
        createdByName: currentUser.name,
        claimedFromPoolBy: null,
        claimedAt: null,
        delegatedByName: null,
        managerPhoto: taskPhotos[0] || null,
        managerPhotos: taskPhotos,
        completionPhoto: null,
        completionPhotos: [],
        completionNote: '',
        comments: [],
        status: 'open_pool',
        createdAt: new Date().toISOString(),
        completedAt: null,
        validatedAt: null
      });

      await sendNotification(
        null,
        'supervisors',
        'New Job in Open Task Pool',
        `${currentUser.name} added "${taskTitle.trim()}" (Complete by ${taskDueDate}) to the Team Leader Task Pool.`
      );

      setSelectedPreset('custom');
      setTaskTitle('');
      setTaskDesc('');
      setTaskPriority('standard');
      setTaskDueDate('');
      setTaskPhotos([]);
      showToast("Added to Task Pool", `"${taskTitle.trim()}" is now ready for Team Leaders to claim.`);
      return;
    }

    if (taskAssigneeIds.length === 0) {
      showToast("Select Assignee", "Please tick at least one person or switch to Open Task Pool.");
      return;
    }
    const selectedUsers = teamUsers.filter((u) => taskAssigneeIds.includes(u.id));
    if (selectedUsers.length === 0) return;

    for (const assigneeObj of selectedUsers) {
      await addDoc(tasksRef, {
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        priority: taskPriority,
        dueDate: taskDueDate || null,
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
        claimedFromPoolBy: null,
        claimedAt: null,
        delegatedByName: null,
        managerPhoto: taskPhotos[0] || null,
        managerPhotos: taskPhotos,
        completionPhoto: null,
        completionPhotos: [],
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
        `${currentUser.name} assigned ${isUrgent ? '[PRIORITY] ' : ''}"${taskTitle.trim()}"${taskDueDate ? ` (Complete by ${taskDueDate})` : ''} to you.`
      );
    }

    setSelectedPreset('custom');
    setTaskTitle('');
    setTaskDesc('');
    setTaskPriority('standard');
    setTaskDueDate('');
    setTaskAssigneeIds([]);
    setTaskPhotos([]);
    showToast("Task Assigned", `Assigned to ${selectedUsers.map((u) => u.name).join(', ')}`);
  };

  const handleClaimPoolTask = async (poolTask, targetUserId) => {
    const targetUser = teamUsers.find((u) => u.id === (targetUserId || currentUser.id));
    if (!targetUser) return;

    const nowIso = new Date().toISOString();
    const claimedForSelf = targetUser.id === currentUser.id;

    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', poolTask.id), {
      status: 'active',
      assigneeId: targetUser.id,
      assigneeName: targetUser.name,
      assigneeRole: targetUser.role,
      progressStatus: 'not_started',
      claimedFromPoolBy: currentUser.name,
      claimedAt: nowIso,
      delegatedByName: claimedForSelf ? null : currentUser.name,
      delegatedAt: claimedForSelf ? null : nowIso
    });

    if (claimedForSelf) {
      await sendNotification(
        null,
        'supervisors',
        'Pool Task Claimed',
        `${currentUser.name} claimed "${poolTask.title}" from the Open Task Pool.`
      );
      showToast("Task Claimed", `"${poolTask.title}" is now on your active task list.`);
    } else {
      await sendNotification(
        targetUser.id,
        null,
        'Task Assigned from Pool',
        `${currentUser.name} claimed "${poolTask.title}" from the pool and assigned it to you.`
      );
      showToast("Claimed & Assigned", `Assigned "${poolTask.title}" to ${targetUser.name}.`);
    }
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
        status: 'active',
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
      const existingMgrPhotos = getTaskManagerPhotos(delegatingTask);
      for (const target of targetColleagues) {
        await addDoc(tasksRef, {
          title: delegatingTask.title,
          description: updatedDescription,
          priority: delegatingTask.priority || 'standard',
          dueDate: delegatingTask.dueDate || null,
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
          claimedFromPoolBy: delegatingTask.claimedFromPoolBy || null,
          delegatedByName: currentUser.name,
          delegatedAt: nowIso,
          managerPhoto: existingMgrPhotos[0] || null,
          managerPhotos: existingMgrPhotos,
          completionPhoto: null,
          completionPhotos: [],
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
      completionPhoto: completionPhotos[0] || null,
      completionPhotos: completionPhotos,
      completedAt: new Date().toISOString()
    });
    await sendNotification(
      null,
      'supervisors',
      'Task Ready for Validation',
      `${currentUser.name} completed "${completingTask.title}" (${completionPhotos.length} photo${completionPhotos.length === 1 ? '' : 's'}).`
    );
    setCompletingTask(null);
    setCompletionNote('');
    setCompletionPhotos([]);
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
    if (task.assigneeId && task.assigneeId !== 'pool') {
      await sendNotification(task.assigneeId, null, 'Task Validated & Cleared', `${currentUser.name} validated "${task.title}".`);
    }
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
    if (currentUser.id !== task.assigneeId && task.assigneeId !== 'pool') {
      await sendNotification(task.assigneeId, null, 'New Task Comment', `${currentUser.name} commented on "${task.title}".`);
    } else {
      await sendNotification(null, 'supervisors', 'New Task Comment', `${currentUser.name} commented on "${task.title}".`);
    }
  };

  // Supports Colleague self-submission AND Manager/Team Leader manual submission on behalf of a colleague
  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!reqStartDate || !reqNote.trim()) {
      showToast("Missing Info", "Please provide a start date and details.");
      return;
    }

    const targetId = isSupervisor && reqTargetUserId ? reqTargetUserId : currentUser.id;
    const targetUserObj = teamUsers.find((u) => u.id === targetId) || currentUser;
    const isBehalfOfColleague = targetUserObj.id !== currentUser.id;

    const requestedDates = getDatesInRange(reqStartDate, reqEndDate || reqStartDate);
    const hasBlackout = requestedDates.some((dStr) => blackoutDates[dStr]);
    if (hasBlackout && currentUser.role !== 'manager') {
      showToast("Blackout Restricted", "Selected dates include a management blackout day. Please speak to Lee.");
      return;
    }

    const finalStatus = isSupervisor && reqAutoApprove ? 'approved' : 'pending';

    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'requests'), {
      requesterId: targetUserObj.id,
      requesterName: targetUserObj.name,
      submittedById: currentUser.id,
      submittedByName: currentUser.name,
      type: reqType,
      startDate: reqStartDate,
      endDate: reqEndDate || reqStartDate,
      dates: reqEndDate && reqEndDate !== reqStartDate ? `${reqStartDate} to ${reqEndDate}` : reqStartDate,
      note: reqNote.trim(),
      status: finalStatus,
      managerReply: finalStatus === 'approved' ? `Logged & approved by ${currentUser.name}` : '',
      reviewedBy: finalStatus === 'approved' ? currentUser.name : null,
      reviewedAt: finalStatus === 'approved' ? new Date().toISOString() : null,
      createdAt: new Date().toISOString()
    });

    if (isBehalfOfColleague) {
      await sendNotification(
        targetUserObj.id,
        null,
        `Holiday / Request Logged (${finalStatus.toUpperCase()})`,
        `${currentUser.name} logged a ${reqType} (${reqStartDate}${reqEndDate ? ` to ${reqEndDate}` : ''}) on your calendar.`
      );
    } else {
      await sendNotification(null, 'supervisors', 'New Team Request', `${currentUser.name} submitted a ${reqType} request.`);
    }

    setReqStartDate('');
    setReqEndDate('');
    setReqNote('');
    showToast(
      finalStatus === 'approved' ? "Holiday Logged & Approved" : "Request Sent",
      `Added to calendar for ${targetUserObj.name}.`
    );
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

  const handleDeleteSingleRequest = async (reqId) => {
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'requests', reqId));
    if (editingRequestId === reqId) setEditingRequestId(null);
    showToast("Holiday / Request Deleted", "Removed entry from the calendar.");
  };

  const startEditRequest = (req) => {
    setEditingRequestId(req.id);
    setEditReqTargetUserId(req.requesterId || currentUser.id);
    setEditReqType(req.type || 'Time Off / Holiday');
    setEditReqStartDate(req.startDate || req.dates || '');
    setEditReqEndDate(req.endDate || req.startDate || req.dates || '');
    setEditReqNote(req.note || '');
    setEditReqStatus(req.status || 'approved');
    setRequestsListOpen(true);
  };

  const handleSaveEditRequest = async (reqId) => {
    if (!editReqStartDate) {
      showToast("Missing Date", "Please provide a start date.");
      return;
    }
    const targetUserObj = teamUsers.find((u) => u.id === editReqTargetUserId);
    const updatedEnd = editReqType === 'Time Off / Holiday' ? (editReqEndDate || editReqStartDate) : editReqStartDate;
    const formattedDates =
      editReqType === 'Time Off / Holiday' && updatedEnd && updatedEnd !== editReqStartDate
        ? `${editReqStartDate} to ${updatedEnd}`
        : editReqStartDate;

    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'requests', reqId), {
      requesterId: targetUserObj ? targetUserObj.id : editReqTargetUserId,
      requesterName: targetUserObj ? targetUserObj.name : 'Colleague',
      type: editReqType,
      startDate: editReqStartDate,
      endDate: updatedEnd,
      dates: formattedDates,
      note: editReqNote.trim(),
      status: editReqStatus,
      reviewedBy: currentUser.name,
      reviewedAt: new Date().toISOString()
    });

    setEditingRequestId(null);
    showToast("Holiday Updated", "Saved changes to the holiday calendar.");
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
      fcmTokens: [],
      contractedDays: newUserDays,
      defaultPresets: newUserPresets
    });
    setNewUserName('');
    setNewUserPin('1234');
    setNewUserDays([]);
    setNewUserPresets([]);
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
        <span className="text-sm font-medium">Loading Grocery Task Manager...</span>
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4 overflow-x-hidden">
        <div className="max-w-2xl w-full bg-white/10 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl text-white space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg">
              <Layers className="w-7 h-7 text-white"/>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Grocery Task Manager</h1>
            <p className="text-xs text-indigo-200">Select your name below to log into your Grocery workspace</p>
          </div>

          {loginTarget && (
            <div className="bg-slate-900/95 border border-indigo-500/40 p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl ${loginTarget.color || 'bg-indigo-600'} flex items-center justify-center font-bold`}>
                    {(loginTarget.name || 'U')[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Log in as {loginTarget.name}</h3>
                    <p className="text-xs text-indigo-300 capitalize">
                      {loginTarget.role === 'manager' ? 'Grocery Manager' : (loginTarget.role || 'colleague').replace('_', ' ')}
                    </p>
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
              <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-300 block">Grocery Manager</span>
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
                      <p className="text-[11px] text-indigo-200">Grocery Department Oversight, Validation & Team Admin</p>
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
                        {(u.name || 'T')[0]}
                      </div>
                      <div className="truncate">
                        <h4 className="font-bold text-xs truncate">{u.name}</h4>
                        <p className="text-[10px] text-indigo-200">Grocery Team Leader</p>
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
                      {(u.name || 'C')[0]}
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
  const onShiftTodayUsers = assignableUsers.filter((u) => isUserOnShiftToday(u));

  const myAssignedTasks = sortTasksByPriorityAndDate(
    tasks.filter((t) => t.assigneeId === currentUser.id && t.status === 'active')
  );
  const myPendingTasks = tasks.filter((t) => t.assigneeId === currentUser.id && t.status === 'pending_validation');
  const myArchivedTasks = tasks.filter((t) => t.assigneeId === currentUser.id && t.status === 'archived');

  const openPoolTasks = sortPoolTasksByDeadline(tasks.filter((t) => t.status === 'open_pool'));

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
    const completedFirstTime = tasks.filter(
      (t) =>
        (t.status === 'archived' || t.status === 'pending_validation') &&
        t.assigneeId === u.id &&
        !t.handoverFromName &&
        (!Array.isArray(t.handoverHistory) || t.handoverHistory.length === 0)
    ).length;

    const rescuedHandovers = tasks.filter(
      (t) =>
        (t.status === 'archived' || t.status === 'pending_validation') &&
        t.assigneeId === u.id &&
        (Boolean(t.handoverFromName) || (Array.isArray(t.handoverHistory) && t.handoverHistory.length > 0)) &&
        !didUserHandOverTask(t, u)
    ).length;

    const handedOverCount = tasks.filter((t) => didUserHandOverTask(t, u)).length;

    const currentlyUncompleted = tasks.filter(
      (t) => t.status === 'active' && t.assigneeId === u.id
    ).length;

    return {
      user: u,
      completedFirstTime,
      rescuedHandovers,
      handedOverCount,
      currentlyUncompleted
    };
  });

  const performanceReviewTasks = tasks.filter((t) => {
    const isUncompletedActive = t.status === 'active' || t.status === 'open_pool';
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
      ? `GROCERY PERFORMANCE & HANDOVER REVIEW — ${selectedUserObj.name.toUpperCase()}`
      : `GROCERY TEAM PERFORMANCE & UNCOMPLETED/HANDOVER SUMMARY`;

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
      const dueStr = t.dueDate ? ` [Complete By: ${t.dueDate}]` : '';
      const statusLabel =
        t.status === 'open_pool'
          ? `Unclaimed in Open Task Pool`
          : t.status === 'archived'
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

      lines.push(`${idx + 1}. [${createdDate}] ${t.title}${dueStr} — ${statusLabel}`);
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
    const mgrPhotos = getTaskManagerPhotos(t);
    const dueBadge = getDueDateBadgeInfo(t.dueDate);

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
              {dueBadge && (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${dueBadge.className}`}>
                  {dueBadge.label}
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
              {t.claimedFromPoolBy && (
                <span className="px-2 py-0.5 bg-violet-100 text-violet-800 rounded text-[10px] font-semibold">
                  Claimed by {t.claimedFromPoolBy}
                </span>
              )}
              {t.handoverFromName && (
                <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded text-[10px] font-semibold">
                  Started by {t.handoverFromName}
                </span>
              )}
              {t.createdById === 'system-auto' && (
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-semibold">
                  Shift Routine
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
            {mgrPhotos.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {mgrPhotos.map((imgUrl, idx) => (
                  <img
                    key={idx}
                    src={imgUrl}
                    alt={`Reference ${idx + 1}`}
                    onClick={() => { setLightboxTitle(`Reference Photo ${idx + 1} of ${mgrPhotos.length}`); setLightboxImage(imgUrl); }}
                    className="h-14 w-20 object-cover rounded-lg border border-slate-300 cursor-pointer hover:opacity-90"
                  />
                ))}
              </div>
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
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 text-slate-800 flex flex-col font-sans">
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 max-w-[90vw]">
          <div className="bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center space-x-3 border border-slate-800">
            <Sparkles className="w-5 h-5 text-indigo-400 shrink-0"/>
            <div className="min-w-0">
              <h4 className="text-xs font-semibold truncate">{toast.title}</h4>
              <p className="text-xs text-slate-300 break-words">{toast.message}</p>
            </div>
          </div>
        </div>
      )}

      {lightboxImage && (
        <div
          onClick={() => { setLightboxImage(null); setLightboxTitle(''); }}
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 cursor-pointer">
          {lightboxTitle && (
            <div className="mb-4 px-4 py-1.5 rounded-full bg-white text-slate-900 font-bold text-sm text-center">
              {lightboxTitle}
            </div>
          )}
          <div className="bg-white p-4 rounded-3xl shadow-2xl max-w-full">
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
                  <label key={col.id} className="flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs hover:bg-slate-50">
                    <div className="flex items-center space-x-2.5">
                      <input
                        type="checkbox"
                        checked={delegateTargetIds.includes(col.id)}
                        onChange={() => toggleDelegateTarget(col.id)}
                      />
                      <span className="font-semibold">{col.name}</span>
                    </div>
                    {isUserOnShiftToday(col) && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">On Shift</span>
                    )}
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
              <h3 className="font-bold text-slate-900 text-base">Complete Task & Attach Proof Photos</h3>
              <button onClick={() => { setCompletingTask(null); setCompletionPhotos([]); }}><X className="w-5 h-5 text-slate-400"/></button>
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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600 uppercase">
                    Proof Photos ({completionPhotos.length}/6)
                  </span>
                  {completionPhotos.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCompletionPhotos([])}
                      className="text-[11px] font-semibold text-rose-600">
                      Clear All
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center justify-center space-x-1.5 py-2.5 px-3 border-2 border-dashed border-indigo-300 bg-indigo-50/40 hover:bg-indigo-50 rounded-xl cursor-pointer text-indigo-700">
                    <Camera className="w-4 h-4 shrink-0"/>
                    <span className="text-xs font-bold">Snap Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => handleMultiPhotoUpload(e, completionPhotos, setCompletionPhotos)}
                      className="hidden"
                    />
                  </label>
                  <label className="flex items-center justify-center space-x-1.5 py-2.5 px-3 border-2 border-dashed border-slate-300 hover:bg-slate-50 rounded-xl cursor-pointer text-slate-700">
                    <Plus className="w-4 h-4 shrink-0"/>
                    <span className="text-xs font-bold">Pick Multiple</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleMultiPhotoUpload(e, completionPhotos, setCompletionPhotos)}
                      className="hidden"
                    />
                  </label>
                </div>

                {completionPhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {completionPhotos.map((imgUrl, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={imgUrl}
                          alt={`Proof ${idx + 1}`}
                          onClick={() => { setLightboxTitle(`Proof Photo ${idx + 1}`); setLightboxImage(imgUrl); }}
                          className="h-20 w-full object-cover rounded-xl border border-slate-200 cursor-pointer"
                        />
                        <button
                          type="button"
                          onClick={() => removePhotoFromList(idx, setCompletionPhotos)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold shadow">
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setCompletingTask(null); setCompletionPhotos([]); }}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold">
                  Submit for Validation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Top Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shrink-0">
              <Layers className="w-5 h-5"/>
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-sm sm:text-base text-slate-900 leading-tight truncate">Grocery Task Manager</h1>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium capitalize truncate">
                {currentUser.name} • {currentUser.role === 'manager' ? 'Grocery Manager' : (currentUser.role || 'colleague').replace('_', ' ')} • {todayDayCode}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            <button
              onClick={handleEnableLockScreenAlerts}
              className={`px-2 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 ${
                fcmEnabled ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-100 text-amber-900'
              }`}>
              <BellRing className="w-3.5 h-3.5"/>
              <span className="hidden md:inline">{fcmEnabled ? 'Lock Push Active' : 'Enable Lock Alerts'}</span>
            </button>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`px-2 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 ${
                soundEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
              }`}>
              {soundEnabled ? <Volume2 className="w-4 h-4"/> : <VolumeX className="w-4 h-4"/>}
            </button>

            <button
              onClick={() => { setSelfNewPin(currentUser.pin || '1234'); setShowPinModal(true); }}
              className="px-2 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold flex items-center space-x-1">
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
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 space-y-3">
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

            <button onClick={handleLogout} className="px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-600 text-xs font-semibold flex items-center space-x-1">
              <LogOut className="w-3.5 h-3.5"/>
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex space-x-2 border-t border-slate-100 py-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 ${
              activeTab === 'tasks' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}>
            {isSupervisor ? `Task Board (Pool: ${openPoolTasks.length})` : 'My Assigned Tasks'}
          </button>

          {currentUser.role === 'team_leader' && (
            <button
              onClick={() => setActiveTab('my_tl_tasks')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shrink-0 ${
                activeTab === 'my_tl_tasks' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}>
              <span>My Claimed & Manager Tasks ({myAssignedTasks.length})</span>
            </button>
          )}

          {/* NEW TAB FOR GROCERY MANAGER: STANDING TASKS & QUICK-SELECT PRESETS */}
          {isManager && (
            <button
              onClick={() => setActiveTab('standing_tasks')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shrink-0 ${
                activeTab === 'standing_tasks' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}>
              <Sparkles className="w-3.5 h-3.5"/>
              <span>Standing Tasks & Presets</span>
            </button>
          )}

          {isManager && (
            <button
              onClick={() => setActiveTab('performance')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shrink-0 ${
                activeTab === 'performance' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}>
              <BarChart3 className="w-3.5 h-3.5"/>
              <span>Performance Review</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('requests')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shrink-0 ${
              activeTab === 'requests' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}>
            <Calendar className="w-3.5 h-3.5"/>
            <span>{isSupervisor ? `Holiday & Requests (${pendingRequestsCount})` : 'Holiday & Requests'}</span>
          </button>

          <button
            onClick={() => setActiveTab('seasonal')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shrink-0 ${
              activeTab === 'seasonal' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}>
            <Clock className="w-3.5 h-3.5"/>
            <span>Seasonal Availability</span>
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-8 overflow-x-hidden">
        {/* ================= SUPERVISOR DASHBOARD WITH OPEN POOL & COLLAPSIBLE CARDS ================= */}
        {activeTab === 'tasks' && isSupervisor && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 h-fit space-y-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Plus className="w-4 h-4"/>
                  </div>
                  <h2 className="font-bold text-slate-800 text-base">Create / Drop Task</h2>
                </div>
                <button
                  type="button"
                  onClick={() => handleRunDailyStandingTasks(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] flex items-center space-x-1 shrink-0">
                  <Sparkles className="w-3.5 h-3.5"/>
                  <span>Drop {todayDayCode} Routine</span>
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-600 uppercase">Assignment Destination</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPoolTaskMode(false)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        !isPoolTaskMode
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                      Assign to Staff
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPoolTaskMode(true)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        isPoolTaskMode
                          ? 'bg-violet-600 text-white border-violet-600'
                          : 'bg-violet-50 text-violet-700 border-violet-200'
                      }`}>
                      Open Task Pool (TLs Claim)
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-600 uppercase">Quick Task Preset</label>
                    {isManager && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('standing_tasks')}
                        className="text-[11px] font-semibold text-indigo-600 hover:underline">
                        + Manage Presets
                      </button>
                    )}
                  </div>
                  <select
                    value={selectedPreset}
                    onChange={(e) => handleSelectPreset(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 font-medium">
                    {allTaskPresets.map((preset) => (
                      <option key={preset.id} value={preset.id}>{preset.label}</option>
                    ))}
                  </select>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {allTaskPresets.filter((p) => p.id !== 'custom').map((preset) => (
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Priority Level</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setTaskPriority('standard')}
                        className={`py-2 px-2 rounded-xl text-xs font-semibold border flex items-center justify-center space-x-1 ${
                          taskPriority === 'standard' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                        <span>Standard</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTaskPriority('urgent')}
                        className={`py-2 px-2 rounded-xl text-xs font-semibold border flex items-center justify-center space-x-1 ${
                          taskPriority === 'urgent' ? 'bg-rose-600 text-white border-rose-600' : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                        <Flame className="w-3 h-3"/>
                        <span>Priority</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                      Complete By {isPoolTaskMode ? '(Required)' : '(Optional)'}
                    </label>
                    <input
                      type="date"
                      required={isPoolTaskMode}
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Task Title</label>
                  <input
                    type="text"
                    required
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="e.g. Relay Aisle 7 Modular / End-of-Month Deep Clean"
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

                {!isPoolTaskMode ? (
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
                        onClick={() => setTaskAssigneeIds(onShiftTodayUsers.map((u) => u.id))}
                        className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                        On Shift Today ({onShiftTodayUsers.length})
                      </button>
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
                      {assignableUsers.map((m) => {
                        const onShift = isUserOnShiftToday(m);
                        const onHoliday = isUserOnApprovedHoliday(m.id, todayIsoDate);
                        return (
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
                            <div className="flex items-center space-x-1">
                              {onHoliday && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">Holiday</span>
                              )}
                              {onShift && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">On Shift</span>
                              )}
                              <span className="text-[10px] text-slate-400 capitalize">{(m.role || '').replace('_', ' ')}</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-violet-50 border border-violet-200 text-xs text-violet-900 space-y-1">
                    <p className="font-bold">Open Task Pool Mode Active</p>
                    <p className="text-[11px] text-violet-700">
                      This job will sit in the Team Leader Open Pool sorted by its Complete By date until a Team Leader claims it for themselves or delegates it to a colleague.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600 uppercase">
                      Reference Photos ({taskPhotos.length}/6)
                    </span>
                    {taskPhotos.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setTaskPhotos([])}
                        className="text-[11px] font-semibold text-rose-600">
                        Clear Photos
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center justify-center space-x-1.5 py-2 px-3 border border-dashed border-indigo-300 bg-indigo-50/30 rounded-xl cursor-pointer hover:bg-indigo-50">
                      <Camera className="w-4 h-4 text-indigo-600 shrink-0"/>
                      <span className="text-xs font-semibold text-indigo-700">Snap Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => handleMultiPhotoUpload(e, taskPhotos, setTaskPhotos)}
                        className="hidden"
                      />
                    </label>
                    <label className="flex items-center justify-center space-x-1.5 py-2 px-3 border border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50">
                      <Plus className="w-4 h-4 text-slate-600 shrink-0"/>
                      <span className="text-xs font-semibold text-slate-600">Pick Multiple</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleMultiPhotoUpload(e, taskPhotos, setTaskPhotos)}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {taskPhotos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {taskPhotos.map((imgUrl, idx) => (
                        <div key={idx} className="relative">
                          <img
                            src={imgUrl}
                            alt={`Ref ${idx + 1}`}
                            onClick={() => { setLightboxTitle(`Reference Photo ${idx + 1}`); setLightboxImage(imgUrl); }}
                            className="h-16 w-full object-cover rounded-lg border border-slate-200 cursor-pointer"
                          />
                          <button
                            type="button"
                            onClick={() => removePhotoFromList(idx, setTaskPhotos)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold">
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className={`w-full py-3 px-4 text-white font-semibold rounded-xl text-sm shadow-md flex items-center justify-center space-x-2 ${
                    isPoolTaskMode
                      ? 'bg-violet-600 hover:bg-violet-700'
                      : taskPriority === 'urgent'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}>
                  <Plus className="w-4 h-4"/>
                  <span>{isPoolTaskMode ? 'Drop into Open Task Pool' : 'Drop Task onto List'}</span>
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 space-y-4">
              {/* 0. COLLAPSIBLE CARD: WEEKLY / MONTHLY OPEN TASK POOL */}
              <div className="bg-white rounded-2xl border-2 border-violet-300 overflow-hidden shadow-xs">
                <button
                  type="button"
                  onClick={() => toggleSection('taskPool')}
                  className="w-full p-4 bg-violet-50/90 hover:bg-violet-100/70 flex items-center justify-between text-left transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0">
                      <Layers className="w-5 h-5"/>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Weekly / Monthly Open Task Pool — Unclaimed</h3>
                      <p className="text-[11px] text-violet-800">
                        Visible to Grocery Manager & Team Leaders only • Claim or assign by the deadline
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded-full bg-violet-200 text-violet-900 font-bold text-xs">
                      {openPoolTasks.length}
                    </span>
                    {openSections.taskPool ? <ChevronUp className="w-5 h-5 text-violet-800"/> : <ChevronDown className="w-5 h-5 text-violet-800"/>}
                  </div>
                </button>
                {openSections.taskPool && (
                  <div className="p-4 space-y-3 bg-white">
                    {openPoolTasks.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-4">
                        No unclaimed jobs in the Open Task Pool right now.
                      </p>
                    ) : (
                      openPoolTasks.map((pt) => {
                        const dueBadge = getDueDateBadgeInfo(pt.dueDate);
                        const mgrPhotos = getTaskManagerPhotos(pt);
                        return (
                          <div
                            key={pt.id}
                            className={`p-4 rounded-xl border text-xs space-y-3 shadow-xs ${
                              dueBadge?.isOverdue
                                ? 'border-rose-400 bg-rose-50/20'
                                : 'border-violet-200 bg-violet-50/20'
                            }`}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="px-2 py-0.5 bg-violet-600 text-white rounded text-[10px] font-bold uppercase">
                                    Open Pool
                                  </span>
                                  {pt.priority === 'urgent' && (
                                    <span className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold uppercase flex items-center space-x-1">
                                      <Flame className="w-2.5 h-2.5"/>
                                      <span>Priority</span>
                                    </span>
                                  )}
                                  {dueBadge && (
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${dueBadge.className}`}>
                                      {dueBadge.label}
                                    </span>
                                  )}
                                  <span className="text-[10px] text-slate-400">
                                    Added by {pt.createdByName || 'Manager'}
                                  </span>
                                </div>
                                <h4 className="font-bold text-slate-900 text-sm pt-0.5">{pt.title}</h4>
                                <p className="text-slate-600 text-xs whitespace-pre-line">{pt.description}</p>
                                {mgrPhotos.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 pt-1">
                                    {mgrPhotos.map((imgUrl, idx) => (
                                      <img
                                        key={idx}
                                        src={imgUrl}
                                        alt={`Pool Ref ${idx + 1}`}
                                        onClick={() => { setLightboxTitle(`Pool Task Photo ${idx + 1}`); setLightboxImage(imgUrl); }}
                                        className="h-14 w-20 object-cover rounded-lg border border-slate-300 cursor-pointer"
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => handleDeleteTask(pt)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50">
                                <Trash2 className="w-4 h-4"/>
                              </button>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-violet-200/60">
                              <button
                                type="button"
                                onClick={() => handleClaimPoolTask(pt, currentUser.id)}
                                className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-xs">
                                <Check className="w-3.5 h-3.5"/>
                                <span>Claim for Myself ({currentUser.name})</span>
                              </button>

                              <div className="flex items-center space-x-1.5">
                                <span className="text-[11px] font-semibold text-slate-600">Or Claim & Assign:</span>
                                <select
                                  defaultValue=""
                                  onChange={(e) => {
                                    if (e.target.value) handleClaimPoolTask(pt, e.target.value);
                                  }}
                                  className="text-xs bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800 font-semibold">
                                  <option value="" disabled>Pick Colleague...</option>
                                  {assignableUsers.map((u) => (
                                    <option key={u.id} value={u.id}>
                                      {u.name} {isUserOnShiftToday(u) ? '(On Shift)' : ''}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* 1. COLLAPSIBLE CARD: WAITING TO BE REASSIGNED / PAUSED */}
              <div className="bg-white rounded-2xl border-2 border-orange-200 overflow-hidden shadow-xs">
                <button
                  type="button"
                  onClick={() => toggleSection('reassigned')}
                  className="w-full p-4 bg-orange-50/80 hover:bg-orange-100/70 flex items-center justify-between text-left transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0">
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
                    <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
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
                      allPendingTasks.map((t) => {
                        const proofPhotos = getTaskCompletionPhotos(t);
                        return (
                          <div key={t.id} className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[11px] font-bold">
                                    Completed by {t.assigneeName}
                                  </span>
                                  {t.claimedFromPoolBy && (
                                    <span className="px-2 py-0.5 bg-violet-100 text-violet-800 rounded text-[10px] font-semibold">
                                      Claimed by {t.claimedFromPoolBy}
                                    </span>
                                  )}
                                  {t.handoverFromName && (
                                    <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded text-[11px] font-semibold">
                                      Started by {t.handoverFromName}
                                    </span>
                                  )}
                                  {proofPhotos.length > 0 && (
                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                                      {proofPhotos.length} Photo{proofPhotos.length === 1 ? '' : 's'}
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
                            {proofPhotos.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {proofPhotos.map((imgUrl, idx) => (
                                  <img
                                    key={idx}
                                    src={imgUrl}
                                    alt={`Proof ${idx + 1}`}
                                    onClick={() => { setLightboxTitle(`Completion Proof ${idx + 1} of ${proofPhotos.length}`); setLightboxImage(imgUrl); }}
                                    className="h-24 w-32 object-cover rounded-xl border-2 border-emerald-500 cursor-pointer hover:opacity-90"
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* 3. COLLAPSIBLE CARD: IN PROGRESS */}
              <div className="bg-white rounded-2xl border border-blue-200 overflow-hidden shadow-xs">
                <button
                  type="button"
                  onClick={() => toggleSection('inProgress')}
                  className="w-full p-4 bg-blue-50/70 hover:bg-blue-100/60 flex items-center justify-between text-left transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
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

              {/* 4. COLLAPSIBLE CARD: ALLOCATED TASKS */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <button
                  type="button"
                  onClick={() => toggleSection('allocated')}
                  className="w-full p-4 bg-slate-100/80 hover:bg-slate-200/60 flex items-center justify-between text-left transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-700 text-white flex items-center justify-center shrink-0">
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

              {/* 5. COLLAPSIBLE CARD: VALIDATED & ARCHIVED */}
              <div className="bg-white rounded-2xl border border-emerald-200 overflow-hidden shadow-xs">
                <button
                  type="button"
                  onClick={() => toggleSection('archive')}
                  className="w-full p-4 bg-emerald-50/70 hover:bg-emerald-100/60 flex items-center justify-between text-left transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Archive className="w-5 h-5"/>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Validated & Archived History</h3>
                      <p className="text-[11px] text-emerald-800">Completed and signed-off Grocery tasks</p>
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
                        {allArchivedTasks.map((t) => {
                          const proofPhotos = getTaskCompletionPhotos(t);
                          return (
                            <div key={t.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                              <div>
                                <p className="font-bold text-slate-800">{t.title}</p>
                                <p className="text-slate-500">
                                  Completed by {t.assigneeName}
                                  {t.claimedFromPoolBy ? ` (Pool Claim: ${t.claimedFromPoolBy})` : ''}
                                  {t.handoverFromName ? ` (Started by ${t.handoverFromName})` : ''}
                                </p>
                              </div>
                              <div className="text-right space-y-1">
                                {proofPhotos.length > 0 && (
                                  <div className="flex justify-end gap-1">
                                    {proofPhotos.map((imgUrl, idx) => (
                                      <button
                                        key={idx}
                                        onClick={() => { setLightboxTitle(`Archived Proof ${idx + 1}`); setLightboxImage(imgUrl); }}
                                        className="px-2 py-0.5 bg-indigo-50 text-indigo-600 font-semibold rounded text-[10px]">
                                        Photo {idx + 1}
                                      </button>
                                    ))}
                                  </div>
                                )}
                                <span className="text-[11px] text-emerald-600 font-medium block">
                                  Signed off by {t.validatedByName || 'Manager'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= NEW TAB: STANDING TASKS & QUICK-SELECT PRESETS (MANAGER ONLY) ================= */}
        {activeTab === 'standing_tasks' && isManager && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Create or Edit Quick-Select Preset */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 h-fit space-y-5 shadow-xs">
              <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5"/>
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-base">
                    {editingPresetId ? 'Edit Quick-Select Preset' : 'Create Quick-Select Task'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    New presets appear in your Quick-Select buttons and Standing Shift Task toggles
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveCustomPreset} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Short Button Label
                  </label>
                  <input
                    type="text"
                    required
                    value={newPresetLabel}
                    onChange={(e) => setNewPresetLabel(e.target.value)}
                    placeholder="e.g. Beer & Wine / Pet Food / Price Changes"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Full Task Title
                  </label>
                  <input
                    type="text"
                    required
                    value={newPresetTitle}
                    onChange={(e) => setNewPresetTitle(e.target.value)}
                    placeholder="e.g. Beer, Wine & Spirits Replenishment"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Standard Expectations
                  </label>
                  <textarea
                    rows="4"
                    required
                    value={newPresetDesc}
                    onChange={(e) => setNewPresetDesc(e.target.value)}
                    placeholder="Describe what needs doing and photo proof expectations..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>

                <div className="flex gap-2">
                  {editingPresetId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPresetId(null);
                        setNewPresetLabel('');
                        setNewPresetTitle('');
                        setNewPresetDesc('');
                      }}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 text-xs font-semibold">
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-md">
                    {editingPresetId ? 'Update Preset' : 'Save New Quick-Select Preset'}
                  </button>
                </div>
              </form>

              {/* List of All Quick-Select Presets */}
              <div className="pt-4 border-t border-slate-100 space-y-2.5">
                <span className="text-xs font-bold uppercase text-slate-500 block">
                  Active Quick-Select Presets ({allTaskPresets.filter((p) => p.id !== 'custom').length})
                </span>
                <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                  {allTaskPresets
                    .filter((p) => p.id !== 'custom')
                    .map((p) => (
                      <div key={p.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900">{p.label}</span>
                          {!p.isBuiltIn ? (
                            <div className="flex items-center space-x-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPresetId(p.id);
                                  setNewPresetLabel(p.label);
                                  setNewPresetTitle(p.title);
                                  setNewPresetDesc(p.description);
                                }}
                                className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded font-semibold text-[10px]">
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCustomPreset(p.id)}
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded">
                                <Trash2 className="w-3.5 h-3.5"/>
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">Built-in</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2">{p.description}</p>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Right 2 Columns: Colleague Standing Shift Tasks Matrix */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 space-y-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="font-bold text-slate-900 text-base">Colleague Standing Shift Tasks & Contracted Days</h2>
                  <p className="text-xs text-slate-500">
                    Tap any day or task pill below to toggle what each colleague automatically receives when on shift
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRunDailyStandingTasks(true)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1.5 shrink-0 w-fit shadow-xs">
                  <Sparkles className="w-4 h-4"/>
                  <span>Drop Today's ({todayDayCode}) Standing Tasks</span>
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {teamUsers.map((u) => {
                  const userDays = Array.isArray(u.contractedDays) ? u.contractedDays : [];
                  const userPresets = Array.isArray(u.defaultPresets) ? u.defaultPresets : [];
                  const onShift = isUserOnShiftToday(u);

                  return (
                    <div key={u.id} className="py-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <div className={`w-8 h-8 rounded-lg ${u.color || 'bg-indigo-600'} text-white font-bold flex items-center justify-center text-xs`}>
                            {(u.name || 'U')[0]}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-slate-900">{u.name}</h4>
                            <p className="text-[11px] text-slate-500 capitalize">
                              {u.role === 'manager' ? 'Grocery Manager' : (u.role || '').replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                        {onShift && (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            On Shift Today ({todayDayCode})
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Contracted Days (Tap to Toggle):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {WEEK_DAYS.map((day) => {
                            const active = userDays.includes(day);
                            return (
                              <button
                                key={day}
                                type="button"
                                onClick={() => handleQuickToggleUserContractedDay(u, day)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                                  active
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                                }`}>
                                {day}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Standing Tasks Auto-Sent on Shift Days (Tap to Toggle):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {allTaskPresets
                            .filter((p) => p.id !== 'custom')
                            .map((preset) => {
                              const active = userPresets.includes(preset.id);
                              return (
                                <button
                                  key={preset.id}
                                  type="button"
                                  onClick={() => handleQuickToggleUserStandingPreset(u, preset.id)}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                                    active
                                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                  }`}>
                                  {preset.label}
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
                    <BarChart3 className="w-5 h-5"/>
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 text-base">Grocery Performance & Handover Review</h2>
                    <p className="text-xs text-slate-500">
                      Tracks uncompleted jobs, Open Pool deadlines, and shift handovers. Routine pauses that the colleague resumes and finishes themselves count as Completed First-Time.
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
                              {(m.user.name || 'U')[0]}
                            </div>
                            <div className="truncate">
                              <h4 className="font-bold text-slate-900 text-xs truncate">{m.user.name}</h4>
                              <p className="text-[10px] text-slate-500 capitalize">{(m.user.role || '').replace('_', ' ')}</p>
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
                    const dueBadge = getDueDateBadgeInfo(t.dueDate);

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
                              {dueBadge && (
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${dueBadge.className}`}>
                                  {dueBadge.label}
                                </span>
                              )}
                              {t.status === 'open_pool' ? (
                                <span className="px-2 py-0.5 bg-violet-100 text-violet-800 rounded text-[10px] font-bold">
                                  Unclaimed in Open Task Pool
                                </span>
                              ) : isCompletedNow ? (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                                  Eventually Completed by {t.assigneeName}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded text-[10px] font-bold">
                                  Still Unfinished • Assigned to {t.assigneeName} ({(t.progressStatus || 'not_started').replace('_', ' ')})
                                </span>
                              )}
                              {t.claimedFromPoolBy && (
                                <span className="px-2 py-0.5 bg-violet-50 text-violet-700 rounded text-[10px] font-semibold">
                                  Pool Claimed by {t.claimedFromPoolBy}
                                </span>
                              )}
                              <span className="text-[11px] text-slate-400">
                                Created {t.createdAt ? new Date(t.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : ''}
                              </span>
                            </div>
                            <h4 className="font-bold text-slate-900 text-sm">{t.title}</h4>
                            <p className="text-slate-600">{t.description}</p>
                          </div>
                        </div>

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
                      {currentUser.role === 'team_leader' ? 'My Claimed Pool Tasks & Manager Tasks' : 'My Active Tasks'}
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
                      const mgrPhotos = getTaskManagerPhotos(t);
                      const dueBadge = getDueDateBadgeInfo(t.dueDate);

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
                                {dueBadge && (
                                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${dueBadge.className}`}>
                                    {dueBadge.label}
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
                                  <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[11px] font-semibold">
                                    Not Started
                                  </span>
                                )}
                                {t.claimedFromPoolBy && (
                                  <span className="px-2 py-0.5 bg-violet-100 text-violet-800 rounded-md text-[11px] font-semibold">
                                    Claimed from Pool ({t.claimedFromPoolBy})
                                  </span>
                                )}
                                {t.handoverFromName && (
                                  <span className="px-2.5 py-0.5 bg-orange-100 text-orange-800 rounded-md text-[11px] font-semibold">
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
                              {mgrPhotos.length > 0 && (
                                <div className="pt-1 space-y-1">
                                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                                    Reference Photos ({mgrPhotos.length}) — Tap to Zoom
                                  </span>
                                  <div className="flex flex-wrap gap-2">
                                    {mgrPhotos.map((imgUrl, idx) => (
                                      <img
                                        key={idx}
                                        src={imgUrl}
                                        alt={`Ref ${idx + 1}`}
                                        onClick={() => { setLightboxTitle(`Reference Photo ${idx + 1}`); setLightboxImage(imgUrl); }}
                                        className="h-16 w-24 object-cover rounded-lg border border-slate-300 cursor-pointer"
                                      />
                                    ))}
                                  </div>
                                </div>
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
                                onClick={() => { setCompletingTask(t); setCompletionPhotos([]); setCompletionNote(''); }}
                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs flex items-center space-x-2">
                                <Camera className="w-4 h-4"/>
                                <span>Complete & Add Photos</span>
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

        {/* ================= REQUESTS TAB & MOBILE HOLIDAY CALENDAR ================= */}
        {activeTab === 'requests' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 h-fit space-y-4 shadow-xs">
              <h2 className="font-bold text-slate-900 text-base">
                {isSupervisor ? 'Submit or Log Colleague Holiday' : 'Submit Holiday or Request'}
              </h2>
              <form onSubmit={handleCreateRequest} className="space-y-4">
                {/* Supervisor Manual Holiday Entry Selector */}
                {isSupervisor && (
                  <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-indigo-950 uppercase mb-1">
                        Logging Request / Holiday For:
                      </label>
                      <select
                        value={reqTargetUserId || currentUser.id}
                        onChange={(e) => setReqTargetUserId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-indigo-300 text-xs bg-white font-bold text-slate-900">
                        <option value={currentUser.id}>Myself ({currentUser.name})</option>
                        {teamUsers
                          .filter((u) => u.id !== currentUser.id)
                          .map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.role.replace('_', ' ')})
                            </option>
                          ))}
                      </select>
                    </div>
                    <label className="flex items-center space-x-2 text-xs font-semibold text-indigo-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reqAutoApprove}
                        onChange={(e) => setReqAutoApprove(e.target.checked)}
                        className="rounded text-indigo-600"
                      />
                      <span>Auto-approve onto calendar immediately</span>
                    </label>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-600 uppercase">Request Type</label>
                  <select
                    value={reqType}
                    onChange={(e) => setReqType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white font-medium">
                    <option value="Time Off / Holiday">Time Off / Holiday</option>
                    <option value="Shift Swap">Shift Swap</option>
                    <option value="Equipment / Uniform">Equipment / Uniform</option>
                    <option value="General Manager Request">General Manager Request</option>
                  </select>
                </div>

                {reqType === 'Time Off / Holiday' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-600 uppercase">Start Date</label>
                      <input
                        type="date"
                        required
                        value={reqStartDate}
                        onChange={(e) => setReqStartDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-600 uppercase">End Date</label>
                      <input
                        type="date"
                        value={reqEndDate}
                        onChange={(e) => setReqEndDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-600 uppercase">Relevant Dates</label>
                    <input
                      type="text"
                      value={reqStartDate}
                      onChange={(e) => setReqStartDate(e.target.value)}
                      placeholder="e.g. Next Tuesday"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-600 uppercase">Details / Reason</label>
                  <textarea
                    rows="3"
                    required
                    value={reqNote}
                    onChange={(e) => setReqNote(e.target.value)}
                    placeholder="Holiday or request details..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-md">
                  {isSupervisor && reqAutoApprove ? 'Log & Approve Holiday' : 'Submit Request & Block Calendar'}
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Grocery Holiday & Availability Calendar</h3>
                    <p className="text-xs text-slate-500">Green = Approved, Amber = Pending, Dark = Blackout</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {isManager && (
                      <button
                        type="button"
                        onClick={() => setManagerBlackoutMode(!managerBlackoutMode)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                          managerBlackoutMode ? 'bg-rose-600 text-white border-rose-600' : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                        {managerBlackoutMode ? 'Blackout Mode ON (Tap Days)' : 'Manage Blackouts'}
                      </button>
                    )}

                    <div className="flex items-center space-x-1 bg-slate-100 rounded-xl p-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(calendarYear - 1); }
                          else { setCalendarMonth(calendarMonth - 1); }
                        }}
                        className="px-2.5 py-1 hover:bg-white rounded-lg text-slate-700 font-bold text-xs">
                        Prev
                      </button>
                      <span className="px-2 text-xs font-bold text-slate-800">
                        {MONTH_NAMES[calendarMonth]} {calendarYear}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(calendarYear + 1); }
                          else { setCalendarMonth(calendarMonth + 1); }
                        }}
                        className="px-2.5 py-1 hover:bg-white rounded-lg text-slate-700 font-bold text-xs">
                        Next
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] sm:text-[11px] text-slate-400 uppercase">
                  {WEEK_DAYS.map((d) => <div key={d} className="py-1">{d}</div>)}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: (new Date(calendarYear, calendarMonth, 1).getDay() + 6) % 7 }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-16 sm:h-24 bg-slate-50/40 rounded-xl border border-transparent"></div>
                  ))}

                  {(() => {
                    const days = [];
                    const date = new Date(calendarYear, calendarMonth, 1);
                    while (date.getMonth() === calendarMonth) {
                      days.push(new Date(date));
                      date.setDate(date.getDate() + 1);
                    }

                    const holidayMap = {};
                    requests.forEach((req) => {
                      if (req.type === 'Time Off / Holiday' && (req.status === 'approved' || req.status === 'pending')) {
                        const datesArr = getDatesInRange(req.startDate || req.dates, req.endDate || req.startDate || req.dates);
                        datesArr.forEach((dStr) => {
                          if (!holidayMap[dStr]) holidayMap[dStr] = [];
                          holidayMap[dStr].push({
                            name: req.requesterName,
                            status: req.status
                          });
                        });
                      }
                    });

                    return days.map((dateObj) => {
                      const y = dateObj.getFullYear();
                      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                      const d = String(dateObj.getDate()).padStart(2, '0');
                      const dateStr = `${y}-${m}-${d}`;
                      const dayHolidays = holidayMap[dateStr] || [];
                      const isBlackedOut = Boolean(blackoutDates[dateStr]);
                      const isSelected = selectedCalendarDay === dateStr;

                      return (
                        <div
                          key={dateStr}
                          onClick={() => {
                            if (managerBlackoutMode) {
                              handleToggleBlackoutDate(dateStr);
                            } else {
                              setSelectedCalendarDay(dateStr);
                              if (!reqStartDate) setReqStartDate(dateStr);
                              else if (!reqEndDate && dateStr >= reqStartDate) setReqEndDate(dateStr);
                            }
                          }}
                          className={`h-16 sm:h-24 p-1 sm:p-1.5 rounded-xl border flex flex-col justify-between cursor-pointer transition-all overflow-hidden ${
                            isBlackedOut
                              ? 'bg-slate-900 text-white border-slate-900'
                              : isSelected
                              ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20'
                              : 'bg-white hover:bg-slate-50 border-slate-200'
                          }`}>
                          <div className="flex items-center justify-between">
                            <span className={`text-[11px] sm:text-xs font-bold ${isBlackedOut ? 'text-white' : 'text-slate-800'}`}>
                              {dateObj.getDate()}
                            </span>
                            {isBlackedOut && <span className="text-[8px] bg-rose-600 text-white px-1 rounded">Block</span>}
                          </div>

                          <div className="space-y-0.5 overflow-y-auto max-h-10 sm:max-h-14">
                            {dayHolidays.map((h, idx) => (
                              <div
                                key={idx}
                                className={`px-1 py-0.5 rounded text-[8px] sm:text-[9px] font-bold truncate ${
                                  h.status === 'approved'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'bg-amber-100 text-amber-900 border border-amber-200'
                                }`}>
                                {h.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                {selectedCalendarDay && (
                  <div className="p-4 bg-indigo-50/70 rounded-xl border border-indigo-200 text-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-indigo-900 text-sm">Selected Date: {selectedCalendarDay}</span>
                        {blackoutDates[selectedCalendarDay] && (
                          <span className="ml-2 px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold">
                            Management Blackout Active
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedCalendarDay(null)}
                        className="text-slate-400 hover:text-slate-700 font-bold px-2 py-1">
                        ✕
                      </button>
                    </div>

                    {(() => {
                      const dayReqs = requests.filter(
                        (r) =>
                          r.type === 'Time Off / Holiday' &&
                          (r.status === 'approved' || r.status === 'pending') &&
                          getDatesInRange(r.startDate || r.dates, r.endDate || r.startDate || r.dates).includes(selectedCalendarDay)
                      );
                      if (dayReqs.length === 0) {
                        return (
                          <p className="text-slate-600 italic">
                            No staff booked off on this day.
                          </p>
                        );
                      }
                      return (
                        <div className="space-y-1.5 pt-1">
                          {dayReqs.map((r) => (
                            <div
                              key={r.id}
                              className="p-2.5 rounded-xl bg-white border border-indigo-200/80 flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <span className="font-bold text-slate-900">{r.requesterName}</span>
                                <span className="text-slate-500 ml-1.5">
                                  ({r.dates || r.startDate})
                                </span>
                                <span
                                  className={`ml-2 px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                                    r.status === 'approved'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-amber-100 text-amber-900'
                                  }`}>
                                  {r.status}
                                </span>
                                {r.note && <p className="text-[11px] text-slate-600 mt-0.5">Note: "{r.note}"</p>}
                              </div>

                              {isSupervisor && (
                                <div className="flex items-center space-x-1.5">
                                  <button
                                    type="button"
                                    onClick={() => startEditRequest(r)}
                                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-semibold text-[11px]">
                                    Edit Holiday
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSingleRequest(r.id)}
                                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg font-semibold text-[11px] flex items-center space-x-1">
                                    <Trash2 className="w-3 h-3"/>
                                    <span>Delete</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* COLLAPSIBLE ALL TEAM REQUESTS CARD (INDIVIDUAL EDIT & DELETE FOR MANAGER / TEAM LEADER) */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <button
                  type="button"
                  onClick={() => setRequestsListOpen(!requestsListOpen)}
                  className="w-full p-4 bg-slate-100/80 hover:bg-slate-200/60 flex items-center justify-between text-left transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5"/>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        {isSupervisor ? 'All Team Holidays & Requests (Tap to Edit or Delete)' : 'My Submitted Requests'}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {pendingRequestsCount} Pending • {requests.length} Total Logged
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {pendingRequestsCount > 0 && (
                      <span className="px-2.5 py-1 rounded-full bg-amber-200 text-amber-900 font-bold text-xs">
                        {pendingRequestsCount} Pending
                      </span>
                    )}
                    {requestsListOpen ? <ChevronUp className="w-5 h-5 text-slate-600"/> : <ChevronDown className="w-5 h-5 text-slate-600"/>}
                  </div>
                </button>

                {requestsListOpen && (
                  <div className="p-4 sm:p-6 space-y-4 bg-white">
                    <div className="space-y-3">
                      {(isSupervisor ? requests : requests.filter((r) => r.requesterId === currentUser.id)).length === 0 ? (
                        <p className="text-xs text-slate-400 italic text-center py-4">No requests in the list.</p>
                      ) : (
                        (isSupervisor ? requests : requests.filter((r) => r.requesterId === currentUser.id)).map((r) => (
                          <div key={r.id} className="p-4 rounded-xl border border-slate-200 space-y-3 bg-slate-50">
                            {editingRequestId === r.id && isSupervisor ? (
                              <div className="bg-indigo-50/80 p-4 rounded-xl border border-indigo-200 space-y-3">
                                <div className="flex items-center justify-between border-b border-indigo-200 pb-2">
                                  <span className="font-bold text-xs text-indigo-950 uppercase">
                                    Edit Colleague Holiday / Request
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setEditingRequestId(null)}
                                    className="text-slate-400 hover:text-slate-700 text-xs font-bold">
                                    ✕
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                  <div>
                                    <label className="block text-[10px] font-bold uppercase text-indigo-900 mb-1">Colleague</label>
                                    <select
                                      value={editReqTargetUserId}
                                      onChange={(e) => setEditReqTargetUserId(e.target.value)}
                                      className="w-full px-2.5 py-1.5 rounded-lg border border-indigo-200 text-xs bg-white font-semibold">
                                      {teamUsers.map((u) => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                      ))}
                                    </select>
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-bold uppercase text-indigo-900 mb-1">Request Type</label>
                                    <select
                                      value={editReqType}
                                      onChange={(e) => setEditReqType(e.target.value)}
                                      className="w-full px-2.5 py-1.5 rounded-lg border border-indigo-200 text-xs bg-white font-semibold">
                                      <option value="Time Off / Holiday">Time Off / Holiday</option>
                                      <option value="Shift Swap">Shift Swap</option>
                                      <option value="Equipment / Uniform">Equipment / Uniform</option>
                                      <option value="General Manager Request">General Manager Request</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-bold uppercase text-indigo-900 mb-1">Booking Status</label>
                                    <select
                                      value={editReqStatus}
                                      onChange={(e) => setEditReqStatus(e.target.value)}
                                      className="w-full px-2.5 py-1.5 rounded-lg border border-indigo-200 text-xs bg-white font-semibold">
                                      <option value="approved">Approved</option>
                                      <option value="pending">Pending</option>
                                      <option value="declined">Declined</option>
                                    </select>
                                  </div>
                                </div>

                                {editReqType === 'Time Off / Holiday' ? (
                                  <div className="grid grid-cols-2 gap-2.5">
                                    <div>
                                      <label className="block text-[10px] font-bold uppercase text-indigo-900 mb-1">Start Date</label>
                                      <input
                                        type="date"
                                        value={editReqStartDate}
                                        onChange={(e) => setEditReqStartDate(e.target.value)}
                                        className="w-full px-2.5 py-1.5 rounded-lg border border-indigo-200 text-xs bg-white font-semibold"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-bold uppercase text-indigo-900 mb-1">End Date</label>
                                      <input
                                        type="date"
                                        value={editReqEndDate}
                                        onChange={(e) => setEditReqEndDate(e.target.value)}
                                        className="w-full px-2.5 py-1.5 rounded-lg border border-indigo-200 text-xs bg-white font-semibold"
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <label className="block text-[10px] font-bold uppercase text-indigo-900 mb-1">Relevant Dates</label>
                                    <input
                                      type="text"
                                      value={editReqStartDate}
                                      onChange={(e) => setEditReqStartDate(e.target.value)}
                                      className="w-full px-2.5 py-1.5 rounded-lg border border-indigo-200 text-xs bg-white font-semibold"
                                    />
                                  </div>
                                )}

                                <div>
                                  <label className="block text-[10px] font-bold uppercase text-indigo-900 mb-1">Notes / Reason</label>
                                  <input
                                    type="text"
                                    value={editReqNote}
                                    onChange={(e) => setEditReqNote(e.target.value)}
                                    placeholder="Holiday or request note..."
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-indigo-200 text-xs bg-white"
                                  />
                                </div>

                                <div className="flex justify-end space-x-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => setEditingRequestId(null)}
                                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700">
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEditRequest(r.id)}
                                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold">
                                    Save Holiday Changes
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                  <span className="font-bold text-indigo-600">
                                    {r.requesterName} • {r.type} {r.dates ? `(${r.dates})` : ''}
                                  </span>
                                  <div className="flex items-center space-x-2">
                                    <span
                                      className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                                        r.status === 'approved'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : r.status === 'declined'
                                          ? 'bg-rose-100 text-rose-800'
                                          : 'bg-amber-100 text-amber-900'
                                      }`}>
                                      {r.status}
                                    </span>
                                    {isSupervisor && (
                                      <button
                                        type="button"
                                        onClick={() => startEditRequest(r)}
                                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-semibold text-[11px]">
                                        Edit
                                      </button>
                                    )}
                                    {(isSupervisor || r.requesterId === currentUser.id) && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteSingleRequest(r.id)}
                                        className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg font-semibold text-[11px] flex items-center space-x-1">
                                        <Trash2 className="w-3.5 h-3.5"/>
                                        <span>Delete</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <p className="text-xs text-slate-700 bg-white p-3 rounded-lg border">{r.note}</p>
                                {isSupervisor && r.status === 'pending' && (
                                  <div className="flex flex-wrap gap-2 pt-1">
                                    <input
                                      type="text"
                                      value={managerReplyInputs[r.id] || ''}
                                      onChange={(e) => setManagerReplyInputs((prev) => ({ ...prev, [r.id]: e.target.value }))}
                                      placeholder="Reply note..."
                                      className="flex-1 min-w-[140px] px-3 py-1.5 rounded-lg border text-xs bg-white"
                                    />
                                    <button onClick={() => handleDecisionRequest(r, 'approved')} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold">Approve</button>
                                    <button onClick={() => handleDecisionRequest(r, 'declined')} className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold">Decline</button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= SEASONAL AVAILABILITY CALENDAR TAB ================= */}
        {activeTab === 'seasonal' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 h-fit space-y-5 shadow-xs">
              <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5"/>
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-base">Declare Seasonal Availability</h2>
                  <p className="text-xs text-slate-500">Tap any day on the calendar to set your start & finish window</p>
                </div>
              </div>

              <form onSubmit={handleSaveSeasonalAvailability} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Selected Date</label>
                  <input
                    type="date"
                    required
                    value={selectedSeasonalDate}
                    onChange={(e) => setSelectedSeasonalDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-300 bg-indigo-50/40 text-sm font-bold text-indigo-950"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Availability Status</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSeasonalStatus('available')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        seasonalStatus === 'available'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                      Available to Work
                    </button>
                    <button
                      type="button"
                      onClick={() => setSeasonalStatus('unavailable')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        seasonalStatus === 'unavailable'
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                      Unavailable
                    </button>
                  </div>
                </div>

                {seasonalStatus === 'available' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-600 uppercase">Minimum Start Time</label>
                      <input
                        type="time"
                        required
                        value={seasonalMinStart}
                        onChange={(e) => setSeasonalMinStart(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-600 uppercase">Maximum Finish Time</label>
                      <input
                        type="time"
                        required
                        value={seasonalMaxFinish}
                        onChange={(e) => setSeasonalMaxFinish(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Optional Note</label>
                  <input
                    type="text"
                    value={seasonalNote}
                    onChange={(e) => setSeasonalNote(e.target.value)}
                    placeholder="e.g. School run before 9am / Can do overtime"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-md">
                    Save Availability for {selectedSeasonalDate}
                  </button>
                  {seasonalList.some((item) => item.userId === currentUser.id && item.date === selectedSeasonalDate) && (
                    <button
                      type="button"
                      onClick={() => handleClearSeasonalAvailability(currentUser.id, selectedSeasonalDate)}
                      className="px-3.5 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold rounded-xl text-xs">
                      Clear
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      {isSupervisor ? 'Team Seasonal Availability Calendar (All Staff)' : 'My Seasonal Availability Calendar'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {isSupervisor
                        ? 'Supervisors see everyone’s declared start & finish windows. Tap any day to inspect or enter your own.'
                        : 'Tap any date below to enter or update your earliest start and latest finish time.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {isSupervisor && (
                      <select
                        value={seasonalFilterUserId}
                        onChange={(e) => setSeasonalFilterUserId(e.target.value)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50">
                        <option value="all">All Staff ({teamUsers.length})</option>
                        {teamUsers.map((u) => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                    )}

                    <div className="flex items-center space-x-1 bg-slate-100 rounded-xl p-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (seasonalMonth === 0) { setSeasonalMonth(11); setSeasonalYear(seasonalYear - 1); }
                          else { setSeasonalMonth(seasonalMonth - 1); }
                        }}
                        className="px-2.5 py-1 hover:bg-white rounded-lg text-slate-700 font-bold text-xs">
                        Prev
                      </button>
                      <span className="px-2 text-xs font-bold text-slate-800">
                        {MONTH_NAMES[seasonalMonth]} {seasonalYear}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (seasonalMonth === 11) { setSeasonalMonth(0); setSeasonalYear(seasonalYear + 1); }
                          else { setSeasonalMonth(seasonalMonth + 1); }
                        }}
                        className="px-2.5 py-1 hover:bg-white rounded-lg text-slate-700 font-bold text-xs">
                        Next
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] sm:text-[11px] text-slate-400 uppercase">
                  {WEEK_DAYS.map((d) => <div key={d} className="py-1">{d}</div>)}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: (new Date(seasonalYear, seasonalMonth, 1).getDay() + 6) % 7 }).map((_, i) => (
                    <div key={`seasonal-empty-${i}`} className="h-20 sm:h-28 bg-slate-50/40 rounded-xl border border-transparent"></div>
                  ))}

                  {(() => {
                    const days = [];
                    const date = new Date(seasonalYear, seasonalMonth, 1);
                    while (date.getMonth() === seasonalMonth) {
                      days.push(new Date(date));
                      date.setDate(date.getDate() + 1);
                    }

                    const visibleEntries = seasonalList.filter((entry) => {
                      if (!isSupervisor) return entry.userId === currentUser.id;
                      if (seasonalFilterUserId !== 'all') return entry.userId === seasonalFilterUserId;
                      return true;
                    });

                    const availByDate = {};
                    visibleEntries.forEach((entry) => {
                      if (!availByDate[entry.date]) availByDate[entry.date] = [];
                      availByDate[entry.date].push(entry);
                    });

                    return days.map((dateObj) => {
                      const y = dateObj.getFullYear();
                      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                      const d = String(dateObj.getDate()).padStart(2, '0');
                      const dateStr = `${y}-${m}-${d}`;
                      const dayEntries = availByDate[dateStr] || [];
                      const isSelected = selectedSeasonalDate === dateStr;

                      return (
                        <div
                          key={dateStr}
                          onClick={() => setSelectedSeasonalDate(dateStr)}
                          className={`h-20 sm:h-28 p-1 sm:p-1.5 rounded-xl border flex flex-col justify-between cursor-pointer transition-all overflow-hidden ${
                            isSelected
                              ? 'bg-indigo-50/80 border-indigo-600 ring-2 ring-indigo-500/20'
                              : 'bg-white hover:bg-slate-50 border-slate-200'
                          }`}>
                          <div className="flex items-center justify-between">
                            <span className={`text-[11px] sm:text-xs font-bold ${isSelected ? 'text-indigo-700' : 'text-slate-800'}`}>
                              {dateObj.getDate()}
                            </span>
                            {dayEntries.length > 0 && (
                              <span className="text-[9px] px-1 rounded bg-slate-100 text-slate-600 font-bold">
                                {dayEntries.length}
                              </span>
                            )}
                          </div>

                          <div className="space-y-0.5 overflow-y-auto max-h-14 sm:max-h-20">
                            {dayEntries.map((ent) => {
                              const isAvail = ent.status !== 'unavailable';
                              const shortName = (ent.userName || '').split(' ')[0];
                              return (
                                <div
                                  key={ent.id}
                                  className={`px-1 py-0.5 rounded text-[8px] sm:text-[9px] font-bold truncate ${
                                    isAvail
                                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                                  }`}>
                                  {isSupervisor ? `${shortName}: ` : ''}
                                  {isAvail ? `${ent.minStart}-${ent.maxFinish}` : 'Unavail'}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                {selectedSeasonalDate && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                        Availability Breakdown for {selectedSeasonalDate}
                      </h4>
                      <span className="text-[11px] text-slate-500 font-semibold">
                        {isSupervisor ? 'Visible to Manager & Team Leaders' : 'Your Declared Window'}
                      </span>
                    </div>

                    {(() => {
                      const dayList = seasonalList.filter((entry) => {
                        if (entry.date !== selectedSeasonalDate) return false;
                        if (!isSupervisor) return entry.userId === currentUser.id;
                        if (seasonalFilterUserId !== 'all') return entry.userId === seasonalFilterUserId;
                        return true;
                      });

                      if (dayList.length === 0) {
                        return (
                          <p className="text-xs text-slate-400 italic py-2">
                            No availability declared for this date yet. Use the form on the left to add yours.
                          </p>
                        );
                      }

                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {dayList.map((ent) => {
                            const isAvail = ent.status !== 'unavailable';
                            return (
                              <div
                                key={ent.id}
                                className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2 text-xs">
                                <div className="space-y-0.5">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-bold text-slate-900">{ent.userName}</span>
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        isAvail ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                      }`}>
                                      {isAvail ? `${ent.minStart} – ${ent.maxFinish}` : 'Unavailable'}
                                    </span>
                                  </div>
                                  {ent.note && <p className="text-[11px] text-slate-500">Note: "{ent.note}"</p>}
                                </div>
                                {(ent.userId === currentUser.id || isManager) && (
                                  <button
                                    type="button"
                                    onClick={() => handleClearSeasonalAvailability(ent.userId, ent.date)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg">
                                    <Trash2 className="w-4 h-4"/>
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= USER MANAGEMENT TAB ================= */}
        {activeTab === 'users' && isManager && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 h-fit space-y-5">
              <h2 className="font-bold text-slate-900 text-base">Add Team Member</h2>
              <form onSubmit={handleAddUser} className="space-y-4">
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Full Name (e.g. Paul)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
                <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white">
                  <option value="colleague">Colleague</option>
                  <option value="team_leader">Team Leader</option>
                  <option value="manager">Grocery Manager</option>
                </select>
                <input
                  type="text"
                  required
                  value={newUserPin}
                  onChange={(e) => setNewUserPin(e.target.value)}
                  placeholder="Initial PIN (1234)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-600 uppercase">Contracted Shift Days</label>
                  <div className="flex flex-wrap gap-1.5">
                    {WEEK_DAYS.map((day) => {
                      const active = newUserDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDayInList(day, newUserDays, setNewUserDays)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-600 uppercase">
                    Auto-Send Standing Tasks on Shift Days
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {allTaskPresets.filter((p) => p.id !== 'custom').map((preset) => {
                      const active = newUserPresets.includes(preset.id);
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => togglePresetInList(preset.id, newUserPresets, setNewUserPresets)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                            active ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl text-sm shadow-md">
                  Create Account
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div>
                  <h2 className="font-bold text-slate-900 text-base">Current Grocery Team Roster ({teamUsers.length})</h2>
                  <p className="text-xs text-slate-500">Tap Edit on any colleague to set their contracted days and automatic daily tasks</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRunDailyStandingTasks(true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold flex items-center space-x-1.5 w-fit">
                  <Sparkles className="w-3.5 h-3.5"/>
                  <span>Drop Today's ({todayDayCode}) Shift Tasks Now</span>
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {teamUsers.map((u) => {
                  const userDays = Array.isArray(u.contractedDays) ? u.contractedDays : [];
                  const userPresets = Array.isArray(u.defaultPresets) ? u.defaultPresets : [];

                  return (
                    <div key={u.id} className="py-4 flex flex-col gap-3">
                      {editingUserId === u.id ? (
                        <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-200 space-y-4">
                          <div className="flex flex-wrap gap-2">
                            <input
                              type="text"
                              value={editUserName}
                              onChange={(e) => setEditUserName(e.target.value)}
                              className="px-3 py-1.5 rounded-xl border text-xs bg-white font-semibold"
                              placeholder="Name"
                            />
                            <select
                              value={editUserRole}
                              onChange={(e) => setEditUserRole(e.target.value)}
                              className="px-3 py-1.5 rounded-xl border text-xs bg-white font-semibold">
                              <option value="colleague">Colleague</option>
                              <option value="team_leader">Team Leader</option>
                              <option value="manager">Grocery Manager</option>
                            </select>
                            <input
                              type="text"
                              value={editUserPin}
                              onChange={(e) => setEditUserPin(e.target.value)}
                              className="w-24 px-3 py-1.5 rounded-xl border text-xs bg-white font-semibold"
                              placeholder="PIN"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <span className="text-[11px] font-bold uppercase text-indigo-900 block">Contracted Shift Days:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {WEEK_DAYS.map((day) => {
                                const active = editUserDays.includes(day);
                                return (
                                  <button
                                    key={day}
                                    type="button"
                                    onClick={() => toggleDayInList(day, editUserDays, setEditUserDays)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                                      active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200'
                                    }`}>
                                    {day}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <span className="text-[11px] font-bold uppercase text-indigo-900 block">
                              Standing Shift Tasks (Sent Automatically on Contracted Days):
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {allTaskPresets.filter((p) => p.id !== 'custom').map((preset) => {
                                const active = editUserPresets.includes(preset.id);
                                return (
                                  <button
                                    key={preset.id}
                                    type="button"
                                    onClick={() => togglePresetInList(preset.id, editUserPresets, setEditUserPresets)}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                                      active ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'
                                    }`}>
                                    {preset.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="flex justify-end space-x-2">
                            <button
                              type="button"
                              onClick={() => setEditingUserId(null)}
                              className="px-3 py-1.5 bg-white border rounded-xl text-xs font-semibold">
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEditUser(u.id)}
                              className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold">
                              Save Changes
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-bold text-sm text-slate-800">{u.name}</p>
                              <span className="text-xs text-slate-500 capitalize">
                                {u.role === 'manager' ? 'Grocery Manager' : (u.role || '').replace('_', ' ')} • PIN: {u.pin || '1234'}
                              </span>
                              {isUserOnShiftToday(u) && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                  On Shift Today
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[11px] text-slate-400 font-semibold">Days:</span>
                              {userDays.length === 0 ? (
                                <span className="text-[11px] text-slate-400 italic">Not set</span>
                              ) : (
                                userDays.map((d) => (
                                  <span key={d} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-bold">
                                    {d}
                                  </span>
                                ))
                              )}

                              {userPresets.length > 0 && (
                                <>
                                  <span className="text-[11px] text-slate-400 font-semibold ml-2">Standing Tasks:</span>
                                  {userPresets.map((pid) => {
                                    const found = allTaskPresets.find((p) => p.id === pid);
                                    return found ? (
                                      <span key={pid} className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-bold">
                                        {found.label}
                                      </span>
                                    ) : null;
                                  })}
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 self-start sm:self-center">
                            <button
                              onClick={() => startEditUser(u)}
                              className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl">
                              Edit Shift & Tasks
                            </button>
                            {u.id !== currentUser.id && (
                              <button onClick={() => handleDeleteUser(u)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg">
                                <Trash2 className="w-4 h-4"/>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= MOBILE-OPTIMISED TERMINAL LOGIN QR CODES (ZERO SIDEWAYS SCROLL) ================= */}
        <section className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-5 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                <QrCode className="w-5 h-5"/>
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-slate-900 text-sm sm:text-base truncate">
                  {currentUser.name}'s Terminal Login QR Codes
                </h2>
                <p className="text-xs text-slate-500">
                  Saved privately on this phone only. Scan with your Zebra terminal to log in.
                </p>
              </div>
            </div>
            {(savedQrEmail || savedQrPassword) && (
              <button
                onClick={handleClearTerminalQr}
                className="text-xs font-semibold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl w-fit shrink-0">
                Clear Saved QR Codes
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <form onSubmit={handleSaveEmailQr} className="space-y-1.5 min-w-0">
              <label className="block text-xs font-semibold text-slate-600 uppercase">Asda Email Address</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={qrEmailInput}
                  onChange={(e) => setQrEmailInput(e.target.value)}
                  placeholder="firstname.lastname@asda.co.uk"
                  className="w-full min-w-0 flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shrink-0">
                  Save Email QR
                </button>
              </div>
            </form>

            <form onSubmit={handleSavePasswordQr} className="space-y-1.5 min-w-0">
              <label className="block text-xs font-semibold text-slate-600 uppercase">Terminal Password</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="password"
                  value={qrPasswordInput}
                  onChange={(e) => setQrPasswordInput(e.target.value)}
                  placeholder="Enter terminal password"
                  className="w-full min-w-0 flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs shrink-0">
                  Save Password QR
                </button>
              </div>
            </form>
          </div>

          {(savedQrEmail || savedQrPassword) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center text-center space-y-3 min-w-0">
                <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 font-bold text-xs uppercase">Email</span>
                {savedQrEmail ? (
                  <>
                    <div
                      onClick={() => { setLightboxTitle('Email QR Code'); setLightboxImage(buildQrCodeUrl(savedQrEmail)); }}
                      className="p-3 bg-white rounded-2xl border-2 border-slate-200 cursor-pointer">
                      <img src={buildQrCodeUrl(savedQrEmail)} alt="Email QR" className="w-36 h-36 sm:w-44 sm:h-44 object-contain"/>
                    </div>
                    <p className="text-xs text-slate-500 font-mono truncate w-full px-2">{savedQrEmail}</p>
                  </>
                ) : (
                  <p className="text-xs text-slate-400 italic py-10">No Email QR saved yet.</p>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center text-center space-y-3 min-w-0">
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
                      className="p-3 bg-white rounded-2xl border-2 border-slate-200 cursor-pointer relative">
                      <img
                        src={buildQrCodeUrl(savedQrPassword)}
                        alt="Password QR"
                        className={`w-36 h-36 sm:w-44 sm:h-44 object-contain ${revealPasswordQr ? '' : 'blur-md'}`}
                      />
                    </div>
                    <p className="text-xs text-slate-500 font-mono">••••••••••••</p>
                  </>
                ) : (
                  <p className="text-xs text-slate-400 italic py-10">No Password QR saved yet.</p>
                )}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
