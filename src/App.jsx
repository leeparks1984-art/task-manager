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
  { id: 'custom', label: 'Custom', title: '', description: '' },
  { id: 'waste', label: 'Waste', title: 'Waste', description: 'Process all damages, splits, and out-of-date stock. Clear waste area and upload photo.' },
  { id: 'drop_tops', label: 'Drop Tops', title: 'Drop Tops', description: 'Pull down top-stock to fill shelf gaps, face up, and upload completion photo.' },
  { id: 'gifting', label: 'Gifting', title: 'Gifting', description: 'Replenish and dress gifting bays, check price labels, and upload photo.' },
  { id: 'hb', label: 'H&B', title: 'H&B', description: 'Work Health & Beauty delivery/backstock, check security tags, and upload photo.' },
  { id: 'horseshoe', label: 'Horseshoe', title: 'Horseshoe', description: 'Work and replenish Horseshoe area, keep promotional lines faced, and upload photo.' },
  { id: 'modular_compliance', label: 'Modular Compliance', title: 'Modular Compliance', description: 'Check bays against modular plan, align SELs/ESLs to left edge, and upload photo.' },
  { id: 'camera_tasks', label: 'Camera Tasks', title: 'Camera Tasks', description: 'Action overhead camera gap/stock alerts and upload resolution photo.' },
  { id: 'promo', label: 'Promo', title: 'Promo', description: 'Replenish promotional end-caps, verify barkers/POS, and upload photo.' }
];

const PAUSE_REASONS = ['Called to Checkouts', 'Pulled to Urgent Job', 'On Break', 'Helping Customer', 'Warehouse Delivery'];

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

const buildQrUrl = (val) => val ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=16&data=${encodeURIComponent(val)}` : '';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY)); } catch { return null; }
  });
  const [loginTarget, setLoginTarget] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
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
  const [handoverTask, setHandoverTask] = useState(null);
  const [handoverNote, setHandoverNote] = useState('');
  const [completingTask, setCompletingTask] = useState(null);
  const [completionNote, setCompletionNote] = useState('');
  const [completionPhoto, setCompletionPhoto] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [lightboxTitle, setLightboxTitle] = useState('');

  const [reqType, setReqType] = useState('Time Off / Holiday');
  const [reqDates, setReqDates] = useState('');
  const [reqNote, setReqNote] = useState('');
  const [managerReplyInputs, setManagerReplyInputs] = useState({});

  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('colleague');
  const [newUserPin, setNewUserPin] = useState('1234');
  const [editingUserId, setEditingUserId] = useState(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserRole, setEditUserRole] = useState('colleague');
  const [editUserPin, setEditUserPin] = useState('');

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
      const parsed = JSON.parse(localStorage.getItem(`tf_qr_${currentUser.id}`) || '{}');
      setSavedQrEmail(parsed.email || ''); setSavedQrPassword(parsed.password || '');
      setQrEmailInput(parsed.email || ''); setQrPasswordInput(parsed.password || '');
    } catch (e) { console.error(e); }
  }, [currentUser?.id]);

  useEffect(() => {
    signInAnonymously(auth).catch((e) => console.error(e));
    return onAuthStateChanged(auth, (u) => {
      if (!u) return;
      onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'users'), (snap) => {
        if (snap.empty) { DEFAULT_USERS.forEach(async (usr) => await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', usr.id), usr)); }
        else { const arr = []; snap.forEach((d) => arr.push({ id: d.id, ...d.data() })); setTeamUsers(arr); }
      });
      onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'tasks'), (snap) => {
        const arr = []; snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
        arr.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setTasks(arr);
      });
      onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'requests'), (snap) => {
        const arr = []; snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
        setRequests(arr);
      });
      onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'notifications'), (snap) => {
        const arr = []; snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
        setNotifications(arr);
      });
    });
  }, []);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-white">
        <div className="max-w-md w-full bg-white/10 p-6 rounded-3xl space-y-4">
          <h1 className="text-xl font-bold text-center">TaskFlow Login</h1>
          {loginTarget ? (
            <form onSubmit={(e) => { e.preventDefault(); if (pinInput === (loginTarget.pin || '1234')) { setCurrentUser(loginTarget); localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(loginTarget)); } else setLoginError('Incorrect PIN'); }} className="space-y-3">
              <p className="text-xs text-center">Logging in as {loginTarget.name}</p>
              <input type="password" autoFocus value={pinInput} onChange={(e) => setPinInput(e.target.value)} placeholder="PIN" className="w-full p-2 bg-white/20 rounded-xl text-center text-lg"/>
              {loginError && <p className="text-xs text-rose-400 text-center">{loginError}</p>}
              <button type="submit" className="w-full py-2 bg-indigo-600 rounded-xl font-semibold">Unlock</button>
            </form>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {teamUsers.map((u) => (
                <button key={u.id} onClick={() => setLoginTarget(u)} className="w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 flex justify-between items-center">
                  <span className="font-bold text-sm">{u.name}</span>
                  <span className="text-xs text-indigo-300 capitalize">{u.role.replace('_', ' ')}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const isSupervisor = currentUser.role === 'manager' || currentUser.role === 'team_leader';
  const isManager = currentUser.role === 'manager';
  const assignableUsers = teamUsers.filter((u) => isManager ? u.role !== 'manager' : u.role === 'colleague');
  const colleaguesOnly = teamUsers.filter((u) => u.role === 'colleague');

  const myAssignedTasks = tasks.filter((t) => t.assigneeId === currentUser.id && t.status === 'active');
  const allActiveTasks = tasks.filter((t) => t.status === 'active');
  const pausedOrHandoverTasks = allActiveTasks.filter((t) => t.progressStatus === 'paused' || t.progressStatus === 'incomplete');
  const inProgressTasks = allActiveTasks.filter((t) => t.progressStatus === 'in_progress');
  const allocatedNotStartedTasks = allActiveTasks.filter((t) => !t.progressStatus || t.progressStatus === 'not_started');
  const allPendingTasks = tasks.filter((t) => t.status === 'pending_validation');
  const allArchivedTasks = tasks.filter((t) => t.status === 'archived');

  const renderTaskCard = (t) => (
    <div key={t.id} className="bg-white p-4 rounded-xl border text-xs space-y-2">
      <div className="flex justify-between font-bold">
        <span>{t.title}</span>
        <span className="text-indigo-600">{t.assigneeName}</span>
      </div>
      <p className="text-slate-600">{t.description}</p>
      <div className="flex justify-between pt-2 border-t">
        <select value={t.assigneeId} onChange={async (e) => {
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', t.id), { assigneeId: e.target.value, assigneeName: teamUsers.find(x => x.id === e.target.value)?.name });
          showToast("Reassigned", "Task moved.");
        }} className="text-xs border rounded p-1">
          {assignableUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <button onClick={async () => {
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', t.id), { status: 'archived', validatedByName: currentUser.name });
          showToast("Validated", "Archived.");
        }} className="px-3 py-1 bg-emerald-600 text-white rounded font-semibold">Validate</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs">
          {toast.title}: {toast.message}
        </div>
      )}

      <header className="bg-white border-b sticky top-0 z-30 px-4 h-16 flex items-center justify-between">
        <h1 className="font-bold text-base">TaskFlow Pro ({currentUser.name})</h1>
        <button onClick={() => { setCurrentUser(null); localStorage.removeItem(SESSION_STORAGE_KEY); }} className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-semibold">Log Out</button>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 space-y-6">
        {isSupervisor ? (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border space-y-3">
              <h2 className="font-bold text-sm">Assign New Task</h2>
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!taskTitle.trim() || taskAssigneeIds.length === 0) return showToast("Error", "Select task & assignees.");
                for (const id of taskAssigneeIds) {
                  const u = teamUsers.find(x => x.id === id);
                  await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'tasks'), {
                    title: taskTitle.trim(), description: taskDesc.trim(), priority: taskPriority,
                    progressStatus: 'not_started', assigneeId: u.id, assigneeName: u.name, status: 'active', createdAt: new Date().toISOString()
                  });
                }
                setTaskTitle(''); setTaskDesc(''); setTaskAssigneeIds([]);
                showToast("Success", "Task dropped.");
              }} className="space-y-3">
                <select value={selectedPreset} onChange={(e) => {
                  setSelectedPreset(e.target.value);
                  const f = TASK_PRESETS.find(p => p.id === e.target.value);
                  if (f) { setTaskTitle(f.title); setTaskDesc(f.description); }
                }} className="w-full p-2 border rounded-xl text-xs bg-white">
                  {TASK_PRESETS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
                <input type="text" required value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Task Title" className="w-full p-2 border rounded-xl text-xs"/>
                <textarea rows="2" required value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} placeholder="Expectations..." className="w-full p-2 border rounded-xl text-xs"/>
                <div className="max-h-32 overflow-y-auto border rounded-xl p-2 space-y-1">
                  {assignableUsers.map(u => (
                    <label key={u.id} className="flex items-center space-x-2 text-xs">
                      <input type="checkbox" checked={taskAssigneeIds.includes(u.id)} onChange={() => toggleTaskAssignee(u.id)}/>
                      <span>{u.name}</span>
                    </label>
                  ))}
                </div>
                <button type="submit" className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold">Assign Task</button>
              </form>
            </div>

            {/* Collapsible Cards */}
            <div className="space-y-3">
              <div className="bg-white rounded-xl border p-4 space-y-2">
                <button onClick={() => toggleSection('inProgress')} className="w-full flex justify-between font-bold text-xs">
                  <span>In Progress ({inProgressTasks.length})</span>
                  <span>{openSections.inProgress ? '▲' : '▼'}</span>
                </button>
                {openSections.inProgress && inProgressTasks.map(renderTaskCard)}
              </div>

              <div className="bg-white rounded-xl border p-4 space-y-2">
                <button onClick={() => toggleSection('allocated')} className="w-full flex justify-between font-bold text-xs">
                  <span>Allocated / Not Started ({allocatedNotStartedTasks.length})</span>
                  <span>{openSections.allocated ? '▲' : '▼'}</span>
                </button>
                {openSections.allocated && allocatedNotStartedTasks.map(renderTaskCard)}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-5 rounded-2xl border space-y-4">
            <h2 className="font-bold text-sm">My Active Tasks ({myAssignedTasks.length})</h2>
            {myAssignedTasks.map(t => (
              <div key={t.id} className="p-4 border rounded-xl text-xs space-y-2">
                <p className="font-bold">{t.title}</p>
                <p className="text-slate-600">{t.description}</p>
                <button onClick={async () => {
                  await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', t.id), { status: 'pending_validation' });
                  showToast("Completed", "Sent for validation.");
                }} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold">Complete Task</button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
