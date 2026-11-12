import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, setDoc, onSnapshot, arrayUnion } from 'firebase/firestore';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import {
  CheckCircle, Clock, Plus, LogOut, Bell, BellRing, ShieldCheck, Archive, Users, Sparkles,
  Check, ArrowRight, Layers, Camera, Trash2, UserPlus, Send, X, Calendar, RotateCcw,
  Lock, Volume2, VolumeX, Share2, Flame, Play, Pause, AlertTriangle, QrCode, Eye, EyeOff,
  ChevronDown, ChevronUp, ClipboardList
} from 'lucide-react';

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

const TASK_PRESETS = [
  { id: 'custom', label: 'Custom (Type Your Own)', title: '', description: '' },
  { id: 'waste', label: 'Waste', title: 'Waste', description: 'Process all damages, splits, and out-of-date stock. Scan everything accurately, clear the waste cages/area, and upload a photo of the cleared area.' },
  { id: 'drop_tops', label: 'Drop Tops', title: 'Drop Tops', description: 'Pull down top-stock across the assigned aisles to fill shelf gaps, face up as you go, update any capacity issues, and upload a photo of the completed bays.' },
  { id: 'gifting', label: 'Gifting', title: 'Gifting', description: 'Replenish and dress the seasonal/gifting bays, ensure all price labels are present and aligned, remove empty cardboard, and upload a photo of the finished display.' },
  { id: 'hb', label: 'H&B', title: 'H&B', description: 'Work Health & Beauty delivery/backstock, check security tags on high-value lines, face up shelves, and upload a photo of completed bays.' },
  { id: 'horseshoe', label: 'Horseshoe', title: 'Horseshoe', description: 'Work and replenish the Horseshoe area, keep promotional lines topped up and faced, clear all rubbish, and upload a photo of the finished section.' },
  { id: 'modular_compliance', label: 'Modular Compliance', title: 'Modular Compliance', description: 'Relay/check bays against the current modular plan, ensure all SELs/ESLs are aligned to the left edge and match product facings, and upload a clear photo of the bay.' },
  { id: 'camera_tasks', label: 'Camera Tasks', title: 'Camera Tasks', description: 'Action the latest overhead camera gap/stock alerts, replenish or zero-check flagged lines, and upload a photo of the resolved bays.' },
  { id: 'promo', label: 'Promo', title: 'Promo', description: 'Replenish promotional end-caps and features, verify correct promotional barkers/POS are displayed, face up stock, and upload a photo of the end-cap.' }
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

const AVATAR_COLORS = ['bg-blue-600', 'bg-emerald-600', 'bg-violet-600', 'bg-amber-600', 'bg-rose-600', 'bg-cyan-600', 'bg-teal-600'];
const buildQrCodeUrl = (val) => val ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=16&data=${encodeURIComponent(val)}` : '';

let sharedAudioCtx = null;
const playNotificationChime = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!sharedAudioCtx) sharedAudioCtx = new AudioCtx();
    if (sharedAudioCtx.state === 'suspended') sharedAudioCtx.resume();
    const now = sharedAudioCtx.currentTime;
    const osc1 = sharedAudioCtx.createOscillator();
    const gain1 = sharedAudioCtx.createGain();
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc1.connect(gain1); gain1.connect(sharedAudioCtx.destination);
    osc1.start(now); osc1.stop(now + 0.25);
    const osc2 = sharedAudioCtx.createOscillator();
    const gain2 = sharedAudioCtx.createGain();
    osc2.frequency.setValueAtTime(1108.73, now + 0.15);
    gain2.gain.setValueAtTime(0.3, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2); gain2.connect(sharedAudioCtx.destination);
    osc2.start(now + 0.15); osc2.stop(now + 0.55);
    if (navigator?.vibrate) navigator.vibrate([200, 100, 200]);
  } catch (e) { console.error(e); }
};

const triggerSystemNotification = async (title, body) => {
  if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg?.showNotification) {
        await reg.showNotification(title, { body, icon: '/vite.svg', badge: '/vite.svg', vibrate: [200, 100, 200], tag: 'tf-' + Date.now() });
        return;
      }
    }
    new Notification(title, { body, icon: '/vite.svg' });
  } catch (e) { console.error(e); }
};

const compressImage = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = (ev) => {
    const img = new Image();
    img.src = ev.target.result;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = img.width > 800 ? 800 / img.width : 1;
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = reject;
  };
  reader.onerror = reject;
});

const sortTasksByPriorityAndDate = (list) => [...list].sort((a, b) => {
  const aH = a.progressStatus === 'incomplete' ? 1 : 0;
  const bH = b.progressStatus === 'incomplete' ? 1 : 0;
  if (aH !== bH) return bH - aH;
  const aU = a.priority === 'urgent' ? 1 : 0;
  const bU = b.priority === 'urgent' ? 1 : 0;
  if (aU !== bU) return bU - aU;
  return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
});

export default function App() {
  const [fbUser, setFbUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY)); } catch { return null; }
  });
  const [loginTarget, setLoginTarget] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [fcmEnabled, setFcmEnabled] = useState(false);
  const prevUnreadCountRef = useRef(null);

  const [showPinModal, setShowPinModal] = useState(false);
  const [selfNewPin, setSelfNewPin] = useState('');
  const [editingUserId, setEditingUserId] = useState(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserRole, setEditUserRole] = useState('colleague');
  const [editUserPin, setEditUserPin] = useState('');

  const [activeTab, setActiveTab] = useState('tasks');
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [openSections, setOpenSections] = useState({ reassigned: true, validation: true, inProgress: true, allocated: false, archive: false });
  const toggleSection = (k) => setOpenSections((p) => ({ ...p, [k]: !p[k] }));

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
    setTimeout(() => setToast((p) => ({ ...p, show: false })), 4500);
  };

  useEffect(() => {
    if (!currentUser) return;
    try {
      const parsed = JSON.parse(localStorage.getItem(`taskflow_terminal_qr_${currentUser.id}`) || '{}');
      setSavedQrEmail(parsed.email || ''); setSavedQrPassword(parsed.password || '');
      setQrEmailInput(parsed.email || ''); setQrPasswordInput(parsed.password || '');
      setRevealPasswordQr(false);
    } catch (e) { console.error(e); }
  }, [currentUser?.id]);

  const handleSaveEmailQr = (e) => {
    e.preventDefault();
    if (!currentUser) return;
    const trimmed = qrEmailInput.trim();
    setSavedQrEmail(trimmed);
    localStorage.setItem(`taskflow_terminal_qr_${currentUser.id}`, JSON.stringify({ email: trimmed, password: savedQrPassword }));
    showToast("Email QR Saved", "Saved to this phone.");
  };

  const handleSavePasswordQr = (e) => {
    e.preventDefault();
    if (!currentUser) return;
    const trimmed = qrPasswordInput.trim();
    setSavedQrPassword(trimmed);
    localStorage.setItem(`taskflow_terminal_qr_${currentUser.id}`, JSON.stringify({ email: savedQrEmail, password: trimmed }));
    showToast("Password QR Saved", "Saved privately on this phone.");
  };

  const handleClearTerminalQr = () => {
    if (!currentUser) return;
    setSavedQrEmail(''); setSavedQrPassword(''); setQrEmailInput(''); setQrPasswordInput('');
    localStorage.removeItem(`taskflow_terminal_qr_${currentUser.id}`);
    showToast("QR Codes Cleared", "Removed from this device.");
  };

  const handleSelectPreset = (id) => {
    setSelectedPreset(id);
    const found = TASK_PRESETS.find((p) => p.id === id);
    if (found) { setTaskTitle(found.title); setTaskDesc(found.description); }
  };

  useEffect(() => {
    isSupported().then((sup) => {
      if (!sup) return;
      onMessage(getMessaging(app), (payload) => {
        if (soundEnabled) playNotificationChime();
        showToast(payload.notification?.title || 'TaskFlow Alert', payload.notification?.body || '');
      });
    }).catch(() => {});
  }, [soundEnabled]);

  const handleEnableLockScreenAlerts = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      showToast("Add to Home Screen", "Tap Share then Add to Home Screen first.");
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') return showToast("Blocked", "Allow notifications in phone settings.");
      playNotificationChime();
      if ((await isSupported()) && VAPID_KEY) {
        const sw = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        const token = await getToken(getMessaging(app), { vapidKey: VAPID_KEY, serviceWorkerRegistration: sw });
        if (token && currentUser) {
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', currentUser.id), { fcmTokens: arrayUnion(token) });
          setFcmEnabled(true);
          return showToast("Push Active", "Registered for lock-screen alerts.");
        }
      }
      await triggerSystemNotification("Alerts Enabled", "Notifications active.");
      setFcmEnabled(true);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    signInAnonymously(auth).catch((e) => console.error(e));
    return onAuthStateChanged(auth, (u) => { setFbUser(u); setAuthLoading(false); });
  }, []);

  useEffect(() => {
    if (!fbUser) return;
    const uRef = collection(db, 'artifacts', appId, 'public', 'data', 'users');
    const tRef = collection(db, 'artifacts', appId, 'public', 'data', 'tasks');
    const rRef = collection(db, 'artifacts', appId, 'public', 'data', 'requests');
    const nRef = collection(db, 'artifacts', appId, 'public', 'data', 'notifications');

    const unsubU = onSnapshot(uRef, async (snap) => {
      if (snap.empty) {
        for (const u of DEFAULT_USERS) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', u.id), u);
      } else {
        const arr = []; snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
        const pri = { manager: 1, team_leader: 2, colleague: 3 };
        arr.sort((a, b) => (pri[a.role] || 9) - (pri[b.role] || 9) || a.name.localeCompare(b.name));
        setTeamUsers(arr);
      }
    });
    const unsubT = onSnapshot(tRef, (snap) => {
      const arr = []; snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      arr.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setTasks(arr);
    });
    const unsubR = onSnapshot(rRef, (snap) => {
      const arr = []; snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      arr.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setRequests(arr);
    });
    const unsubN = onSnapshot(nRef, (snap) => {
      const arr = []; snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      arr.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setNotifications(arr);
    });
    return () => { unsubU(); unsubT(); unsubR(); unsubN(); };
  }, [fbUser]);

  useEffect(() => {
    if (!currentUser || teamUsers.length === 0) return;
    const found = teamUsers.find((u) => u.id === currentUser.id);
    if (found) {
      setCurrentUser(found);
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(found));
      if ((found.fcmTokens || []).length > 0 && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') setFcmEnabled(true);
    } else {
      setCurrentUser(null); localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [teamUsers]);

  const isSupervisor = currentUser?.role === 'manager' || currentUser?.role === 'team_leader';
  const myNotifications = currentUser ? notifications.filter((n) => {
    if ((n.clearedBy || []).includes(currentUser.id)) return false;
    return n.targetUserId === currentUser.id || (n.targetRoleGroup === 'supervisors' && isSupervisor);
  }) : [];
  const unreadNotifications = currentUser ? myNotifications.filter((n) => !(n.readBy || []).includes(currentUser.id)) : [];
  const unreadCount = unreadNotifications.length;

  useEffect(() => {
    if (!currentUser) { prevUnreadCountRef.current = null; return; }
    if (prevUnreadCountRef.current !== null && unreadCount > prevUnreadCountRef.current) {
      if (soundEnabled) playNotificationChime();
      const newest = unreadNotifications[0];
      if (newest) { showToast(newest.title, newest.message); triggerSystemNotification(newest.title, newest.message); }
    }
    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount, currentUser?.id, soundEnabled]);

  const sendNotification = async (targetUserId, targetRoleGroup, title, message) => {
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'notifications'), {
        targetUserId: targetUserId || null, targetRoleGroup: targetRoleGroup || null,
        title, message, readBy: [], clearedBy: [], createdAt: new Date().toISOString()
      });
      let tokens = [];
      if (targetUserId) {
        const u = teamUsers.find((x) => x.id === targetUserId);
        if (u?.fcmTokens) tokens.push(...u.fcmTokens);
      } else if (targetRoleGroup === 'supervisors') {
        teamUsers.filter((x) => x.role === 'manager' || x.role === 'team_leader').forEach((s) => { if (s.fcmTokens) tokens.push(...s.fcmTokens); });
      }
      if (tokens.length > 0) {
        fetch('/api/send-push', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tokens, title, body: message }) }).catch(() => {});
      }
    } catch (e) { console.error(e); }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!loginTarget) return;
    if (pinInput === (loginTarget.pin || '1234')) {
      prevUnreadCountRef.current = null;
      setCurrentUser(loginTarget);
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(loginTarget));
      setLoginTarget(null); setPinInput(''); setLoginError(''); setActiveTab('tasks');
    } else setLoginError('Incorrect PIN.');
  };

  const handleLogout = () => { setCurrentUser(null); setShowNotifDropdown(false); localStorage.removeItem(SESSION_STORAGE_KEY); };

  const handleSelfPinChange = async (e) => {
    e.preventDefault();
    if (!currentUser || !selfNewPin.trim()) return;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', currentUser.id), { pin: selfNewPin.trim() });
    setShowPinModal(false); setSelfNewPin(''); showToast("PIN Updated", "Saved.");
  };

  const handleSaveEditUser = async (uid) => {
    if (!editUserName.trim() || !editUserPin.trim()) return;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', uid), { name: editUserName.trim(), role: editUserRole, pin: editUserPin.trim() });
    setEditingUserId(null); showToast("Profile Updated", "Saved.");
  };

  const handlePhotoUpload = async (e, setter) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try { setter(await compressImage(file)); } catch { showToast("Error", "Could not process photo."); }
  };

  const toggleTaskAssignee = (id) => setTaskAssigneeIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const toggleDelegateTarget = (id) => setDelegateTargetIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim() || taskAssigneeIds.length === 0) return showToast("Missing Info", "Enter a title and tick at least one person.");
    const selected = teamUsers.filter((u) => taskAssigneeIds.includes(u.id));
    const tRef = collection(db, 'artifacts', appId, 'public', 'data', 'tasks');
    const isUrgent = taskPriority === 'urgent';
    for (const u of selected) {
      await addDoc(tRef, {
        title: taskTitle.trim(), description: taskDesc.trim(), priority: taskPriority,
        progressStatus: 'not_started', startedAt: null, pausedAt: null, pauseReason: '',
        handoverFromName: null, handoverNote: '', assigneeId: u.id, assigneeName: u.name, assigneeRole: u.role,
        createdById: currentUser.id, createdByName: currentUser.name, delegatedByName: null,
        managerPhoto: taskPhoto || null, completionPhoto: null, completionNote: '', comments: [],
        status: 'active', createdAt: new Date().toISOString(), completedAt: null, validatedAt: null
      });
      await sendNotification(u.id, null, isUrgent ? 'PRIORITY Task Assigned' : 'New Task Assigned', `${currentUser.name} assigned "${taskTitle.trim()}" to you.`);
    }
    setSelectedPreset('custom'); setTaskTitle(''); setTaskDesc(''); setTaskPriority('standard'); setTaskAssigneeIds([]); setTaskPhoto(null);
    showToast("Task Assigned", `Assigned to ${selected.map((x) => x.name).join(', ')}`);
  };

  const handleStartOrResumeTask = async (t) => {
    const now = new Date().toISOString();
    const wasPaused = t.progressStatus === 'paused';
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', t.id), { progressStatus: 'in_progress', startedAt: t.startedAt || now, pausedAt: null, pauseReason: '' });
    await sendNotification(null, 'supervisors', wasPaused ? 'Task Resumed' : 'Task Started', `${currentUser.name} ${wasPaused ? 'resumed' : 'started'} "${t.title}".`);
    showToast(wasPaused ? "Resumed" : "Started", `"${t.title}" In Progress.`);
  };

  const handleConfirmPauseTask = async (e) => {
    e.preventDefault();
    if (!pausingTask) return;
    const reason = pauseReason === 'Custom' ? customPauseReason.trim() || 'Paused' : pauseReason;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', pausingTask.id), { progressStatus: 'paused', pausedAt: new Date().toISOString(), pauseReason: reason });
    await sendNotification(null, 'supervisors', 'Task Paused', `${currentUser.name} paused "${pausingTask.title}" (${reason}).`);
    setPausingTask(null); setCustomPauseReason(''); showToast("Task Paused", reason);
  };

  const handleConfirmIncompleteHandover = async (e) => {
    e.preventDefault();
    if (!handoverTask || !handoverNote.trim()) return;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', handoverTask.id), { progressStatus: 'incomplete', handoverFromName: currentUser.name, handoverNote: handoverNote.trim() });
    await sendNotification(null, 'supervisors', 'Incomplete Task Handover', `${currentUser.name} flagged "${handoverTask.title}": "${handoverNote.trim()}"`);
    setHandoverTask(null); setHandoverNote(''); showToast("Handover Sent", "Supervisors alerted.");
  };

  const handleConfirmDelegation = async (e) => {
    e.preventDefault();
    if (!delegatingTask || delegateTargetIds.length === 0) return;
    const targets = teamUsers.filter((u) => delegateTargetIds.includes(u.id));
    const wasStarted = ['in_progress', 'paused', 'incomplete'].includes(delegatingTask.progressStatus);
    const prevWorker = wasStarted ? delegatingTask.handoverFromName || delegatingTask.assigneeName : delegatingTask.handoverFromName || null;
    const extra = delegateNote.trim() ? `\n\n[Handover Note from ${currentUser.name}: ${delegateNote.trim()}]` : '';
    const desc = `${delegatingTask.description || ''}${extra}`.trim();

    if (targets.length === 1) {
      const u = targets[0];
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', delegatingTask.id), {
        assigneeId: u.id, assigneeName: u.name, assigneeRole: u.role, description: desc,
        progressStatus: 'not_started', startedAt: null, pausedAt: null, pauseReason: '',
        handoverFromName: prevWorker, handoverNote: delegateNote.trim() || delegatingTask.handoverNote || '',
        delegatedByName: currentUser.name, delegatedAt: new Date().toISOString()
      });
      await sendNotification(u.id, null, 'Task Assigned', `${currentUser.name} assigned "${delegatingTask.title}" to you.`);
    } else {
      const tRef = collection(db, 'artifacts', appId, 'public', 'data', 'tasks');
      for (const u of targets) {
        await addDoc(tRef, {
          title: delegatingTask.title, description: desc, priority: delegatingTask.priority || 'standard',
          progressStatus: 'not_started', startedAt: null, pausedAt: null, pauseReason: '',
          handoverFromName: prevWorker, handoverNote: delegateNote.trim() || delegatingTask.handoverNote || '',
          assigneeId: u.id, assigneeName: u.name, assigneeRole: u.role,
          createdById: delegatingTask.createdById || currentUser.id, createdByName: delegatingTask.createdByName || 'Manager',
          delegatedByName: currentUser.name, delegatedAt: new Date().toISOString(),
          managerPhoto: delegatingTask.managerPhoto || null, completionPhoto: null, completionNote: '',
          comments: delegatingTask.comments || [], status: 'active', createdAt: new Date().toISOString(), completedAt: null, validatedAt: null
        });
        await sendNotification(u.id, null, 'Task Assigned', `${currentUser.name} assigned "${delegatingTask.title}" to you.`);
      }
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', delegatingTask.id));
    }
    setDelegatingTask(null); setDelegateTargetIds([]); setDelegateNote(''); showToast("Reassigned", "Task updated.");
  };

  const handleQuickReassign = async (t, newId) => {
    if (!newId || newId === t.assigneeId) return;
    const u = teamUsers.find((x) => x.id === newId);
    if (!u) return;
    const wasStarted = ['in_progress', 'paused', 'incomplete'].includes(t.progressStatus);
    const prevWorker = wasStarted ? t.handoverFromName || t.assigneeName : t.handoverFromName || null;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', t.id), {
      assigneeId: u.id, assigneeName: u.name, assigneeRole: u.role, progressStatus: 'not_started',
      pausedAt: null, pauseReason: '', handoverFromName: prevWorker, delegatedByName: currentUser.name, delegatedAt: new Date().toISOString()
    });
    await sendNotification(u.id, null, 'Task Reassigned', `${currentUser.name} reassigned "${t.title}" to you.`);
    showToast("Reassigned", `Moved to ${u.name}.`);
  };

  const handleDeleteTask = async (t) => { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', t.id)); showToast("Deleted", t.title); };

  const handleConfirmCompletion = async (e) => {
    e.preventDefault();
    if (!completingTask) return;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', completingTask.id), {
      status: 'pending_validation', completionNote: completionNote.trim(), completionPhoto: completionPhoto || null, completedAt: new Date().toISOString()
    });
    await sendNotification(null, 'supervisors', 'Task Ready for Validation', `${currentUser.name} completed "${completingTask.title}".`);
    setCompletingTask(null); setCompletionNote(''); setCompletionPhoto(null); showToast("Submitted", "Sent for validation.");
  };

  const handleValidateTask = async (t) => {
    const now = new Date().toISOString();
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', t.id), {
      status: 'archived', completedAt: t.completedAt || now,
      completionNote: t.completionNote || (t.status === 'active' ? `Validated directly by ${currentUser.name}` : ''),
      validatedByName: currentUser.name, validatedAt: now
    });
    await sendNotification(t.assigneeId, null, 'Task Validated', `${currentUser.name} validated "${t.title}".`);
    showToast("Validated", `"${t.title}" archived.`);
  };

  const handleReturnTask = async (t) => {
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', t.id), { status: 'active', progressStatus: 'in_progress', completedAt: null });
    await sendNotification(t.assigneeId, null, 'Revision Requested', `${currentUser.name} returned "${t.title}".`);
    showToast("Returned", "Task sent back.");
  };

  const handleAddComment = async (t) => {
    const text = (commentInputs[t.id] || '').trim();
    if (!text) return;
    const updated = [...(t.comments || []), { id: Date.now().toString(), authorName: currentUser.name, authorRole: currentUser.role, text, createdAt: new Date().toISOString() }];
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', t.id), { comments: updated });
    setCommentInputs((p) => ({ ...p, [t.id]: '' }));
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!reqNote.trim()) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'requests'), {
      requesterId: currentUser.id, requesterName: currentUser.name, type: reqType, dates: reqDates.trim(), note: reqNote.trim(),
      status: 'pending', managerReply: '', reviewedBy: null, createdAt: new Date().toISOString()
    });
    await sendNotification(null, 'supervisors', 'New Manager Request', `${currentUser.name} submitted a ${reqType} request.`);
    setReqDates(''); setReqNote(''); showToast("Sent", "Request submitted.");
  };

  const handleDecisionRequest = async (r, status) => {
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'requests', r.id), {
      status, managerReply: (managerReplyInputs[r.id] || '').trim(), reviewedBy: currentUser.name, reviewedAt: new Date().toISOString()
    });
    await sendNotification(r.requesterId, null, `Request ${status}`, `${currentUser.name} ${status} your ${r.type} request.`);
    showToast("Updated", `Marked as ${status}.`);
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserPin.trim()) return;
    const id = `user-${Date.now()}`;
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', id), {
      id, name: newUserName.trim(), role: newUserRole, pin: newUserPin.trim(), color: AVATAR_COLORS[teamUsers.length % AVATAR_COLORS.length], fcmTokens: []
    });
    setNewUserName(''); setNewUserPin('1234'); showToast("Added", "User created.");
  };

  const handleDeleteUser = async (u) => {
    if (u.id === currentUser.id) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', u.id));
    showToast("Removed", u.name);
  };

  const handleClearArchive = async () => {
    for (const t of tasks.filter((x) => x.status === 'archived')) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', t.id));
    showToast("Cleared", "Archive emptied.");
  };

  const handleDismissNotification = async (e, n) => {
    e.stopPropagation();
    const ref = doc(db, 'artifacts', appId, 'public', 'data', 'notifications', n.id);
    if (n.targetUserId === currentUser.id) await deleteDoc(ref);
    else await updateDoc(ref, { clearedBy: arrayUnion(currentUser.id), readBy: arrayUnion(currentUser.id) });
  };

  const handleClearAllNotifications = async () => {
    for (const n of myNotifications) {
      const ref = doc(db, 'artifacts', appId, 'public', 'data', 'notifications', n.id);
      if (n.targetUserId === currentUser.id) await deleteDoc(ref);
      else await updateDoc(ref, { clearedBy: arrayUnion(currentUser.id), readBy: arrayUnion(currentUser.id) });
    }
    showToast("Cleared", "Notifications cleared.");
  };

  if (authLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-sm">Loading TaskFlow Pro...</div>;

  if (!currentUser) {
    const managers = teamUsers.filter((u) => u.role === 'manager');
    const teamLeaders = teamUsers.filter((u) => u.role === 'team_leader');
    const colleagues = teamUsers.filter((u) => u.role === 'colleague');
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white/10 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl text-white space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg"><Layers className="w-7 h-7 text-white"/></div>
            <h1 className="text-2xl font-bold">TaskFlow Team Portal</h1>
            <p className="text-xs text-indigo-200">Select your name below to log in</p>
          </div>
          {loginTarget && (
            <div className="bg-slate-900/95 border border-indigo-500/40 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm">Log in as {loginTarget.name}</h3>
                <button onClick={() => { setLoginTarget(null); setLoginError(''); }}><X className="w-5 h-5 text-slate-400"/></button>
              </div>
              <form onSubmit={handleLoginSubmit} className="space-y-3">
                <input type="password" autoFocus value={pinInput} onChange={(e) => setPinInput(e.target.value)} placeholder="Enter PIN" className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-center text-lg tracking-widest"/>
                {loginError && <p className="text-xs text-rose-400">{loginError}</p>}
                <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold text-sm">Unlock Workspace</button>
              </form>
            </div>
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase text-indigo-300 block">Manager</span>
              {managers.map((u) => (
                <button key={u.id} onClick={() => { setLoginTarget(u); setPinInput(''); setLoginError(''); }} className="w-full p-3.5 rounded-2xl bg-indigo-600/80 hover:bg-indigo-600 flex items-center justify-between">
                  <div className="flex items-center space-x-3"><ShieldCheck className="w-5 h-5"/><span className="font-bold text-sm">{u.name}</span></div>
                  <ArrowRight className="w-4 h-4"/>
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase text-indigo-300 block">Team Leaders ({teamLeaders.length})</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {teamLeaders.map((u) => (
                  <button key={u.id} onClick={() => { setLoginTarget(u); setPinInput(''); setLoginError(''); }} className="p-3 rounded-xl bg-violet-600/30 hover:bg-violet-600/50 border border-violet-400/30 flex items-center justify-between">
                    <span className="font-bold text-xs">{u.name}</span><Lock className="w-3.5 h-3.5 text-indigo-300"/>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase text-indigo-300 block">Colleagues ({colleagues.length})</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {colleagues.map((u) => (
                  <button key={u.id} onClick={() => { setLoginTarget(u); setPinInput(''); setLoginError(''); }} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left">
                    <h4 className="font-bold text-xs truncate">{u.name}</h4><p className="text-[10px] text-slate-400">Colleague</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isManager = currentUser.role === 'manager';
  const assignableUsers = teamUsers.filter((u) => isManager ? (u.role === 'team_leader' || u.role === 'colleague') : (currentUser.role === 'team_leader' ? u.role === 'colleague' : false));
  const colleaguesOnly = teamUsers.filter((u) => u.role === 'colleague');
  const teamLeadersOnly = teamUsers.filter((u) => u.role === 'team_leader');

  const myAssignedTasks = sortTasksByPriorityAndDate(tasks.filter((t) => t.assigneeId === currentUser.id && t.status === 'active'));
  const myPendingTasks = tasks.filter((t) => t.assigneeId === currentUser.id && t.status === 'pending_validation');
  const myArchivedTasks = tasks.filter((t) => t.assigneeId === currentUser.id && t.status === 'archived');

  const allActiveTasks = sortTasksByPriorityAndDate(tasks.filter((t) => t.status === 'active'));
  const pausedOrHandoverTasks = allActiveTasks.filter((t) => t.progressStatus === 'paused' || t.progressStatus === 'incomplete');
  const inProgressTasks = allActiveTasks.filter((t) => t.progressStatus === 'in_progress');
  const allocatedNotStartedTasks = allActiveTasks.filter((t) => !t.progressStatus || t.progressStatus === 'not_started');
  const allPendingTasks = tasks.filter((t) => t.status === 'pending_validation');
  const allArchivedTasks = tasks.filter((t) => t.status === 'archived');
  const pendingRequestsCount = requests.filter((r) => r.status === 'pending').length;

  const renderSupervisorTaskCard = (t) => {
    const isUrgent = t.priority === 'urgent';
    const isInProgress = t.progressStatus === 'in_progress';
    const isPaused = t.progressStatus === 'paused';
    const isIncomplete = t.progressStatus === 'incomplete';
    return (
      <div key={t.id} className={`bg-white p-4 rounded-xl border text-xs space-y-3 shadow-xs ${isIncomplete ? 'border-orange-400 bg-orange-50/20' : isUrgent ? 'border-rose-300 bg-rose-50/10' : 'border-slate-200'}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="px-2 py-0.5 bg-slate-900 text-white rounded text-[11px] font-bold">{t.assigneeName}</span>
              {isUrgent && <span className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold uppercase">Priority</span>}
              {isInProgress && <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-bold">Working On It</span>}
              {isPaused && <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded text-[10px] font-bold">Paused: {t.pauseReason || 'Interrupted'}</span>}
              {isIncomplete && <span className="px-2 py-0.5 bg-orange-600 text-white rounded text-[10px] font-bold">Incomplete / Handover</span>}
              {!isInProgress && !isPaused && !isIncomplete && <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold">Not Started</span>}
              {t.handoverFromName && <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded text-[10px] font-semibold">Started by {t.handoverFromName}</span>}
            </div>
            <h4 className="font-bold text-slate-900 text-sm pt-0.5">{t.title}</h4>
            <p className="text-slate-600 text-xs whitespace-pre-line">{t.description}</p>
            {t.handoverNote && <p className="text-xs text-orange-900 bg-orange-100/70 px-2.5 py-1.5 rounded-lg border border-orange-200 font-medium">Handover Note: "{t.handoverNote}"</p>}
          </div>
          <button onClick={() => handleDeleteTask(t)} className="p-1.5 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4"/></button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] font-semibold text-slate-500">Reassign:</span>
            <select value={t.assigneeId} onChange={(e) => handleQuickReassign(t, e.target.value)} className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
              {assignableUsers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <button onClick={() => { setDelegatingTask(t); setDelegateTargetIds([]); setDelegateNote(t.handoverNote || ''); }} className="px-2.5 py-1 bg-violet-50 text-violet-700 rounded-lg text-[11px] font-semibold">+ Note</button>
          </div>
          <button onClick={() => handleValidateTask(t)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs flex items-center space-x-1">
            <Check className="w-3.5 h-3.5"/><span>Validate</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center space-x-3">
          <Sparkles className="w-5 h-5 text-indigo-400"/>
          <div><h4 className="text-xs font-semibold">{toast.title}</h4><p className="text-xs text-slate-300">{toast.message}</p></div>
        </div>
      )}

      {lightboxImage && (
        <div onClick={() => { setLightboxImage(null); setLightboxTitle(''); }} className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 cursor-pointer">
          {lightboxTitle && <div className="mb-4 px-4 py-1.5 rounded-full bg-white text-slate-900 font-bold text-sm">{lightboxTitle}</div>}
          <div className="bg-white p-4 rounded-3xl shadow-2xl"><img src={lightboxImage} alt="Zoom" className="max-w-full max-h-[80vh] rounded-xl"/></div>
        </div>
      )}

      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-slate-900 text-base">Change My Login PIN</h3>
            <form onSubmit={handleSelfPinChange} className="space-y-4">
              <input type="text" required value={selfNewPin} onChange={(e) => setSelfNewPin(e.target.value)} placeholder="New PIN" className="w-full px-3.5 py-2.5 rounded-xl border text-sm"/>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setShowPinModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold">Save PIN</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pausingTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-slate-900 text-base">Pause Task</h3>
            <form onSubmit={handleConfirmPauseTask} className="space-y-4">
              <div className="grid grid-cols-1 gap-1.5">
                {[...PAUSE_REASONS, 'Custom'].map((r) => (
                  <button key={r} type="button" onClick={() => setPauseReason(r)} className={`p-2.5 rounded-xl border text-left text-xs font-semibold ${pauseReason === r ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-50 text-slate-700'}`}>{r}</button>
                ))}
              </div>
              {pauseReason === 'Custom' && <input type="text" required value={customPauseReason} onChange={(e) => setCustomPauseReason(e.target.value)} placeholder="Enter reason..." className="w-full px-3.5 py-2 rounded-xl border text-xs"/>}
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setPausingTask(null)} className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-amber-500 text-white text-xs font-semibold">Confirm Pause</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {handoverTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-slate-900 text-base">Flag Incomplete / Shift Handover</h3>
            <form onSubmit={handleConfirmIncompleteHandover} className="space-y-4">
              <textarea rows="3" required value={handoverNote} onChange={(e) => setHandoverNote(e.target.value)} placeholder="What is left to finish?" className="w-full px-3.5 py-2 rounded-xl border text-xs"/>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setHandoverTask(null)} className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-orange-600 text-white text-xs font-semibold">Send Handover Alert</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {delegatingTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-slate-900 text-base">Reassign / Handover Task</h3>
            <form onSubmit={handleConfirmDelegation} className="space-y-4">
              <div className="max-h-48 overflow-y-auto border rounded-xl p-2 space-y-1">
                {colleaguesOnly.map((col) => (
                  <label key={col.id} className="flex items-center space-x-2.5 p-2 rounded-lg cursor-pointer text-xs hover:bg-slate-50">
                    <input type="checkbox" checked={delegateTargetIds.includes(col.id)} onChange={() => toggleDelegateTarget(col.id)}/>
                    <span className="font-semibold">{col.name}</span>
                  </label>
                ))}
              </div>
              <input type="text" value={delegateNote} onChange={(e) => setDelegateNote(e.target.value)} placeholder="Optional handover instructions..." className="w-full px-3.5 py-2 rounded-xl border text-xs"/>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setDelegatingTask(null)} className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold">Reassign Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {completingTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-slate-900 text-base">Complete Task & Attach Proof</h3>
            <form onSubmit={handleConfirmCompletion} className="space-y-4">
              <textarea rows="3" required value={completionNote} onChange={(e) => setCompletionNote(e.target.value)} placeholder="Add completion notes..." className="w-full px-3.5 py-2 rounded-xl border text-sm"/>
              <label className="flex items-center justify-center space-x-2 w-full py-3 px-4 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer">
                <Camera className="w-5 h-5 text-indigo-600"/><span className="text-xs font-semibold">{completionPhoto ? 'Change Photo' : 'Take or Upload Photo'}</span>
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

      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md"><Layers className="w-5 h-5"/></div>
            <div>
              <h1 className="font-bold text-base text-slate-900 leading-tight">TaskFlow Pro</h1>
              <p className="text-[11px] text-slate-500 font-medium capitalize">{currentUser.name} • {currentUser.role.replace('_', ' ')}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={handleEnableLockScreenAlerts} className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 ${fcmEnabled ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-100 text-amber-900'}`}>
              <BellRing className="w-3.5 h-3.5"/><span className="hidden md:inline">{fcmEnabled ? 'Push Active' : 'Enable Alerts'}</span>
            </button>
            <button onClick={() => setSoundEnabled(!soundEnabled)} className={`p-2 rounded-xl ${soundEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
              {soundEnabled ? <Volume2 className="w-4 h-4"/> : <VolumeX className="w-4 h-4"/>}
            </button>
            <button onClick={() => { setSelfNewPin(currentUser.pin || '1234'); setShowPinModal(true); }} className="px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold">PIN</button>
            <div className="relative">
              <button onClick={() => setShowNotifDropdown(!showNotifDropdown)} className="p-2 rounded-xl bg-slate-100 text-slate-700 relative">
                <Bell className="w-5 h-5"/>
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">{unreadCount}</span>}
              </button>
              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border p-4 z-50 space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="font-bold text-xs">Notifications ({myNotifications.length})</span>
                    {myNotifications.length > 0 && <button onClick={handleClearAllNotifications} className="text-[11px] text-rose-600 font-semibold">Clear All</button>}
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {myNotifications.length === 0 ? <p className="text-xs text-slate-400 italic text-center py-3">No notifications.</p> : myNotifications.slice(0, 15).map((n) => (
                      <div key={n.id} className="p-2.5 rounded-xl border bg-slate-50 text-xs flex items-start justify-between gap-2">
                        <div><p className="font-bold text-slate-800">{n.title}</p><p className="text-[11px] text-slate-600">{n.message}</p></div>
                        <button onClick={(e) => handleDismissNotification(e, n)} className="text-slate-400 hover:text-rose-600"><X className="w-3.5 h-3.5"/></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button onClick={handleLogout} className="p-2 rounded-xl bg-rose-50 text-rose-600"><LogOut className="w-4 h-4"/></button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 flex space-x-2 border-t border-slate-100 py-2 overflow-x-auto">
          <button onClick={() => setActiveTab('tasks')} className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold ${activeTab === 'tasks' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}>
            {isSupervisor ? 'Team Task Board' : 'My Assigned Tasks'}
          </button>
          {currentUser.role === 'team_leader' && (
            <button onClick={() => setActiveTab('my_tl_tasks')} className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold ${activeTab === 'my_tl_tasks' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}>
              Tasks From Manager ({myAssignedTasks.length})
            </button>
          )}
          <button onClick={() => setActiveTab('requests')} className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold ${activeTab === 'requests' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}>
            {isSupervisor ? `Requests (${pendingRequestsCount})` : 'Manager Requests'}
          </button>
          {isManager && (
            <button onClick={() => setActiveTab('users')} className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold ${activeTab === 'users' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}>
              Manage Team ({teamUsers.length})
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 space-y-8">
        {activeTab === 'tasks' && isSupervisor && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 h-fit space-y-4 shadow-xs">
              <h2 className="font-bold text-slate-800 text-base">Assign New Task</h2>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-600 uppercase">Quick Task Preset</label>
                  <select value={selectedPreset} onChange={(e) => handleSelectPreset(e.target.value)} className="w-full px-3.5 py-2 rounded-xl border text-sm bg-slate-50">
                    {TASK_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                  <div className="flex flex-wrap gap-1.5">
                    {TASK_PRESETS.filter((p) => p.id !== 'custom').map((p) => (
                      <button key={p.id} type="button" onClick={() => handleSelectPreset(p.id)} className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${selectedPreset === p.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}>{p.label}</button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setTaskPriority('standard')} className={`py-2 px-3 rounded-xl text-xs font-semibold border ${taskPriority === 'standard' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600'}`}>Standard</button>
                  <button type="button" onClick={() => setTaskPriority('urgent')} className={`py-2 px-3 rounded-xl text-xs font-semibold border ${taskPriority === 'urgent' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700'}`}>Priority / First Job</button>
                </div>
                <input type="text" required value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Task Title" className="w-full px-3.5 py-2 rounded-xl border text-sm"/>
                <textarea rows="3" required value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} placeholder="Standard Expectations..." className="w-full px-3.5 py-2 rounded-xl border text-sm"/>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600 uppercase">Assign To ({taskAssigneeIds.length})</span>
                    <div className="space-x-2">
                      <button type="button" onClick={() => setTaskAssigneeIds(colleaguesOnly.map((c) => c.id))} className="text-[11px] font-semibold text-indigo-600">All Colleagues</button>
                      <button type="button" onClick={() => setTaskAssigneeIds([])} className="text-[11px] font-semibold text-slate-400">Clear</button>
                    </div>
                  </div>
                  <div className="max-h-40 overflow-y-auto border rounded-xl p-2 space-y-1 bg-slate-50/50">
                    {assignableUsers.map((m) => (
                      <label key={m.id} className="flex items-center justify-between p-1.5 rounded-lg cursor-pointer text-xs">
                        <div className="flex items-center space-x-2"><input type="checkbox" checked={taskAssigneeIds.includes(m.id)} onChange={() => toggleTaskAssignee(m.id)}/><span>{m.name}</span></div>
                        <span className="text-[10px] text-slate-400 capitalize">{m.role.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <label className="flex items-center justify-center space-x-2 w-full py-2 px-3 border border-dashed rounded-xl cursor-pointer text-xs">
                  <Camera className="w-4 h-4 text-indigo-600"/><span>{taskPhoto ? 'Reference Photo Attached' : 'Attach Reference Photo'}</span>
                  <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, setTaskPhoto)} className="hidden"/>
                </label>
                <button type="submit" className={`w-full py-3 text-white font-semibold rounded-xl text-sm ${taskPriority === 'urgent' ? 'bg-rose-600' : 'bg-indigo-600'}`}>Drop Task onto List</button>
              </form>
            </div>

            <div className="lg:col-span-2 space-y-4">
              {/* 1. Waiting to be Reassigned / Paused */}
              <div className="bg-white rounded-2xl border-2 border-orange-200 overflow-hidden">
                <button type="button" onClick={() => toggleSection('reassigned')} className="w-full p-4 bg-orange-50/80 flex items-center justify-between text-left">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center"><AlertTriangle className="w-5 h-5"/></div>
                    <div><h3 className="font-bold text-slate-900 text-sm">Waiting to be Reassigned / Paused</h3><p className="text-[11px] text-orange-800">Incomplete handovers & paused tasks</p></div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded-full bg-orange-200 text-orange-900 font-bold text-xs">{pausedOrHandoverTasks.length}</span>
                    {openSections.reassigned ? <ChevronUp className="w-5 h-5"/> : <ChevronDown className="w-5 h-5"/>}
                  </div>
                </button>
                {openSections.reassigned && (
                  <div className="p-4 space-y-3">
                    {pausedOrHandoverTasks.length === 0 ? <p className="text-xs text-slate-400 italic text-center py-2">None right now.</p> : pausedOrHandoverTasks.map(renderSupervisorTaskCard)}
                  </div>
                )}
              </div>

              {/* 2. Waiting to be Validated */}
              <div className="bg-white rounded-2xl border-2 border-amber-200 overflow-hidden">
                <button type="button" onClick={() => toggleSection('validation')} className="w-full p-4 bg-amber-50/80 flex items-center justify-between text-left">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center"><Bell className="w-5 h-5"/></div>
                    <div><h3 className="font-bold text-slate-900 text-sm">Waiting to be Validated</h3><p className="text-[11px] text-amber-800">Completed tasks ready for sign-off</p></div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded-full bg-amber-200 text-amber-900 font-bold text-xs">{allPendingTasks.length}</span>
                    {openSections.validation ? <ChevronUp className="w-5 h-5"/> : <ChevronDown className="w-5 h-5"/>}
                  </div>
                </button>
                {openSections.validation && (
                  <div className="p-4 space-y-3">
                    {allPendingTasks.length === 0 ? <p className="text-xs text-slate-400 italic text-center py-2">None waiting.</p> : allPendingTasks.map((t) => (
                      <div key={t.id} className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[11px] font-bold">Completed by {t.assigneeName}</span>
                            <h4 className="font-bold text-slate-900 text-sm mt-1">{t.title}</h4>
                            <p className="text-xs text-slate-600">Note: "{t.completionNote || 'None'}"</p>
                          </div>
                          <div className="flex space-x-2">
                            <button onClick={() => handleReturnTask(t)} className="px-3 py-1.5 bg-slate-200 rounded-xl text-xs font-semibold">Send Back</button>
                            <button onClick={() => handleValidateTask(t)} className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold">Validate</button>
                          </div>
                        </div>
                        {t.completionPhoto && <img src={t.completionPhoto} alt="Proof" onClick={() => { setLightboxTitle('Proof Photo'); setLightboxImage(t.completionPhoto); }} className="h-24 w-36 object-cover rounded-xl border-2 border-emerald-500 cursor-pointer"/>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. In Progress */}
              <div className="bg-white rounded-2xl border border-blue-200 overflow-hidden">
                <button type="button" onClick={() => toggleSection('inProgress')} className="w-full p-4 bg-blue-50/70 flex items-center justify-between text-left">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center"><Play className="w-4 h-4 fill-current"/></div>
                    <div><h3 className="font-bold text-slate-900 text-sm">In Progress — Working On It Now</h3><p className="text-[11px] text-blue-800">Actively being worked on shop floor</p></div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded-full bg-blue-200 text-blue-900 font-bold text-xs">{inProgressTasks.length}</span>
                    {openSections.inProgress ? <ChevronUp className="w-5 h-5"/> : <ChevronDown className="w-5 h-5"/>}
                  </div>
                </button>
                {openSections.inProgress && (
                  <div className="p-4 space-y-3">
                    {inProgressTasks.length === 0 ? <p className="text-xs text-slate-400 italic text-center py-2">No tasks currently In Progress.</p> : inProgressTasks.map(renderSupervisorTaskCard)}
                  </div>
                )}
              </div>

              {/* 4. Allocated (Not Started) */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <button type="button" onClick={() => toggleSection('allocated')} className="w-full p-4 bg-slate-100/80 flex items-center justify-between text-left">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-700 text-white flex items-center justify-center"><ClipboardList className="w-5 h-5"/></div>
                    <div><h3 className="font-bold text-slate-900 text-sm">Allocated Tasks — Not Started Yet</h3><p className="text-[11px] text-slate-500">Waiting in colleague queues</p></div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-800 font-bold text-xs">{allocatedNotStartedTasks.length}</span>
                    {openSections.allocated ? <ChevronUp className="w-5 h-5"/> : <ChevronDown className="w-5 h-5"/>}
                  </div>
                </button>
                {openSections.allocated && (
                  <div className="p-4 space-y-3">
                    {allocatedNotStartedTasks.length === 0 ? <p className="text-xs text-slate-400 italic text-center py-2">No unstarted tasks.</p> : allocatedNotStartedTasks.map(renderSupervisorTaskCard)}
                  </div>
                )}
              </div>

              {/* 5. Validated & Archived */}
              <div className="bg-white rounded-2xl border border-emerald-200 overflow-hidden">
                <button type="button" onClick={() => toggleSection('archive')} className="w-full p-4 bg-emerald-50/70 flex items-center justify-between text-left">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center"><Archive className="w-5 h-5"/></div>
                    <div><h3 className="font-bold text-slate-900 text-sm">Validated & Archived History</h3><p className="text-[11px] text-emerald-800">Signed-off department tasks</p></div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-200 text-emerald-900 font-bold text-xs">{allArchivedTasks.length}</span>
                    {openSections.archive ? <ChevronUp className="w-5 h-5"/> : <ChevronDown className="w-5 h-5"/>}
                  </div>
                </button>
                {openSections.archive && (
                  <div className="p-4 space-y-3">
                    {isManager && allArchivedTasks.length > 0 && <button onClick={handleClearArchive} className="text-xs font-semibold text-rose-600 bg-rose-50 px-3 py-1 rounded-lg">Clear Archive</button>}
                    {allArchivedTasks.map((t) => (
                      <div key={t.id} className="py-2 border-b flex items-center justify-between text-xs">
                        <div><p className="font-bold">{t.title}</p><p className="text-slate-500">By {t.assigneeName}{t.handoverFromName ? ` (Started by ${t.handoverFromName})` : ''}</p></div>
                        <span className="text-emerald-600 font-semibold">Validated by {t.validatedByName || 'Manager'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {((activeTab === 'tasks' && !isSupervisor) || activeTab === 'my_tl_tasks') && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
              <h3 className="font-bold text-slate-900 text-base">My Active Tasks ({myAssignedTasks.length})</h3>
              {myAssignedTasks.length === 0 ? <p className="text-xs text-slate-400 italic py-6 text-center">All caught up! No active tasks.</p> : myAssignedTasks.map((t) => {
                const isUrgent = t.priority === 'urgent';
                const isInProgress = t.progressStatus === 'in_progress';
                const isPaused = t.progressStatus === 'paused';
                const isIncomplete = t.progressStatus === 'incomplete';
                return (
                  <div key={t.id} className={`p-5 rounded-xl border space-y-4 ${isUrgent ? 'bg-rose-50/30 border-rose-300' : isPaused ? 'bg-amber-50/30 border-amber-300' : 'bg-white border-slate-200'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {isUrgent && <span className="px-2.5 py-0.5 bg-rose-600 text-white rounded-md text-[11px] font-bold uppercase">Priority / First Job</span>}
                          {isInProgress && <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-md text-[11px] font-bold">In Progress</span>}
                          {isPaused && <span className="px-2.5 py-0.5 bg-amber-200 text-amber-900 rounded-md text-[11px] font-bold">Paused: {t.pauseReason}</span>}
                          {!isInProgress && !isPaused && !isIncomplete && <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[11px] font-semibold">Not Started</span>}
                          {t.handoverFromName && <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded-md text-[11px] font-semibold">Handover from {t.handoverFromName}</span>}
                        </div>
                        <h4 className="font-bold text-slate-900 text-base">{t.title}</h4>
                        <p className="text-xs text-slate-600 whitespace-pre-line">{t.description}</p>
                        {t.handoverNote && <p className="text-xs font-medium text-orange-900 bg-orange-50 p-2 rounded-lg border border-orange-200">Handover Note: "{t.handoverNote}"</p>}
                      </div>
                      <div className="flex flex-wrap sm:flex-col sm:items-end gap-2 shrink-0">
                        {(!isInProgress || isPaused) && (
                          <button onClick={() => handleStartOrResumeTask(t)} className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-xl text-xs flex items-center space-x-1.5">
                            <Play className="w-3.5 h-3.5 fill-current"/><span>{isPaused ? 'Resume Task' : 'Start Task'}</span>
                          </button>
                        )}
                        {isInProgress && (
                          <button onClick={() => { setPausingTask(t); setPauseReason(PAUSE_REASONS[0]); setCustomPauseReason(''); }} className="px-4 py-2 bg-amber-500 text-white font-semibold rounded-xl text-xs flex items-center space-x-1.5">
                            <Pause className="w-3.5 h-3.5"/><span>Pause Task</span>
                          </button>
                        )}
                        {(isInProgress || isPaused) && !isIncomplete && (
                          <button onClick={() => { setHandoverTask(t); setHandoverNote(''); }} className="px-3.5 py-1.5 bg-orange-50 text-orange-700 border border-orange-200 font-semibold rounded-xl text-xs">Handover / Incomplete</button>
                        )}
                        <button onClick={() => setCompletingTask(t)} className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl text-xs flex items-center space-x-2">
                          <Camera className="w-4 h-4"/><span>Complete & Add Photo</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 h-fit space-y-4">
              <h2 className="font-bold text-slate-900 text-base">Submit Request to Manager</h2>
              <form onSubmit={handleCreateRequest} className="space-y-4">
                <select value={reqType} onChange={(e) => setReqType(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white">
                  <option value="Time Off / Holiday">Time Off / Holiday</option>
                  <option value="Shift Swap">Shift Swap</option>
                  <option value="Equipment / Uniform">Equipment / Uniform</option>
                  <option value="General Manager Request">General Manager Request</option>
                </select>
                <input type="text" value={reqDates} onChange={(e) => setReqDates(e.target.value)} placeholder="Relevant Dates (Optional)" className="w-full px-3.5 py-2 rounded-xl border text-sm"/>
                <textarea rows="3" required value={reqNote} onChange={(e) => setReqNote(e.target.value)} placeholder="Request details..." className="w-full px-3.5 py-2 rounded-xl border text-sm"/>
                <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl text-sm">Send Request</button>
              </form>
            </div>
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
              <h2 className="font-bold text-slate-900 text-base">{isSupervisor ? 'All Team Requests' : 'My Requests'}</h2>
              {(isSupervisor ? requests : requests.filter((r) => r.requesterId === currentUser.id)).map((r) => (
                <div key={r.id} className="p-4 rounded-xl border space-y-2 bg-slate-50">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-600">{r.requesterName} • {r.type} {r.dates ? `(${r.dates})` : ''}</span>
                    <span className="font-bold uppercase">{r.status}</span>
                  </div>
                  <p className="text-xs text-slate-700 bg-white p-3 rounded-lg border">{r.note}</p>
                  {isSupervisor && r.status === 'pending' && (
                    <div className="flex gap-2 pt-1">
                      <input type="text" value={managerReplyInputs[r.id] || ''} onChange={(e) => setManagerReplyInputs((p) => ({ ...p, [r.id]: e.target.value }))} placeholder="Reply note..." className="flex-1 px-3 py-1.5 rounded-lg border text-xs bg-white"/>
                      <button onClick={() => handleDecisionRequest(r, 'approved')} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold">Approve</button>
                      <button onClick={() => handleDecisionRequest(r, 'declined')} className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold">Decline</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'users' && isManager && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 h-fit space-y-4">
              <h2 className="font-bold text-slate-900 text-base">Add Team Member</h2>
              <form onSubmit={handleAddUser} className="space-y-4">
                <input type="text" required value={newUserName} onChange={(e) => setNewUserName(e.target.value)} placeholder="Full Name" className="w-full px-3.5 py-2 rounded-xl border text-sm"/>
                <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)} className="w-full px-3.5 py-2 rounded-xl border text-sm bg-white">
                  <option value="colleague">Colleague</option>
                  <option value="team_leader">Team Leader</option>
                  <option value="manager">Manager</option>
                </select>
                <input type="text" required value={newUserPin} onChange={(e) => setNewUserPin(e.target.value)} placeholder="Initial PIN (1234)" className="w-full px-3.5 py-2 rounded-xl border text-sm"/>
                <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl text-sm">Create Account</button>
              </form>
            </div>
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
              <h2 className="font-bold text-slate-900 text-base">Current Team Roster ({teamUsers.length})</h2>
              <div className="divide-y">
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
                        <div><p className="font-bold text-sm text-slate-800">{u.name}</p><p className="text-xs text-slate-500 capitalize">{u.role.replace('_', ' ')} • PIN: {u.pin || '1234'}</p></div>
                        <div className="flex items-center space-x-2">
                          <button onClick={() => { setEditingUserId(u.id); setEditUserName(u.name); setEditUserRole(u.role); setEditUserPin(u.pin || '1234'); }} className="px-3 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg">Edit / PIN</button>
                          {u.id !== currentUser.id && <button onClick={() => handleDeleteUser(u)} className="p-1.5 text-rose-600"><Trash2 className="w-4 h-4"/></button>}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* LocalStorage Terminal QR Codes */}
        <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center"><QrCode className="w-5 h-5"/></div>
              <div>
                <h2 className="font-bold text-slate-900 text-base">{currentUser.name}'s Terminal Login QR Codes</h2>
                <p className="text-xs text-slate-500">Saved privately on this phone only. Scan with your Zebra terminal to log in.</p>
              </div>
            </div>
            {(savedQrEmail || savedQrPassword) && <button onClick={handleClearTerminalQr} className="text-xs font-semibold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl w-fit">Clear Saved QR Codes</button>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <form onSubmit={handleSaveEmailQr} className="space-y-2">
              <label className="block text-xs font-semibold text-slate-600 uppercase">Asda Email Address</label>
              <div className="flex space-x-2">
                <input type="text" value={qrEmailInput} onChange={(e) => setQrEmailInput(e.target.value)} placeholder="firstname.lastname@asda.co.uk" className="flex-1 px-3.5 py-2 rounded-xl border text-sm"/>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl text-xs">Save Email QR</button>
              </div>
            </form>
            <form onSubmit={handleSavePasswordQr} className="space-y-2">
              <label className="block text-xs font-semibold text-slate-600 uppercase">Terminal Password</label>
              <div className="flex space-x-2">
                <input type="password" value={qrPasswordInput} onChange={(e) => setQrPasswordInput(e.target.value)} placeholder="Enter password" className="flex-1 px-3.5 py-2 rounded-xl border text-sm"/>
                <button type="submit" className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-xl text-xs">Save Password QR</button>
              </div>
            </form>
          </div>
          {(savedQrEmail || savedQrPassword) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="p-5 rounded-2xl bg-slate-50 border flex flex-col items-center text-center space-y-3">
                <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 font-bold text-xs uppercase">Email</span>
                {savedQrEmail ? (
                  <>
                    <div onClick={() => { setLightboxTitle('Email QR Code'); setLightboxImage(buildQrCodeUrl(savedQrEmail)); }} className="p-4 bg-white rounded-2xl border-2 cursor-pointer">
                      <img src={buildQrCodeUrl(savedQrEmail)} alt="Email QR" className="w-44 h-44 object-contain"/>
                    </div>
                    <p className="text-xs text-slate-500 font-mono truncate max-w-xs">{savedQrEmail}</p>
                  </>
                ) : <p className="text-xs text-slate-400 italic py-12">No Email QR saved yet.</p>}
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 border flex flex-col items-center text-center space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 rounded-full bg-slate-900 text-white font-bold text-xs uppercase">Password</span>
                  {savedQrPassword && (
                    <button type="button" onClick={() => setRevealPasswordQr(!revealPasswordQr)} className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1">
                      {revealPasswordQr ? <EyeOff className="w-3.5 h-3.5"/> : <Eye className="w-3.5 h-3.5"/>}
                      <span>{revealPasswordQr ? 'Hide' : 'Reveal'}</span>
                    </button>
                  )}
                </div>
                {savedQrPassword ? (
                  <>
                    <div onClick={() => { if (!revealPasswordQr) setRevealPasswordQr(true); else { setLightboxTitle('Password QR Code'); setLightboxImage(buildQrCodeUrl(savedQrPassword)); } }} className="p-4 bg-white rounded-2xl border-2 cursor-pointer relative">
                      <img src={buildQrCodeUrl(savedQrPassword)} alt="Password QR" className={`w-44 h-44 object-contain ${revealPasswordQr ? '' : 'blur-md'}`}/>
                    </div>
                    <p className="text-xs text-slate-500 font-mono">••••••••••••</p>
                  </>
                ) : <p className="text-xs text-slate-400 italic py-12">No Password QR saved yet.</p>}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
