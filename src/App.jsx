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
  VolumeX
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

  // New Task Form State (Manager / Team Leader)
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  const [taskPhoto, setTaskPhoto] = useState(null);

  // Colleague Task Completion Modal State
  const [completingTask, setCompletingTask] = useState(null);
  const [completionNote, setCompletionNote] = useState('');
  const [completionPhoto, setCompletionPhoto] = useState(null);

  // Task Comment Input State (by taskId)
  const [commentInputs, setCommentInputs] = useState({});

  // Photo Lightbox State
  const [lightboxImage, setLightboxImage] = useState(null);

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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFbUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Real-Time Firestore Listeners
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

  // Keep currentUser synced with live Firestore profile updates & persist in localStorage
  useEffect(() => {
    if (!currentUser || teamUsers.length === 0) return;
    const updatedProfile = teamUsers.find((u) => u.id === currentUser.id);
    if (updatedProfile) {
      setCurrentUser(updatedProfile);
      try {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedProfile));
      } catch (err) {
        console.error("Storage save error:", err);
      }
      if ((updatedProfile.fcmTokens || []).length > 0 && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        setFcmEnabled(true);
      }
    } else {
      // If the user's account was deleted by the manager, sign them out cleanly
      setCurrentUser(null);
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [teamUsers]);

  // Calculate visible & unread notifications for current user (excluding ones they cleared)
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

  // Trigger Audible Chime, System Lock-Screen Banner & Toast when a new unread notification arrives
  useEffect(() => {
    if (!currentUser) {
      prevUnreadCountRef.current = null;
      return;
    }

    if (prevUnreadCountRef.current !== null && unreadCount > prevUnreadCountRef.current) {
      if (soundEnabled) {
        playNotificationChime();
      }
      const newestAlert = unreadNotifications[0];
      if (newestAlert) {
        showToast(newestAlert.title, newestAlert.message);
        triggerSystemNotification(newestAlert.title, newestAlert.message);
      }
    }

    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount, currentUser?.id, soundEnabled]);

  // Helper to push a real-time notification AND dispatch hardware FCM background push via /api/send-push
  const sendNotification = async (targetUserId, targetRoleGroup, title, message) => {
    try {
      const notifsRef = collection(db, 'artifacts', appId, 'public', 'data', 'notifications');
      await addDoc(notifsRef, {
        targetUserId: targetUserId || null,
        targetRoleGroup: targetRoleGroup || null,
        title,
        message,
        readBy: [],
        clearedBy: [],
        createdAt: new Date().toISOString()
      });

      // Collect registered FCM push tokens for target user(s)
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
            if (Array.isArray(sup.fcmTokens)) {
              targetTokens.push(...sup.fcmTokens);
            }
          });
      }

      // Call Vercel Serverless Push API to wake closed browsers / locked phones
      if (targetTokens.length > 0) {
        fetch('/api/send-push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tokens: targetTokens,
            title,
            body: message
          })
        }).catch((err) => console.log('Background push dispatch skipped (local dev):', err));
      }
    } catch (err) {
      console.error("Error sending notification:", err);
    }
  };

  // Handle Login with PIN (and save session to localStorage so user stays logged in)
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!loginTarget) return;
    if (pinInput === (loginTarget.pin || '1234')) {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass && !sharedAudioCtx) {
          sharedAudioCtx = new AudioContextClass();
        }
        if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
          sharedAudioCtx.resume();
        }
      } catch (err) {
        console.error(err);
      }

      prevUnreadCountRef.current = null;
      setCurrentUser(loginTarget);
      try {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(loginTarget));
      } catch (err) {
        console.error("Could not save login session:", err);
      }
      setLoginTarget(null);
      setPinInput('');
      setLoginError('');
      setActiveTab('tasks');
    } else {
      setLoginError('Incorrect PIN. Please try again.');
    }
  };

  // Handle Explicit Logout (Clears saved session)
  const handleLogout = () => {
    setCurrentUser(null);
    setShowNotifDropdown(false);
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (err) {
      console.error("Error clearing session:", err);
    }
  };

  // Handle Self-Service PIN Change (For Any Logged-in User)
  const handleSelfPinChange = async (e) => {
    e.preventDefault();
    if (!currentUser || !selfNewPin.trim()) return;

    try {
      const userDoc = doc(db, 'artifacts', appId, 'public', 'data', 'users', currentUser.id);
      await updateDoc(userDoc, {
        pin: selfNewPin.trim()
      });
      setShowPinModal(false);
      setSelfNewPin('');
      showToast("PIN Updated", "Your new login PIN has been saved.");
    } catch (err) {
      console.error("Error updating PIN:", err);
      showToast("Error", "Could not update PIN.");
    }
  };

  // Start Editing a User in Manager Roster
  const startEditUser = (u) => {
    setEditingUserId(u.id);
    setEditUserName(u.name);
    setEditUserRole(u.role);
    setEditUserPin(u.pin || '1234');
  };

  // Save Edited User Details & PIN (Manager Only)
  const handleSaveEditUser = async (userId) => {
    if (!editUserName.trim() || !editUserPin.trim()) return;
    try {
      const userDoc = doc(db, 'artifacts', appId, 'public', 'data', 'users', userId);
      await updateDoc(userDoc, {
        name: editUserName.trim(),
        role: editUserRole,
        pin: editUserPin.trim()
      });
      setEditingUserId(null);
      showToast("Profile Updated", `Saved changes and PIN for ${editUserName.trim()}.`);
    } catch (err) {
      console.error("Error editing user:", err);
      showToast("Error", "Could not update user profile.");
    }
  };

  // Photo Upload Handler
  const handlePhotoUpload = async (e, setter) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setter(compressed);
    } catch (err) {
      console.error("Image compression error:", err);
      showToast("Photo Error", "Could not process photo.");
    }
  };

  // Assign New Task (Manager & Team Leaders)
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskAssigneeId) return;
    const assigneeObj = teamUsers.find((u) => u.id === taskAssigneeId);
    if (!assigneeObj) return;

    try {
      const tasksRef = collection(db, 'artifacts', appId, 'public', 'data', 'tasks');
      await addDoc(tasksRef, {
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        assigneeId: assigneeObj.id,
        assigneeName: assigneeObj.name,
        assigneeRole: assigneeObj.role,
        createdById: currentUser.id,
        createdByName: currentUser.name,
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
        'New Task Assigned',
        `${currentUser.name} assigned "${taskTitle.trim()}" to you.`
      );

      setTaskTitle('');
      setTaskDesc('');
      setTaskPhoto(null);
      showToast("Task Assigned", `Dropped onto ${assigneeObj.name}'s list.`);
    } catch (err) {
      console.error("Error creating task:", err);
    }
  };

  // Submit Task Completion with Photo & Comment
  const handleConfirmCompletion = async (e) => {
    e.preventDefault();
    if (!completingTask) return;

    try {
      const taskDoc = doc(db, 'artifacts', appId, 'public', 'data', 'tasks', completingTask.id);
      await updateDoc(taskDoc, {
        status: 'pending_validation',
        completionNote: completionNote.trim(),
        completionPhoto: completionPhoto || null,
        completedAt: new Date().toISOString()
      });

      await sendNotification(
        null,
        'supervisors',
        'Task Ready for Validation',
        `${currentUser.name} completed "${completingTask.title}".`
      );

      setCompletingTask(null);
      setCompletionNote('');
      setCompletionPhoto(null);
      showToast("Sent for Validation", "Manager and Team Leaders have been alerted.");
    } catch (err) {
      console.error("Error completing task:", err);
    }
  };

  // Validate & Archive Task
  const handleValidateTask = async (task) => {
    try {
      const taskDoc = doc(db, 'artifacts', appId, 'public', 'data', 'tasks', task.id);
      await updateDoc(taskDoc, {
        status: 'archived',
        validatedByName: currentUser.name,
        validatedAt: new Date().toISOString()
      });

      await sendNotification(
        task.assigneeId,
        null,
        'Task Validated',
        `${currentUser.name} validated and archived "${task.title}".`
      );

      showToast("Task Validated", "Moved to the archived log.");
    } catch (err) {
      console.error("Error validating task:", err);
    }
  };

  // Send Task Back for Revision
  const handleReturnTask = async (task) => {
    try {
      const taskDoc = doc(db, 'artifacts', appId, 'public', 'data', 'tasks', task.id);
      await updateDoc(taskDoc, {
        status: 'active',
        completedAt: null
      });

      await sendNotification(
        task.assigneeId,
        null,
        'Revision Requested',
        `${currentUser.name} sent "${task.title}" back to your active list.`
      );

      showToast("Returned to Colleague", "Task moved back to active status.");
    } catch (err) {
      console.error("Error returning task:", err);
    }
  };

  // Add Comment to a Task
  const handleAddComment = async (task) => {
    const text = (commentInputs[task.id] || '').trim();
    if (!text) return;

    const updatedComments = [
      ...(task.comments || []),
      {
        id: Date.now().toString(),
        authorName: currentUser.name,
        authorRole: currentUser.role,
        text,
        createdAt: new Date().toISOString()
      }
    ];

    try {
      const taskDoc = doc(db, 'artifacts', appId, 'public', 'data', 'tasks', task.id);
      await updateDoc(taskDoc, { comments: updatedComments });
      setCommentInputs((prev) => ({ ...prev, [task.id]: '' }));

      if (currentUser.id !== task.assigneeId) {
        await sendNotification(task.assigneeId, null, 'New Task Comment', `${currentUser.name} commented on "${task.title}".`);
      } else {
        await sendNotification(null, 'supervisors', 'New Colleague Comment', `${currentUser.name} commented on "${task.title}".`);
      }
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  // Submit Manager Request (Colleague / Team Leader)
  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!reqNote.trim()) return;

    try {
      const reqsRef = collection(db, 'artifacts', appId, 'public', 'data', 'requests');
      await addDoc(reqsRef, {
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

      await sendNotification(
        null,
        'supervisors',
        'New Manager Request',
        `${currentUser.name} submitted a ${reqType} request.`
      );

      setReqDates('');
      setReqNote('');
      showToast("Request Sent", "Your request has been sent to management.");
    } catch (err) {
      console.error("Error submitting request:", err);
    }
  };

  // Approve or Decline Manager Request
  const handleDecisionRequest = async (req, newStatus) => {
    const reply = (managerReplyInputs[req.id] || '').trim();
    try {
      const reqDoc = doc(db, 'artifacts', appId, 'public', 'data', 'requests', req.id);
      await updateDoc(reqDoc, {
        status: newStatus,
        managerReply: reply,
        reviewedBy: currentUser.name,
        reviewedAt: new Date().toISOString()
      });

      await sendNotification(
        req.requesterId,
        null,
        `Request ${newStatus === 'approved' ? 'Approved' : 'Declined'}`,
        `${currentUser.name} ${newStatus} your ${req.type} request.`
      );

      showToast("Request Updated", `Marked as ${newStatus}.`);
    } catch (err) {
      console.error("Error updating request:", err);
    }
  };

  // Manager: Add New User
  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserPin.trim()) return;
    const newId = `user-${Date.now()}`;
    const randomColor = AVATAR_COLORS[teamUsers.length % AVATAR_COLORS.length];

    try {
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
    } catch (err) {
      console.error("Error adding user:", err);
    }
  };

  // Manager: Delete User
  const handleDeleteUser = async (u) => {
    if (u.id === currentUser.id) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', u.id));
      showToast("User Removed", `${u.name} has been removed.`);
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  // Clear Archived Tasks
  const handleClearArchive = async () => {
    const archived = tasks.filter((t) => t.status === 'archived');
    for (const t of archived) {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', t.id));
    }
    showToast("Archive Cleared", "All archived tasks removed.");
  };

  // Mark Single Notification as Read
  const markNotifRead = async (notif) => {
    if (!currentUser) return;
    const readList = notif.readBy || [];
    if (!readList.includes(currentUser.id)) {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'notifications', notif.id), {
        readBy: arrayUnion(currentUser.id)
      });
    }
  };

  // Dismiss a Single Notification
  const handleDismissNotification = async (e, notif) => {
    e.stopPropagation();
    if (!currentUser) return;
    try {
      const notifDoc = doc(db, 'artifacts', appId, 'public', 'data', 'notifications', notif.id);
      if (notif.targetUserId === currentUser.id) {
        await deleteDoc(notifDoc);
      } else {
        await updateDoc(notifDoc, {
          clearedBy: arrayUnion(currentUser.id),
          readBy: arrayUnion(currentUser.id)
        });
      }
    } catch (err) {
      console.error("Error dismissing notification:", err);
    }
  };

  // Clear All Notifications for Current User
  const handleClearAllNotifications = async () => {
    if (!currentUser || myNotifications.length === 0) return;
    try {
      for (const notif of myNotifications) {
        const notifDoc = doc(db, 'artifacts', appId, 'public', 'data', 'notifications', notif.id);
        if (notif.targetUserId === currentUser.id) {
          await deleteDoc(notifDoc);
        } else {
          await updateDoc(notifDoc, {
            clearedBy: arrayUnion(currentUser.id),
            readBy: arrayUnion(currentUser.id)
          });
        }
      }
      showToast("Notifications Cleared", "Your notification list has been cleared.");
    } catch (err) {
      console.error("Error clearing notifications:", err);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Loading Workspace...</span>
        </div>
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
            <div className="w-14 h-14 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Layers className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">TaskFlow Team Portal</h1>
            <p className="text-xs text-indigo-200">Select your name below to log into your private workspace</p>
          </div>

          {/* PIN Login Modal */}
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
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs text-indigo-200 mb-1">Enter Security PIN</label>
                  <input
                    type="password"
                    autoFocus
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="••••"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                {loginError && <p className="text-xs text-rose-400 font-medium">{loginError}</p>}
                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold text-sm transition-all">
                  Unlock & Stay Signed In
                </button>
              </form>
            </div>
          )}

          {/* Role Sections */}
          <div className="space-y-5">
            {/* Manager */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-300 block">Manager</span>
              <div className="grid grid-cols-1 gap-2.5">
                {managers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => { setLoginTarget(u); setPinInput(''); setLoginError(''); }}
                    className="w-full p-3.5 rounded-2xl bg-indigo-600/80 hover:bg-indigo-600 border border-indigo-400/30 transition-all flex items-center justify-between group">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-bold text-sm">{u.name}</h3>
                        <p className="text-[11px] text-indigo-200">Full Store Oversight, Validation & User Admin</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-indigo-200 group-hover:translate-x-1 transition-transform" />
                  </button>
                ))}
              </div>
            </div>

            {/* Team Leaders */}
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
                    <Lock className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Colleagues */}
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
  // PERMISSIONS & FILTERED DATA
  // ==========================================
  const isManager = currentUser.role === 'manager';

  const assignableUsers = teamUsers.filter((u) => {
    if (isManager) return u.role === 'team_leader' || u.role === 'colleague';
    if (currentUser.role === 'team_leader') return u.role === 'colleague';
    return false;
  });

  const myAssignedTasks = tasks.filter((t) => t.assigneeId === currentUser.id && t.status === 'active');
  const myPendingTasks = tasks.filter((t) => t.assigneeId === currentUser.id && t.status === 'pending_validation');
  const myArchivedTasks = tasks.filter((t) => t.assigneeId === currentUser.id && t.status === 'archived');

  const allActiveTasks = tasks.filter((t) => t.status === 'active');
  const allPendingTasks = tasks.filter((t) => t.status === 'pending_validation');
  const allArchivedTasks = tasks.filter((t) => t.status === 'archived');

  const pendingRequestsCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center space-x-3 border border-slate-800">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <div>
              <h4 className="text-xs font-semibold">{toast.title}</h4>
              <p className="text-xs text-slate-300">{toast.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Photo Lightbox */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer">
          <img src={lightboxImage} alt="Task attachment" className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl" />
        </div>
      )}

      {/* Self-Service Change PIN Modal (Available to Any Logged-in User) */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Change My Login PIN</h3>
              </div>
              <button onClick={() => setShowPinModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSelfPinChange} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Current PIN: <span className="font-mono text-indigo-600">{currentUser.pin || '1234'}</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={selfNewPin}
                  onChange={(e) => setSelfNewPin(e.target.value)}
                  placeholder="Enter new PIN (e.g. 5678)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold">
                  Save New PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Colleague Task Completion Modal (Photo + Note) */}
      {completingTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Complete Task & Attach Proof</h3>
              <button onClick={() => setCompletingTask(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCompletion} className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs font-bold text-slate-800">{completingTask.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{completingTask.description}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Completion Notes / Comments</label>
                <textarea
                  rows="3"
                  required
                  value={completionNote}
                  onChange={(e) => setCompletionNote(e.target.value)}
                  placeholder="Add notes for manager validation..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Upload Completion Photo</label>
                <label className="flex items-center justify-center space-x-2 w-full py-3 px-4 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/30 transition-all">
                  <Camera className="w-5 h-5 text-indigo-600" />
                  <span className="text-xs font-semibold text-slate-700">
                    {completionPhoto ? 'Change Photo' : 'Take or Upload Photo'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handlePhotoUpload(e, setCompletionPhoto)}
                    className="hidden"
                  />
                </label>
                {completionPhoto && (
                  <img src={completionPhoto} alt="Preview" className="mt-2 h-32 w-full object-cover rounded-xl border border-slate-200" />
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCompletingTask(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center space-x-1.5">
                  <Check className="w-4 h-4" />
                  <span>Submit for Validation</span>
                </button>
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
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-base text-slate-900 leading-tight">TaskFlow Pro</h1>
              <p className="text-[11px] text-slate-500 font-medium capitalize">
                {currentUser.name} • {currentUser.role.replace('_', ' ')}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-2.5">
            {/* Native Lock-Screen FCM Push Permission Button */}
            <button
              onClick={handleEnableLockScreenAlerts}
              title="Enable Phone Lock-Screen Push Notifications"
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1 ${
                fcmEnabled
                  ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                  : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
              }`}>
              <BellRing className="w-3.5 h-3.5" />
              <span className="hidden md:inline">
                {fcmEnabled ? 'Lock Push Active' : 'Enable Lock Alerts'}
              </span>
            </button>

            {/* Audible Chime Toggle & Test Button */}
            <button
              onClick={() => {
                const nextState = !soundEnabled;
                setSoundEnabled(nextState);
                if (nextState) {
                  playNotificationChime();
                  showToast("Sound Alerts On", "Audible notification chime enabled.");
                } else {
                  showToast("Sound Muted", "Audible notification chime muted.");
                }
              }}
              title="Toggle Audible Notification Chime"
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1 ${
                soundEnabled
                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}>
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{soundEnabled ? 'Sound On' : 'Muted'}</span>
            </button>

            {/* Change My PIN Button */}
            <button
              onClick={() => {
                setSelfNewPin(currentUser.pin || '1234');
                setShowPinModal(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Change PIN</span>
            </button>

            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 relative transition-all">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-xs text-slate-800">
                      Notifications ({myNotifications.length})
                    </span>
                    <div className="flex items-center space-x-2.5">
                      {myNotifications.length > 0 && (
                        <button
                          onClick={handleClearAllNotifications}
                          className="text-[11px] text-rose-600 font-semibold hover:underline flex items-center space-x-1">
                          <Trash2 className="w-3 h-3" />
                          <span>Clear All</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          playNotificationChime();
                          triggerSystemNotification("TaskFlow Test Alert", "Lock-screen banner and sound test.");
                        }}
                        className="text-[11px] text-indigo-600 font-semibold hover:underline">
                        Test Alert
                      </button>
                      <button onClick={() => setShowNotifDropdown(false)} className="text-xs text-slate-400 hover:text-slate-600">
                        Close
                      </button>
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {myNotifications.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-3 text-center">No notifications yet.</p>
                    ) : (
                      myNotifications.slice(0, 15).map((n) => {
                        const isUnread = !(n.readBy || []).includes(currentUser.id);
                        return (
                          <div
                            key={n.id}
                            onClick={() => markNotifRead(n)}
                            className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start justify-between gap-2 ${
                              isUnread ? 'bg-indigo-50/70 border-indigo-200' : 'bg-slate-50 border-slate-100 text-slate-500'
                            }`}>
                            <div className="flex-1">
                              <div className="flex items-center space-x-1.5">
                                <span className="font-bold text-slate-800">{n.title}</span>
                                {isUnread && <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0"></span>}
                              </div>
                              <p className="text-[11px] mt-0.5">{n.message}</p>
                            </div>
                            <button
                              onClick={(e) => handleDismissNotification(e, n)}
                              title="Dismiss notification"
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all shrink-0">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold transition-all flex items-center space-x-1.5">
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-2 border-t border-slate-100 py-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'tasks' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}>
            {isSupervisor ? 'Team Task Board & Validation' : 'My Assigned Tasks'}
          </button>

          {currentUser.role === 'team_leader' && (
            <button
              onClick={() => setActiveTab('my_tl_tasks')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === 'my_tl_tasks' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}>
              <span>Tasks From Manager</span>
              {myAssignedTasks.length > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-400 text-slate-900 rounded-full text-[10px] font-bold">
                  {myAssignedTasks.length}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setActiveTab('requests')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
              activeTab === 'requests' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}>
            <Calendar className="w-3.5 h-3.5" />
            <span>{isSupervisor ? 'Colleague Requests' : 'Manager Requests'}</span>
            {isSupervisor && pendingRequestsCount > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-bold">
                {pendingRequestsCount}
              </span>
            )}
          </button>

          {isManager && (
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === 'users' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}>
              <UserPlus className="w-3.5 h-3.5" />
              <span>Manage Team ({teamUsers.length})</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ================= SUPERVISOR TASK BOARD (MANAGER & TEAM LEADERS) ================= */}
        {activeTab === 'tasks' && isSupervisor && (
          <div className="space-y-8">
            {/* Summary Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase">Active Team Tasks</p>
                  <h3 className="text-2xl font-bold text-slate-800 mt-1">{allActiveTasks.length}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase">Pending Validation</p>
                  <h3 className="text-2xl font-bold text-amber-600 mt-1">{allPendingTasks.length}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Bell className="w-6 h-6" />
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase">Validated & Archived</p>
                  <h3 className="text-2xl font-bold text-emerald-600 mt-1">{allArchivedTasks.length}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Archive className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Assign Task Form with Reference Photo */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 h-fit space-y-5">
                <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </div>
                  <h2 className="font-bold text-slate-800 text-base">Assign New Task</h2>
                </div>

                <form onSubmit={handleCreateTask} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Task Title</label>
                    <input
                      type="text"
                      required
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      placeholder="e.g. End-Cap Promotional Restock"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Instructions / Manager Comments</label>
                    <textarea
                      rows="3"
                      required
                      value={taskDesc}
                      onChange={(e) => setTaskDesc(e.target.value)}
                      placeholder="Add specific details or expectations..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Assign To</label>
                    <select
                      required
                      value={taskAssigneeId}
                      onChange={(e) => setTaskAssigneeId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white">
                      <option value="">Select team member...</option>
                      {assignableUsers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.role.replace('_', ' ')})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Reference Photo (Optional)</label>
                    <label className="flex items-center justify-center space-x-2 w-full py-2.5 px-3 border border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50">
                      <Camera className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs font-medium text-slate-600">
                        {taskPhoto ? 'Photo Attached (Click to change)' : 'Attach Reference Photo'}
                      </span>
                      <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, setTaskPhoto)} className="hidden" />
                    </label>
                    {taskPhoto && (
                      <img src={taskPhoto} alt="Task preview" className="mt-2 h-24 w-full object-cover rounded-xl border" />
                    )}
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-md transition-all flex items-center justify-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>Drop onto Member List</span>
                  </button>
                </form>
              </div>

              {/* Validation Queue & Active Team Board */}
              <div className="lg:col-span-2 space-y-8">
                {/* Pending Validation Queue */}
                <div className="bg-amber-50/70 rounded-2xl p-6 border border-amber-200 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-amber-200">
                    <div>
                      <h2 className="font-bold text-slate-900 text-base">Pending Remote Validation</h2>
                      <p className="text-xs text-amber-800">Inspect colleague completion photos and notes before archiving.</p>
                    </div>
                    <span className="px-2.5 py-1 bg-amber-200 text-amber-900 rounded-full text-xs font-bold">
                      {allPendingTasks.length} Pending
                    </span>
                  </div>

                  {allPendingTasks.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs italic">
                      <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      No completed tasks waiting for validation.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {allPendingTasks.map((t) => (
                        <div key={t.id} className="bg-white p-5 rounded-xl border border-amber-200 shadow-xs space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[11px] font-semibold">
                                Completed by {t.assigneeName}
                              </span>
                              <h4 className="font-bold text-slate-900 text-base mt-1">{t.title}</h4>
                              <p className="text-xs text-slate-600">{t.description}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleReturnTask(t)}
                                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center space-x-1">
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Send Back</span>
                              </button>
                              <button
                                onClick={() => handleValidateTask(t)}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs flex items-center space-x-1.5">
                                <Check className="w-4 h-4" />
                                <span>Validate & Archive</span>
                              </button>
                            </div>
                          </div>

                          {/* Colleague Completion Proof */}
                          <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2">
                            <p className="text-xs font-bold text-emerald-900">Colleague Completion Note:</p>
                            <p className="text-xs text-slate-700">{t.completionNote || 'No note provided.'}</p>
                            <div className="flex flex-wrap gap-3 pt-1">
                              {t.managerPhoto && (
                                <div>
                                  <span className="text-[10px] font-semibold text-slate-500 block mb-1">Reference Photo:</span>
                                  <img
                                    src={t.managerPhoto}
                                    alt="Reference"
                                    onClick={() => setLightboxImage(t.managerPhoto)}
                                    className="h-24 w-32 object-cover rounded-lg border cursor-pointer hover:opacity-90"
                                  />
                                </div>
                              )}
                              {t.completionPhoto && (
                                <div>
                                  <span className="text-[10px] font-semibold text-emerald-700 block mb-1">Completed Proof Photo (Click to enlarge):</span>
                                  <img
                                    src={t.completionPhoto}
                                    alt="Completed Proof"
                                    onClick={() => setLightboxImage(t.completionPhoto)}
                                    className="h-24 w-32 object-cover rounded-lg border-2 border-emerald-500 cursor-pointer hover:opacity-90"
                                  />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Comments Thread */}
                          <div className="space-y-2 pt-2 border-t border-slate-100">
                            {(t.comments || []).map((c) => (
                              <div key={c.id} className="text-xs bg-slate-50 p-2 rounded-lg">
                                <span className="font-bold text-slate-800">{c.authorName}: </span>
                                <span className="text-slate-600">{c.text}</span>
                              </div>
                            ))}
                            <div className="flex space-x-2">
                              <input
                                type="text"
                                value={commentInputs[t.id] || ''}
                                onChange={(e) => setCommentInputs((prev) => ({ ...prev, [t.id]: e.target.value }))}
                                placeholder="Add a comment or feedback..."
                                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                              />
                              <button
                                onClick={() => handleAddComment(t)}
                                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold">
                                Send
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Active Team Workload */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
                  <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
                    <Users className="w-5 h-5 text-blue-600" />
                    <h2 className="font-bold text-slate-900 text-base">Active Team Workload</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {assignableUsers.map((member) => {
                      const memberActive = allActiveTasks.filter((t) => t.assigneeId === member.id);
                      return (
                        <div key={member.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className={`w-7 h-7 rounded-lg ${member.color || 'bg-blue-600'} text-white font-bold flex items-center justify-center text-xs`}>
                                {member.name[0]}
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-800 text-xs">{member.name}</h4>
                                <p className="text-[10px] text-slate-400 capitalize">{member.role.replace('_', ' ')}</p>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold">
                              {memberActive.length} Active
                            </span>
                          </div>
                          <div className="space-y-2">
                            {memberActive.length === 0 ? (
                              <p className="text-xs text-slate-400 italic">No active tasks.</p>
                            ) : (
                              memberActive.map((t) => (
                                <div key={t.id} className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                                  <p className="font-semibold text-slate-800">{t.title}</p>
                                  <p className="text-slate-500 text-[11px]">{t.description}</p>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Archived Tasks Log */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <Archive className="w-5 h-5 text-emerald-600" />
                  <h2 className="font-bold text-slate-900 text-base">Archived Tasks History Log</h2>
                </div>
                {isManager && allArchivedTasks.length > 0 && (
                  <button
                    onClick={handleClearArchive}
                    className="text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg">
                    Clear Archive
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Task</th>
                      <th className="py-3 px-4">Assignee</th>
                      <th className="py-3 px-4">Completion Note</th>
                      <th className="py-3 px-4">Proof Photo</th>
                      <th className="py-3 px-4">Validated By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allArchivedTasks.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-6 text-slate-400 text-xs italic">
                          No archived tasks yet.
                        </td>
                      </tr>
                    ) : (
                      allArchivedTasks.map((t) => (
                        <tr key={t.id}>
                          <td className="py-3 px-4 font-semibold text-slate-800 text-xs">{t.title}</td>
                          <td className="py-3 px-4 text-xs">{t.assigneeName}</td>
                          <td className="py-3 px-4 text-xs text-slate-600">{t.completionNote || '-'}</td>
                          <td className="py-3 px-4">
                            {t.completionPhoto ? (
                              <button
                                onClick={() => setLightboxImage(t.completionPhoto)}
                                className="text-xs text-indigo-600 font-semibold underline">
                                View Photo
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400">None</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-xs text-emerald-600 font-medium">
                            {t.validatedByName || 'Manager'} ({t.validatedAt ? new Date(t.validatedAt).toLocaleDateString() : ''})
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
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
                  <h3 className="font-bold text-slate-900 text-base">My Active Tasks</h3>
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold">
                    {myAssignedTasks.length} Active
                  </span>
                </div>

                {myAssignedTasks.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                    <h4 className="font-bold text-slate-700 text-sm">All caught up!</h4>
                    <p className="text-xs text-slate-400 mt-1">You have no active tasks on your list right now.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myAssignedTasks.map((t) => (
                      <div key={t.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1.5">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[11px] font-semibold">
                              Assigned by {t.createdByName || 'Manager'}
                            </span>
                            <h4 className="font-bold text-slate-900 text-base">{t.title}</h4>
                            <p className="text-xs text-slate-600 leading-relaxed">{t.description}</p>
                            {t.managerPhoto && (
                              <div className="pt-2">
                                <p className="text-[11px] font-semibold text-slate-500 mb-1">Manager Reference Photo (Click to enlarge):</p>
                                <img
                                  src={t.managerPhoto}
                                  alt="Reference"
                                  onClick={() => setLightboxImage(t.managerPhoto)}
                                  className="h-28 w-40 object-cover rounded-xl border cursor-pointer"
                                />
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => setCompletingTask(t)}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-md flex items-center justify-center space-x-2 shrink-0">
                            <Camera className="w-4 h-4" />
                            <span>Complete & Add Photo</span>
                          </button>
                        </div>

                        {/* Task Comments */}
                        <div className="space-y-2 pt-3 border-t border-slate-100">
                          {(t.comments || []).map((c) => (
                            <div key={c.id} className="text-xs bg-slate-50 p-2 rounded-lg">
                              <span className="font-bold text-slate-800">{c.authorName}: </span>
                              <span className="text-slate-600">{c.text}</span>
                            </div>
                          ))}
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              value={commentInputs[t.id] || ''}
                              onChange={(e) => setCommentInputs((prev) => ({ ...prev, [t.id]: e.target.value }))}
                              placeholder="Ask a question or leave a comment..."
                              className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                            />
                            <button
                              onClick={() => handleAddComment(t)}
                              className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold">
                              Comment
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Colleague Pending & Validated Sidebar */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
                <h3 className="font-bold text-slate-900 text-sm">Awaiting Manager Validation ({myPendingTasks.length})</h3>
                <div className="space-y-3">
                  {myPendingTasks.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No tasks awaiting review.</p>
                  ) : (
                    myPendingTasks.map((t) => (
                      <div key={t.id} className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 text-xs">{t.title}</span>
                          <span className="px-2 py-0.5 bg-amber-200 text-amber-800 rounded text-[10px] font-semibold">In Review</span>
                        </div>
                        <p className="text-[11px] text-slate-600">{t.completionNote}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
                <h3 className="font-bold text-slate-900 text-sm">Validated & Completed ({myArchivedTasks.length})</h3>
                <div className="space-y-3">
                  {myArchivedTasks.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No validated tasks yet.</p>
                  ) : (
                    myArchivedTasks.map((t) => (
                      <div key={t.id} className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 text-xs">{t.title}</span>
                          <span className="px-2 py-0.5 bg-emerald-200 text-emerald-800 rounded text-[10px] font-semibold">Approved</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= MANAGER REQUESTS TAB ================= */}
        {activeTab === 'requests' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Submit a Request Form */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 h-fit space-y-4">
              <h2 className="font-bold text-slate-900 text-base">Submit Request to Manager</h2>
              <form onSubmit={handleCreateRequest} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Request Category</label>
                  <select
                    value={reqType}
                    onChange={(e) => setReqType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white">
                    <option value="Time Off / Holiday">Time Off / Holiday</option>
                    <option value="Shift Swap">Shift Swap</option>
                    <option value="Equipment / Uniform">Equipment / Uniform</option>
                    <option value="General Manager Request">General Manager Request</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Relevant Dates (Optional)</label>
                  <input
                    type="text"
                    value={reqDates}
                    onChange={(e) => setReqDates(e.target.value)}
                    placeholder="e.g. 14th Nov - 18th Nov"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Request Message</label>
                  <textarea
                    rows="3"
                    required
                    value={reqNote}
                    onChange={(e) => setReqNote(e.target.value)}
                    placeholder="e.g. Can you look at approving my time off..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm flex items-center justify-center space-x-2">
                  <Send className="w-4 h-4" />
                  <span>Send Request</span>
                </button>
              </form>
            </div>

            {/* Requests List */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
              <h2 className="font-bold text-slate-900 text-base">
                {isSupervisor ? 'All Team Requests' : 'My Submitted Requests'}
              </h2>
              <div className="space-y-4">
                {(isSupervisor ? requests : requests.filter((r) => r.requesterId === currentUser.id)).length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-6 text-center">No requests submitted yet.</p>
                ) : (
                  (isSupervisor ? requests : requests.filter((r) => r.requesterId === currentUser.id)).map((r) => (
                    <div key={r.id} className="p-4 rounded-xl border border-slate-200 space-y-3 bg-slate-50/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-indigo-600">{r.requesterName}</span>
                          <span className="mx-2 text-slate-300">•</span>
                          <span className="text-xs font-semibold text-slate-700">{r.type}</span>
                          {r.dates && <span className="ml-2 text-xs text-slate-500">({r.dates})</span>}
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                            r.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.status === 'declined'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                          {r.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-100">{r.note}</p>

                      {r.managerReply && (
                        <p className="text-xs text-indigo-900 bg-indigo-50 p-2.5 rounded-lg">
                          <span className="font-bold">Manager Response ({r.reviewedBy}): </span>
                          {r.managerReply}
                        </p>
                      )}

                      {isSupervisor && r.status === 'pending' && (
                        <div className="flex flex-col sm:flex-row gap-2 pt-2">
                          <input
                            type="text"
                            value={managerReplyInputs[r.id] || ''}
                            onChange={(e) => setManagerReplyInputs((prev) => ({ ...prev, [r.id]: e.target.value }))}
                            placeholder="Optional reply note..."
                            className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                          />
                          <button
                            onClick={() => handleDecisionRequest(r, 'approved')}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold">
                            Approve
                          </button>
                          <button
                            onClick={() => handleDecisionRequest(r, 'declined')}
                            className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold">
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= USER MANAGEMENT TAB (MANAGER ONLY) ================= */}
        {activeTab === 'users' && isManager && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 h-fit space-y-4">
              <h2 className="font-bold text-slate-900 text-base">Add Colleague or Team Leader</h2>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="e.g. Jordan Smith"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Role</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white">
                    <option value="colleague">Colleague (Sees Own Tasks & Requests)</option>
                    <option value="team_leader">Team Leader (Supervisor + Receives Manager Tasks)</option>
                    <option value="manager">Manager (Full Admin)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Initial Login PIN</label>
                  <input
                    type="text"
                    required
                    value={newUserPin}
                    onChange={(e) => setNewUserPin(e.target.value)}
                    placeholder="1234"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm flex items-center justify-center space-x-2">
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account</span>
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
              <div>
                <h2 className="font-bold text-slate-900 text-base">Current Team Roster ({teamUsers.length})</h2>
                <p className="text-xs text-slate-500">Click Edit / PIN on any user to update their name, role, or security PIN.</p>
              </div>

              <div className="divide-y divide-slate-100">
                {teamUsers.map((u) => (
                  <div key={u.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {editingUserId === u.id ? (
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 bg-indigo-50/60 p-3 rounded-xl border border-indigo-200">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Name</label>
                          <input
                            type="text"
                            value={editUserName}
                            onChange={(e) => setEditUserName(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Role</label>
                          <select
                            value={editUserRole}
                            onChange={(e) => setEditUserRole(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white">
                            <option value="colleague">Colleague</option>
                            <option value="team_leader">Team Leader</option>
                            <option value="manager">Manager</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Login PIN</label>
                          <div className="flex items-center space-x-1.5">
                            <input
                              type="text"
                              value={editUserPin}
                              onChange={(e) => setEditUserPin(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-mono bg-white"
                            />
                            <button
                              onClick={() => handleSaveEditUser(u.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shrink-0">
                              Save
                            </button>
                            <button
                              onClick={() => setEditingUserId(null)}
                              className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold shrink-0">
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center space-x-3">
                          <div className={`w-9 h-9 rounded-xl ${u.color || 'bg-indigo-600'} text-white font-bold flex items-center justify-center text-xs`}>
                            {u.name[0]}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-slate-800">{u.name}</p>
                            <p className="text-xs text-slate-500 capitalize">
                              Role: {u.role.replace('_', ' ')} • PIN: <span className="font-mono font-semibold text-indigo-600">{u.pin || '1234'}</span>
                              {(u.fcmTokens || []).length > 0 && (
                                <span className="ml-2 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-semibold">
                                  Push Linked
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => startEditUser(u)}
                            className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all flex items-center space-x-1">
                            <Lock className="w-3.5 h-3.5" />
                            <span>Edit / PIN</span>
                          </button>
                          {u.id !== currentUser.id && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              title="Delete User">
                              <Trash2 className="w-4 h-4" />
                            </button>
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
      </main>
    </div>
  );
}
