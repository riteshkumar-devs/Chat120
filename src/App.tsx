import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  auth, 
  db, 
  storage,
  onAuthStateChanged, 
  signInWithPopup, 
  googleProvider, 
  signInAnonymously,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  getDocFromServer,
  updateDoc,
  getDocs,
  deleteDoc,
  limit,
  ref,
  uploadBytes,
  getDownloadURL
} from './lib/firebase';
import { 
  MessageCircle, 
  Users, 
  Video, 
  Image as ImageIcon, 
  Send, 
  Plus, 
  LogOut, 
  QrCode, 
  Phone, 
  PhoneOff,
  X, 
  Search, 
  MoreVertical,
  ArrowLeft,
  Camera,
  Mic,
  MicOff,
  VideoOff,
  User,
  Settings,
  Paperclip,
  Play,
  Pause,
  Volume2,
  Maximize2,
  Scan,
  Check,
  Copy,
  Share2,
  Info,
  Trash2,
  FileText,
  Download,
  Code,
  Pin,
  Smile,
  FileCode,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Ban,
  CheckSquare,
  Square,
  ChevronDown,
  UserPlus,
  Clock,
  Sparkles,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import Peer from 'simple-peer';
import { cn } from './lib/utils';
import { 
  CodeSnippetBlock, 
  CodeSnippetModal, 
  FullscreenCodeModal, 
  CodeData 
} from './components/CodeSnippetViewer';
import { 
  getAvatarUrl, 
  ANIMAL_AVATARS, 
  getAnimalById, 
  generateShortUserId, 
  createAnimalSvgDataUri,
  createGroupSvgDataUri,
  AnimalAvatar 
} from './lib/avatars';
import { e2ee } from './lib/crypto';

export { getAvatarUrl, ANIMAL_AVATARS, getAnimalById, generateShortUserId };

export const AUTO_DELETE_OPTIONS = [
  { id: '30m', label: '30 Minutes', ms: 30 * 60 * 1000 },
  { id: '1h', label: '1 Hour', ms: 60 * 60 * 1000 },
  { id: '2h', label: '2 Hours (Default)', ms: 2 * 60 * 60 * 1000 },
  { id: '6h', label: '6 Hours', ms: 6 * 60 * 60 * 1000 },
  { id: '12h', label: '12 Hours', ms: 12 * 60 * 60 * 1000 },
  { id: '24h', label: '24 Hours', ms: 24 * 60 * 60 * 1000 },
  { id: 'never', label: 'Never (Turn Off Auto-Delete)', ms: null },
];

// Client-side image optimization (resizes to maxDim and compresses to JPEG, typically 50-120KB)
export function compressImage(file: File, maxDim = 1200, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(e.target?.result as string);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// --- Types ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

interface UserProfile {
  uid: string;
  displayName: string;
  username?: string;
  photoURL?: string;
  avatarAnimal?: string;
  isGuest?: boolean;
  isTemporary?: boolean;
  createdAt?: any;
  createdAtMs?: number;
  expiresAt?: number | null;
  autoDeleteDuration?: number | null;
  guestCreatedAt?: number;
  blockedUsers?: string[];
}

interface Chat {
  id: string;
  type: 'dm' | 'group';
  name: string;
  participants: string[];
  participantsDetails?: Record<string, { displayName: string; photoURL?: string }>;
  groupCode?: string;
  lastMessage?: string;
  lastMessageAt?: any;
  createdBy?: string;
  clearedAt?: Record<string, any>;
  blockedBy?: string[];
  requestStatus?: 'pending' | 'accepted' | 'declined';
  requestSenderId?: string;
  requestReceiverId?: string;
  acceptedAt?: any;
}

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  text?: string;
  imageUrl?: string;
  videoUrl?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  type: 'text' | 'image' | 'video' | 'file' | 'code' | 'call' | 'audio';
  audioUrl?: string;
  audioDuration?: number;
  code?: string;
  codeLanguage?: string;
  codeTitle?: string;
  codeLineCount?: number;
  e2eeIv?: string;
  isEncrypted?: boolean;
  reactions?: Record<string, string[]>;
  isPinned?: boolean;
  deletedForEveryone?: boolean;
  deletedFor?: string[];
  createdAt: any;
}

// Helpers for displaying correct name and avatar (Friend's name for direct chats, or You for Notes)
const getChatDisplayName = (chat: Chat, currentUserId: string, cachedName?: string): string => {
  if (chat.type === 'group') return chat.name;
  const otherId = chat.participants.find(p => p !== currentUserId);
  if (!otherId) {
    return chat.name || 'You (Notes)';
  }
  if (otherId && chat.participantsDetails?.[otherId]?.displayName) {
    return chat.participantsDetails[otherId].displayName;
  }
  if (cachedName) return cachedName;
  // If stored chat name contains "&", extract other name if possible
  if (chat.name && chat.name.includes('&')) {
    const parts = chat.name.split('&').map(s => s.trim());
    const otherPart = parts.find(p => !p.toLowerCase().includes('you'));
    if (otherPart) return otherPart;
  }
  return chat.name || `User_${otherId?.slice(0, 5) || 'Direct'}`;
};

const getChatAvatar = (chat: Chat, currentUserId: string, cachedPhoto?: string): string => {
  if (chat.type === 'group') {
    return createGroupSvgDataUri(chat.id, chat.name);
  }
  const otherId = chat.participants.find(p => p !== currentUserId);
  if (!otherId) {
    const rawPhoto = chat.participantsDetails?.[currentUserId]?.photoURL || cachedPhoto;
    return getAvatarUrl(currentUserId, rawPhoto);
  }
  const rawPhoto = chat.participantsDetails?.[otherId]?.photoURL || cachedPhoto;
  return getAvatarUrl(otherId, rawPhoto);
};

const formatDatePill = (timestamp: any): string => {
  if (!timestamp) return 'Today';
  let date: Date;
  if (typeof timestamp?.toDate === 'function') {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === 'number') {
    date = new Date(timestamp);
  } else {
    date = new Date(timestamp);
  }
  if (isNaN(date.getTime())) return 'Today';

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString(undefined, { 
      day: 'numeric', 
      month: 'short', 
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined 
    });
  }
};

// --- Components ---

const NameEntryScreen: React.FC<{ onJoin: (user: UserProfile) => void }> = ({ onJoin }) => {
  const [name, setName] = useState('');
  const [selectedAnimal, setSelectedAnimal] = useState('fox');
  const [autoDeleteOption, setAutoDeleteOption] = useState<string>('2h');
  const [assignedUid] = useState(() => generateShortUserId());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentAvatarSvgUri = useMemo(() => {
    return createAnimalSvgDataUri(getAnimalById(selectedAnimal));
  }, [selectedAnimal]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter your name to start chatting');
      return;
    }
    if (trimmed.length > 30) {
      setError('Name must be 30 characters or fewer');
      return;
    }
    setError('');
    setLoading(true);

    try {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.warn('Anonymous auth skipped:', err);
      }

      const uid = assignedUid;
      const now = Date.now();
      const chosenPreset = AUTO_DELETE_OPTIONS.find(o => o.id === autoDeleteOption);
      const durationMs = chosenPreset ? chosenPreset.ms : 2 * 60 * 60 * 1000;
      const expiresAt = durationMs !== null ? now + durationMs : null;

      const profile: UserProfile = {
        uid,
        displayName: trimmed,
        username: trimmed.toLowerCase().replace(/\s+/g, '_'),
        photoURL: `animal:${selectedAnimal}`,
        avatarAnimal: selectedAnimal,
        createdAt: now,
        createdAtMs: now,
        expiresAt: expiresAt,
        autoDeleteDuration: durationMs,
        isTemporary: durationMs !== null
      };

      // Save to Firestore
      await setDoc(doc(db, 'users', uid), {
        uid: profile.uid,
        displayName: profile.displayName,
        username: profile.username,
        photoURL: profile.photoURL,
        avatarAnimal: selectedAnimal,
        createdAt: serverTimestamp(),
        createdAtMs: now,
        expiresAt: expiresAt,
        autoDeleteDuration: durationMs,
        isTemporary: durationMs !== null,
        lastActiveAt: serverTimestamp()
      });

      // Save session to localStorage
      localStorage.setItem('chat120_user_session', JSON.stringify(profile));
      localStorage.setItem('chatwave_user_session', JSON.stringify(profile));
      onJoin(profile);
    } catch (err: any) {
      console.error('Failed to create user session', err);
      setError('Unable to join chat. Please check connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full h-[100dvh] w-full bg-[#0b141a] overflow-hidden flex items-center justify-center p-3 sm:p-4 relative selection:bg-[#00a884] selection:text-white">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-[#00a884]/15 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-[#00a884]/10 blur-[120px] rounded-full pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-[#202c33] p-4 sm:p-5 rounded-3xl shadow-2xl w-full max-w-md border border-[#3b4a54]/80 relative z-10 flex flex-col gap-2.5 max-h-[96dvh] overflow-y-auto no-scrollbar my-auto"
      >
        {/* CENTERED PROJECT NAME & BRANDING */}
        <div className="text-center flex flex-col items-center pb-2 border-b border-[#3b4a54]/40 shrink-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#00a884] via-[#05cd99] to-[#25d366] flex items-center justify-center text-white shadow-lg shadow-[#00a884]/25 mb-1">
            <MessageCircle className="w-6 h-6 fill-current" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">
            Chat 120
          </h1>
          <p className="text-xs text-[#8696a0] mt-0.5 font-medium">
            120-Minute Ephemeral Encrypted Messaging
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#111b21] border border-[#00a884]/30 text-[10px] text-[#00a884] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-pulse"></span>
              <span>AES-256-GCM E2EE • DTLS Voice</span>
            </span>
          </div>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/15 border border-red-500/30 text-red-400 px-3 py-1.5 rounded-xl text-xs text-center font-medium shrink-0"
          >
            {error}
          </motion.div>
        )}

        {/* Selected Avatar Preview + Name Input */}
        <div className="flex items-center gap-3 bg-[#111b21] p-2.5 rounded-2xl border border-[#3b4a54]/70 shrink-0">
          <div className="relative shrink-0">
            <img 
              src={currentAvatarSvgUri} 
              alt="Avatar preview" 
              className="w-11 h-11 rounded-full border-2 border-[#00a884] shadow-md object-cover transition-all"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border border-[#202c33] flex items-center justify-center text-[8px] text-white font-bold">
              ✓
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-bold text-[#00a884] uppercase tracking-wider">
                Your Display Name
              </label>
              <span className="text-[10px] text-[#8696a0] capitalize font-semibold bg-[#202c33] px-2 py-0.5 rounded-md">
                {getAnimalById(selectedAnimal).name} {getAnimalById(selectedAnimal).emoji}
              </span>
            </div>
            <input 
              type="text" 
              placeholder="What should we call you? (e.g. Alex)" 
              className="w-full bg-[#202c33] border border-[#3b4a54] outline-none text-[#e9edef] rounded-xl px-3 py-1.5 text-sm focus:border-[#00a884] transition-all placeholder:text-[#8696a0]"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
              autoFocus
              required
            />
          </div>
        </div>

        {/* Choose Animal Avatar Carousel */}
        <div className="space-y-1 shrink-0">
          <div className="flex justify-between items-center px-0.5">
            <span className="text-[10px] font-bold text-[#8696a0] uppercase tracking-wider">
              Choose Animal Avatar ({ANIMAL_AVATARS.length})
            </span>
            <span className="text-[10px] text-emerald-400 font-medium">Tap to switch</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-1 bg-[#111b21] rounded-2xl border border-[#3b4a54]/60 no-scrollbar">
            {ANIMAL_AVATARS.map((animal) => {
              const isSelected = selectedAnimal === animal.id;
              return (
                <button
                  key={animal.id}
                  type="button"
                  onClick={() => setSelectedAnimal(animal.id)}
                  className={cn(
                    "flex flex-col items-center justify-center p-1 rounded-xl transition-all shrink-0 w-12",
                    isSelected 
                      ? "bg-[#00a884]/25 ring-2 ring-[#00a884] shadow-md scale-105" 
                      : "hover:bg-[#202c33] opacity-75 hover:opacity-100"
                  )}
                  title={animal.name}
                >
                  <img 
                    src={createAnimalSvgDataUri(animal)} 
                    alt={animal.name} 
                    className="w-7 h-7 rounded-full object-cover shadow"
                  />
                  <span className="text-[9px] text-[#e9edef] mt-0.5 font-medium truncate max-w-full">
                    {animal.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 120-Minute Auto-Delete Duration Options */}
        <div className="bg-[#111b21] p-2 rounded-2xl border border-[#3b4a54]/60 space-y-1 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] font-bold text-[#e9edef]">Session Lifetime</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              {autoDeleteOption === 'never' ? 'Manual Delete Only' : autoDeleteOption === '2h' ? '120 Mins (Default)' : 'Auto-Destruct'}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: '2h', label: '120 Mins' },
              { id: '1h', label: '60 Mins' },
              { id: '30m', label: '30 Mins' },
              { id: 'never', label: 'Permanent' }
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setAutoDeleteOption(opt.id)}
                className={cn(
                  "py-1 px-1 text-[11px] font-semibold rounded-xl transition text-center",
                  autoDeleteOption === opt.id 
                    ? "bg-[#00a884] text-white shadow-md font-bold" 
                    : "bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942]"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ephemeral Guest ID info */}
        <div className="flex items-center justify-between px-1 text-[11px] text-[#8696a0] shrink-0">
          <span>Assigned Ephemeral ID:</span>
          <span className="font-mono text-[#00a884] font-bold bg-[#111b21] px-2 py-0.5 rounded-md border border-[#3b4a54]">
            {assignedUid}
          </span>
        </div>

        {/* Start Chatting Button */}
        <form onSubmit={handleJoin} className="shrink-0">
          <motion.button 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full bg-[#00a884] hover:bg-[#008f6f] text-white font-bold py-2.5 rounded-xl transition-all shadow-xl shadow-[#00a884]/25 disabled:opacity-50 flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Joining Chat 120...</span>
              </>
            ) : (
              <>
                <span>Start Chatting on Chat 120</span>
                <Send className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

const FindPeopleModal: React.FC<{
  user: UserProfile;
  chats: Chat[];
  onClose: () => void;
  onStartChat: (targetUser: UserProfile) => void;
}> = ({
  user,
  chats,
  onClose,
  onStartChat
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchUsers = async () => {
      try {
        const snap = await getDocs(collection(db, 'users'));
        const now = Date.now();
        const list: UserProfile[] = [];
        snap.forEach(d => {
          const u = d.data() as UserProfile;
          if (u.uid === user.uid) return;
          if (u.expiresAt && now > u.expiresAt) return;
          // Privacy: hide users whom I have blocked, or who have blocked me
          if (user.blockedUsers?.includes(u.uid) || u.blockedUsers?.includes(user.uid)) return;
          list.push({ ...u, photoURL: getAvatarUrl(u.uid, u.photoURL) });
        });
        list.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
        if (isMounted) {
          setAllUsers(list);
          setLoading(false);
        }
      } catch (err) {
        console.warn('Failed to load users', err);
        if (isMounted) setLoading(false);
      }
    };
    fetchUsers();
    return () => { isMounted = false; };
  }, [user.uid, user.blockedUsers]);

  const filtered = allUsers.filter(u => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return (u.displayName || '').toLowerCase().includes(term) || (u.username || '').toLowerCase().includes(term);
  });

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="bg-[#202c33] p-6 rounded-2xl w-full max-w-md border border-[#3b4a54] max-h-[85vh] flex flex-col shadow-2xl"
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#00a884]/20 text-[#00a884] flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#e9edef] leading-tight">Find People</h2>
              <p className="text-[11px] text-[#8696a0]">Search active users to send chat requests</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#8696a0] hover:text-[#e9edef] p-1"><X className="w-5 h-5" /></button>
        </div>

        {/* Search input */}
        <div className="relative mb-3">
          <Search className="w-4 h-4 text-[#8696a0] absolute left-3 top-3" />
          <input 
            type="text" 
            placeholder="Type a name or username..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#111b21] border border-[#3b4a54] text-sm text-[#e9edef] rounded-xl pl-9 pr-3 py-2.5 outline-none focus:border-[#00a884] transition placeholder:text-[#8696a0]"
            autoFocus
          />
        </div>

        {/* Pinned: Message Yourself (Notes / Instant Test) */}
        <div className="mb-2 p-2.5 rounded-xl bg-gradient-to-r from-[#00a884]/20 via-[#05cd99]/10 to-[#202c33] border border-[#00a884]/40 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <img src={getAvatarUrl(user.uid, user.photoURL)} className="w-9 h-9 rounded-full object-cover ring-2 ring-[#00a884]" alt="You" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-[#111b21]"></span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white truncate">{user.displayName} (You)</span>
                <span className="text-[9px] bg-[#00a884]/30 text-emerald-300 px-1.5 py-0.2 rounded font-bold border border-[#00a884]/40 uppercase tracking-wider">Notes</span>
              </div>
              <p className="text-[10px] text-[#8696a0] truncate">Message yourself • Test chat box, code & files</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onStartChat(user)}
            className="px-3 py-1.5 bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-semibold rounded-xl transition shadow flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-current" />
            <span>Chat</span>
          </button>
        </div>

        {/* User list */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar min-h-[160px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 text-[#8696a0] gap-2">
              <div className="w-6 h-6 border-2 border-[#00a884] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs">Finding active users...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-[#8696a0]">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-xs font-medium text-[#e9edef] mb-1">
                {searchTerm ? `No users matching "${searchTerm}"` : 'No other users online right now'}
              </p>
              <p className="text-[11px]">
                Tell a friend to open the app, enter their name, and they'll appear here instantly!
              </p>
            </div>
          ) : (
            filtered.map((u) => {
              const existingChat = chats.find(c => c.type === 'dm' && c.participants.includes(u.uid));
              const isPending = existingChat?.requestStatus === 'pending';
              const isSender = isPending && existingChat?.requestSenderId === user.uid;
              const isReceiver = isPending && existingChat?.requestReceiverId === user.uid;
              const isAccepted = existingChat && (!existingChat.requestStatus || existingChat.requestStatus === 'accepted');

              const now = Date.now();
              const timeLeftMin = u.expiresAt ? Math.max(0, Math.floor((u.expiresAt - now) / 60000)) : 120;
              return (
                <div key={u.uid} className="flex items-center justify-between p-2.5 rounded-xl bg-[#111b21] hover:bg-[#182229] border border-[#2e3b43] transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <img 
                      src={getAvatarUrl(u.uid, u.photoURL)} 
                      className="w-10 h-10 rounded-full object-cover shrink-0" 
                      alt={u.displayName} 
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = getAvatarUrl(u.uid); }} 
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#e9edef] truncate">{u.displayName}</p>
                      <p className="text-[11px] text-[#8696a0] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        <span>Active · {timeLeftMin}m left</span>
                      </p>
                    </div>
                  </div>
                  {isAccepted ? (
                    <button 
                      onClick={() => onStartChat(u)}
                      className="px-3.5 py-1.5 bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shrink-0 shadow-sm"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Open Chat</span>
                    </button>
                  ) : isSender ? (
                    <button 
                      onClick={() => onStartChat(u)}
                      className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shrink-0"
                    >
                      <Clock className="w-3.5 h-3.5 animate-pulse" />
                      <span>Requested ⏳</span>
                    </button>
                  ) : isReceiver ? (
                    <button 
                      onClick={() => onStartChat(u)}
                      className="px-3.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shrink-0 shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Respond ✨</span>
                    </button>
                  ) : (
                    <button 
                      onClick={() => onStartChat(u)}
                      className="px-3.5 py-1.5 bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shrink-0 shadow-sm"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Send Request</span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-[#3b4a54]/40 text-center text-[11px] text-[#8696a0]">
          Your name: <span className="text-[#e9edef] font-semibold">{user.displayName}</span> • Anyone can search you by this name
        </div>
      </motion.div>
    </div>
  );
};

const ChatItem: React.FC<{ 
  chat: Chat; 
  active: boolean; 
  onClick: () => void; 
  currentUserId: string; 
  cachedName?: string; 
  cachedPhoto?: string;
  onAcceptRequest?: (chatId: string) => void;
  onDeclineRequest?: (chatId: string) => void;
}> = ({ chat, active, onClick, currentUserId, cachedName, cachedPhoto, onAcceptRequest, onDeclineRequest }) => {
  const displayName = getChatDisplayName(chat, currentUserId, cachedName);
  const avatarUrl = getChatAvatar(chat, currentUserId, cachedPhoto);

  const isPending = chat.type === 'dm' && chat.requestStatus === 'pending';
  const isReceiver = isPending && chat.requestReceiverId === currentUserId;
  const isSender = isPending && chat.requestSenderId === currentUserId;
  const otherId = chat.type === 'dm' ? chat.participants.find(p => p !== currentUserId) : undefined;
  const isSelfChat = chat.type === 'dm' && (!otherId || (chat.participants.length === 1 && chat.participants[0] === currentUserId));

  return (
    <motion.div 
      whileHover={{ backgroundColor: active ? "rgba(42, 57, 66, 1)" : "rgba(32, 44, 51, 0.7)" }}
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3.5 p-3.5 cursor-pointer transition-all border-b border-[#202c33]/70 relative select-none",
        active 
          ? "bg-[#2a3942] before:absolute before:left-0 before:top-2.5 before:bottom-2.5 before:w-1 before:bg-[#00a884] before:rounded-r-full" 
          : "hover:bg-[#202c33]/60",
        isReceiver && !active && "bg-emerald-950/20"
      )}
    >
      <div className="relative shrink-0">
        <img 
          src={avatarUrl} 
          className={cn(
            "w-12 h-12 rounded-full bg-[#3b4a54] object-cover transition-transform duration-200",
            active ? "ring-2 ring-[#00a884] shadow-md shadow-[#00a884]/20" : "",
            isReceiver ? "ring-2 ring-emerald-500/60" : ""
          )} 
          alt={displayName}
          onError={(e) => {
            if (chat.type === 'group') {
              (e.currentTarget as HTMLImageElement).src = createGroupSvgDataUri(chat.id, chat.name);
            } else {
              const oId = chat.participants.find(p => p !== currentUserId) || currentUserId;
              (e.currentTarget as HTMLImageElement).src = getAvatarUrl(oId);
            }
          }}
        />
        {chat.type === 'dm' ? (
          isReceiver ? (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[9px] border border-[#111b21] shadow-sm animate-pulse">
              👋
            </div>
          ) : (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#111b21] rounded-full shadow-sm"></div>
          )
        ) : (
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#00a884] text-white rounded-full flex items-center justify-center text-[9px] border border-[#111b21]">
            <Users className="w-2.5 h-2.5" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className={cn("font-medium text-sm truncate", active ? "text-white font-semibold" : "text-[#e9edef]")}>
              {displayName}
            </h3>
            {isReceiver && (
              <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider shrink-0">
                New Request
              </span>
            )}
            {isSender && (
              <span className="px-1.5 py-0.2 text-[9px] font-semibold rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                Pending
              </span>
            )}
            {isSelfChat && (
              <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-[#00a884]/20 text-[#00a884] border border-[#00a884]/30 uppercase tracking-wider shrink-0">
                Notes
              </span>
            )}
          </div>
          {chat.lastMessageAt && (
            <span className="text-[#8696a0] text-[11px] font-mono shrink-0 ml-2">
              {format(chat.lastMessageAt.toDate ? chat.lastMessageAt.toDate() : new Date(chat.lastMessageAt), 'HH:mm')}
            </span>
          )}
        </div>
        
        {isReceiver ? (
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <p className="text-xs text-emerald-400/90 truncate font-medium">
              Wants to chat with you
            </p>
            {onAcceptRequest && onDeclineRequest && (
              <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => onAcceptRequest(chat.id)}
                  className="px-2 py-0.5 bg-[#00a884] hover:bg-[#008f6f] text-white text-[11px] font-semibold rounded-md transition shadow-sm"
                >
                  Accept
                </button>
                <button
                  type="button"
                  onClick={() => onDeclineRequest(chat.id)}
                  className="px-2 py-0.5 bg-[#202c33] hover:bg-red-500/20 text-[#8696a0] hover:text-red-400 text-[11px] font-medium rounded-md border border-[#3b4a54] transition"
                >
                  Decline
                </button>
              </div>
            )}
          </div>
        ) : (
          <p className={cn("text-xs truncate leading-relaxed flex items-center gap-1", active ? "text-[#aebac1]" : "text-[#8696a0]")}>
            {isSender 
              ? '⏳ Waiting for request acceptance'
              : (chat.lastMessage || (chat.type === 'group' ? '👥 Group ready' : 'Tap to chat'))
            }
          </p>
        )}
      </div>
    </motion.div>
  );
};

const VoiceNotePlayer: React.FC<{ 
  audioUrl: string; 
  duration?: number; 
  isOwn: boolean; 
}> = ({ audioUrl, duration = 0, isOwn }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onloadedmetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setAudioDuration(Math.round(audio.duration));
      }
    };
    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };
    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.play().then(() => setIsPlaying(true)).catch((e) => console.warn('Audio play failed', e));
    }
  };

  const cycleRate = () => {
    const rates = [1, 1.5, 2];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const totalTime = audioDuration || duration || 0;
  const progressPercent = totalTime > 0 ? (currentTime / totalTime) * 100 : 0;

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-black/25 max-w-[280px] sm:max-w-[320px] my-1 backdrop-blur-sm border border-white/5">
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        type="button"
        onClick={togglePlay}
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center transition shrink-0 shadow-md",
          isOwn ? "bg-white text-[#005c4b] hover:bg-white/90" : "bg-[#00a884] text-white hover:bg-[#008f6f]"
        )}
        title={isPlaying ? "Pause voice note" : "Play voice note"}
      >
        {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current translate-x-0.5" />}
      </motion.button>

      <div className="flex-1 min-w-0">
        <div className="relative flex items-center h-6">
          {/* Animated dynamic waveform bars */}
          <div className="absolute inset-0 flex items-center gap-0.5 pointer-events-none">
            {[40, 75, 30, 90, 60, 40, 80, 50, 100, 45, 65, 85, 30, 75, 45, 95, 55, 35, 70, 50].map((h, i) => {
              const active = (i / 20) * 100 <= progressPercent;
              return (
                <motion.div 
                  key={i} 
                  className={cn(
                    "flex-1 rounded-full transition-colors",
                    active ? (isOwn ? "bg-white" : "bg-[#00a884]") : "bg-white/25"
                  )}
                  animate={isPlaying ? {
                    height: [`${Math.max(20, h * 0.45)}%`, `${Math.min(100, h * 1.2)}%`, `${h}%`]
                  } : {
                    height: `${h}%`
                  }}
                  transition={isPlaying ? {
                    repeat: Infinity,
                    duration: 0.5 + (i % 4) * 0.12,
                    ease: "easeInOut"
                  } : { duration: 0.2 }}
                />
              );
            })}
          </div>
          <input
            type="range"
            min="0"
            max={totalTime || 1}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="w-full opacity-0 cursor-pointer h-6 z-10"
          />
        </div>

        <div className="flex justify-between items-center text-[10px] text-[#8696a0] mt-0.5 select-none">
          <span className="font-mono text-[#e9edef]">{formatSeconds(isPlaying ? currentTime : totalTime)}</span>
          <div className="flex items-center gap-1.5">
            <Mic className="w-3 h-3 text-[#00a884]" />
            <button 
              type="button" 
              onClick={cycleRate}
              className="px-1.5 py-0.5 rounded bg-black/40 hover:bg-black/60 text-[#e9edef] font-mono font-medium text-[10px] transition active:scale-95"
              title="Change playback speed"
            >
              {playbackRate}x
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MessageBubble: React.FC<{ 
  message: Message; 
  isOwn: boolean; 
  onImageClick?: (url: string) => void;
  onOpenFullscreenCode?: (data: CodeData) => void;
  onReact?: (msgId: string, emoji: string) => void;
  onTogglePin?: (msgId: string, currentPin?: boolean) => void;
  onDeleteMessage?: (msg: Message) => void;
  currentUserId?: string;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (msgId: string) => void;
}> = ({ 
  message, 
  isOwn, 
  onImageClick, 
  onOpenFullscreenCode,
  onReact,
  onTogglePin,
  onDeleteMessage,
  currentUserId,
  isSelectMode,
  isSelected,
  onToggleSelect
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showBubbleMenu, setShowBubbleMenu] = useState(false);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const reactionEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

  // Check if standard text contains markdown code block (```lang ... ```)
  const isMarkdownCode = useMemo(() => {
    if (message.type !== 'text' || !message.text) return false;
    const trimmed = message.text.trim();
    return trimmed.startsWith('```') && trimmed.endsWith('```') && trimmed.length > 6;
  }, [message.type, message.text]);

  const parsedMarkdownCode = useMemo(() => {
    if (!isMarkdownCode || !message.text) return null;
    const match = message.text.trim().match(/^```([a-zA-Z0-9_-]*)\n?([\s\S]+)```$/);
    if (match) {
      return {
        language: match[1] || 'typescript',
        code: match[2].trim()
      };
    }
    return null;
  }, [isMarkdownCode, message.text]);

  // If message was deleted for everyone (WhatsApp style)
  if (message.deletedForEveryone) {
    return (
      <div className={cn("flex mb-2 items-center gap-2", isOwn ? "justify-end" : "justify-start")}>
        {isSelectMode && (
          <button 
            type="button"
            onClick={() => onToggleSelect?.(message.id)}
            className="text-[#8696a0] hover:text-[#e9edef] p-1"
          >
            {isSelected ? <CheckSquare className="w-4 h-4 text-[#00a884]" /> : <Square className="w-4 h-4" />}
          </button>
        )}
        <div className={cn(
          "px-4 py-2 rounded-2xl text-xs italic flex items-center gap-2 border border-white/5 select-none",
          isOwn ? "bg-[#005c4b]/50 text-[#8696a0]" : "bg-[#202c33]/70 text-[#8696a0]"
        )}>
          <Trash2 className="w-3.5 h-3.5 text-[#8696a0]" />
          <span>🚫 This message was deleted</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: isOwn ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn("flex mb-3.5 group relative items-center gap-2", isOwn ? "justify-end" : "justify-start")}
    >
      {/* Multi-Select Checkbox for Batch Deleting particular messages */}
      {isSelectMode && (
        <button 
          type="button"
          onClick={() => onToggleSelect?.(message.id)}
          className="text-[#8696a0] hover:text-[#e9edef] p-1 transition"
          title="Select this message"
        >
          {isSelected ? <CheckSquare className="w-5 h-5 text-[#00a884]" /> : <Square className="w-5 h-5" />}
        </button>
      )}

      <div className={cn(
        "w-fit max-w-[94%] sm:max-w-[85%] md:max-w-[75%] min-w-0 overflow-hidden break-words p-2.5 sm:p-3 rounded-2xl shadow-md relative group/bubble",
        isOwn ? "bg-[#005c4b] text-[#e9edef] rounded-tr-none" : "bg-[#202c33] text-[#e9edef] rounded-tl-none"
      )}>
        {/* Pinned Badge */}
        {message.isPinned && (
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#00a884] mb-1.5 pb-1 border-b border-white/10">
            <Pin className="w-3 h-3 text-[#00a884] fill-[#00a884]" />
            <span>Pinned Message</span>
          </div>
        )}

        {!isOwn && <p className="text-xs font-bold text-[#00a884] mb-1.5">{message.senderName}</p>}

        {/* Voice Note Audio Player */}
        {(message.type === 'audio' || message.audioUrl) && (
          <VoiceNotePlayer 
            audioUrl={message.audioUrl!} 
            duration={message.audioDuration} 
            isOwn={isOwn} 
          />
        )}

        {/* Code Snippet Message or Previewable Code File */}
        {((message.type === 'code' && (message.code || message.text)) || (message.code && (message.type === 'file' || showFilePreview))) && (
          <div className="my-1 w-full max-w-full min-w-0 overflow-hidden">
            <CodeSnippetBlock
              code={message.code || message.text || ''}
              language={message.codeLanguage || 'typescript'}
              title={message.codeTitle || message.fileName}
              onOpenFullscreen={onOpenFullscreenCode}
            />
          </div>
        )}

        {/* Markdown Code Block inside standard text */}
        {parsedMarkdownCode && (
          <div className="my-1 w-full max-w-full min-w-0 overflow-hidden">
            <CodeSnippetBlock
              code={parsedMarkdownCode.code}
              language={parsedMarkdownCode.language}
              onOpenFullscreen={onOpenFullscreenCode}
            />
          </div>
        )}

        {/* Image Attachment */}
        {message.type === 'image' && message.imageUrl && (
          <div 
            onClick={() => onImageClick?.(message.imageUrl!)}
            className="relative group mb-2 cursor-pointer rounded-xl overflow-hidden"
          >
            <img 
              src={message.imageUrl} 
              className="rounded-xl max-w-full max-h-80 object-cover" 
              alt="Shared" 
              referrerPolicy="no-referrer" 
            />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
              <Maximize2 className="text-white w-7 h-7 drop-shadow" />
            </div>
          </div>
        )}

        {/* Video Attachment */}
        {message.type === 'video' && message.videoUrl && (
          <div className="relative group rounded-xl overflow-hidden mb-2 bg-black/40">
            <video src={message.videoUrl} className="max-w-full max-h-80 rounded-xl" controls />
          </div>
        )}

        {/* File Attachment Card (with direct preview toggle if code/text) */}
        {message.type === 'file' && message.fileUrl && !message.code && (
          <div className="p-3 bg-black/25 rounded-xl mb-2 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#00a884]/20 rounded-lg text-[#00a884]">
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#e9edef] truncate">{message.fileName || 'Attachment'}</p>
                {message.fileSize && (
                  <p className="text-[11px] text-[#8696a0]">
                    {(message.fileSize / 1024).toFixed(1)} KB
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <a 
                  href={message.fileUrl} 
                  download={message.fileName || 'file'} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="p-2 bg-[#2a3942] hover:bg-[#3b4a54] text-[#e9edef] rounded-lg transition"
                  title="Download file"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Standard Text (if not a standalone code block or voice note) */}
        {!parsedMarkdownCode && message.type !== 'code' && message.type !== 'audio' && message.text && (
          <p className="text-[13px] sm:text-[14px] leading-relaxed pr-12 sm:pr-14 break-words whitespace-pre-wrap min-w-0 max-w-full overflow-hidden">{message.text}</p>
        )}

        {/* WhatsApp-Style Reaction Chips */}
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2 pt-1 border-t border-white/10">
            {Object.entries(message.reactions).map(([emoji, uids]) => {
              if (!uids || uids.length === 0) return null;
              const hasReacted = currentUserId ? uids.includes(currentUserId) : false;
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onReact?.(message.id, emoji)}
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs flex items-center gap-1 transition shadow-sm",
                    hasReacted 
                      ? "bg-[#00a884]/30 border border-[#00a884] text-white font-medium" 
                      : "bg-[#111b21]/80 hover:bg-[#111b21] border border-[#3b4a54] text-[#e9edef]"
                  )}
                  title={`${uids.length} reactions - click to toggle`}
                >
                  <span>{emoji}</span>
                  <span className="font-mono text-[10px]">{uids.length}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Timestamp & Status */}
        <div className="flex items-center gap-1 absolute bottom-1.5 right-2.5 select-none">
          <span className="text-[10px] text-[#8696a0]">
            {message.createdAt ? format(message.createdAt.toDate ? message.createdAt.toDate() : new Date(message.createdAt), 'HH:mm') : ''}
          </span>
          {isOwn && <Check className="w-3 h-3 text-[#53bdeb]" />}
        </div>

        {/* Quick Menu Dropdown Chevron on the message bubble (WhatsApp Style) */}
        <div className="absolute top-1.5 right-1.5 z-20">
          <button
            type="button"
            onClick={() => setShowBubbleMenu(!showBubbleMenu)}
            className="opacity-0 group-hover/bubble:opacity-100 focus:opacity-100 p-1 text-[#8696a0] hover:text-[#e9edef] rounded-md transition"
            title="Message options"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {showBubbleMenu && (
            <div className="absolute right-0 top-6 w-44 bg-[#182229] border border-[#3b4a54] rounded-xl shadow-2xl py-1 z-30 text-xs">
              <button
                type="button"
                onClick={() => {
                  onDeleteMessage?.(message);
                  setShowBubbleMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-red-400 hover:bg-[#202c33] flex items-center gap-2 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete message</span>
              </button>
              {message.text && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(message.text || '');
                    setShowBubbleMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-[#e9edef] hover:bg-[#202c33] flex items-center gap-2 transition"
                >
                  <Copy className="w-3.5 h-3.5 text-[#8696a0]" />
                  <span>Copy text</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  onTogglePin?.(message.id, message.isPinned);
                  setShowBubbleMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-[#e9edef] hover:bg-[#202c33] flex items-center gap-2 transition"
              >
                <Pin className="w-3.5 h-3.5 text-[#8696a0]" />
                <span>{message.isPinned ? 'Unpin message' : 'Pin message'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Hover Quick Action Buttons (Reactions, Pin & WhatsApp Delete) */}
        <div className={cn(
          "absolute -top-3.5 z-20 hidden group-hover/bubble:flex items-center gap-1 bg-[#182229] border border-[#3b4a54] rounded-full px-2 py-0.5 shadow-xl",
          isOwn ? "right-2" : "left-2"
        )}>
          {/* Reaction Picker Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1 hover:text-[#00a884] text-[#8696a0] transition"
              title="Add reaction (WhatsApp style)"
            >
              <Smile className="w-3.5 h-3.5" />
            </button>

            {showEmojiPicker && (
              <div className="absolute bottom-6 left-0 flex items-center gap-1 bg-[#111b21] border border-[#3b4a54] rounded-full px-2 py-1 shadow-2xl z-30 animate-in fade-in">
                {reactionEmojis.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      onReact?.(message.id, emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="hover:scale-125 transition-transform px-1 py-0.5 text-base"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pin Button */}
          <button
            type="button"
            onClick={() => onTogglePin?.(message.id, message.isPinned)}
            className="p-1 hover:text-[#00a884] text-[#8696a0] transition"
            title={message.isPinned ? "Unpin message" : "Pin message"}
          >
            <Pin className={cn("w-3.5 h-3.5", message.isPinned && "text-[#00a884] fill-[#00a884]")} />
          </button>

          {/* WhatsApp Delete Button for this particular text */}
          <button
            type="button"
            onClick={() => onDeleteMessage?.(message)}
            className="p-1 hover:text-red-400 text-[#8696a0] transition"
            title="Delete this message"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const ProfileModal = ({ 
  user, 
  onClose, 
  onUpdate, 
  showNotification,
  onToggleBlock,
  usersCache,
  remainingSeconds,
  onDeleteSession,
  onClearData,
  onDeleteAccount,
  onUpdateExpiry
}: { 
  user: UserProfile, 
  onClose: () => void, 
  onUpdate: (data: Partial<UserProfile>) => void, 
  showNotification: (msg: string) => void,
  onToggleBlock?: (uid: string) => void,
  usersCache?: Record<string, any>,
  remainingSeconds?: number | null,
  onDeleteSession?: () => void,
  onClearData?: () => Promise<void> | void,
  onDeleteAccount?: () => Promise<void> | void,
  onUpdateExpiry?: (durationMs: number | null) => Promise<void> | void
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'timer' | 'share' | 'data'>('profile');
  const [name, setName] = useState(user.displayName);
  const [photo, setPhoto] = useState(user.photoURL || '');
  const [selectedAnimal, setSelectedAnimal] = useState<string>(() => {
    if (user.avatarAnimal) return user.avatarAnimal;
    if (user.photoURL?.startsWith('animal:')) return user.photoURL.replace('animal:', '');
    return 'fox';
  });
  const [showAnimalPicker, setShowAnimalPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);
  const [confirmClearData, setConfirmClearData] = useState(false);
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Direct Profile URL for sharing
  const profileUrl = typeof window !== 'undefined' ? `${window.location.origin}/?user=${user.uid}` : '';

  const handleCopyProfileUrl = () => {
    if (profileUrl) {
      navigator.clipboard.writeText(profileUrl).then(() => {
        setCopiedLink(true);
        showNotification('Profile URL copied to clipboard!');
        setTimeout(() => setCopiedLink(false), 2000);
      }).catch(() => {
        showNotification('Failed to copy. Please select and copy manually.');
      });
    }
  };

  const handleCopyUid = () => {
    if (user.uid) {
      navigator.clipboard.writeText(user.uid).then(() => {
        setCopiedUid(true);
        showNotification('User ID copied to clipboard!');
        setTimeout(() => setCopiedUid(false), 2000);
      }).catch(() => {
        showNotification('Failed to copy. Please select and copy manually.');
      });
    }
  };

  const handleSelectAnimal = (animalId: string) => {
    setSelectedAnimal(animalId);
    setPhoto(`animal:${animalId}`);
    showNotification(`Avatar changed to ${getAnimalById(animalId).name}!`);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 400, 0.8);
      setPhoto(compressed);
      showNotification('Custom avatar photo updated!');
    } catch (err) {
      console.warn('Failed to compress avatar photo', err);
      showNotification('Failed to load image file.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newPhoto = photo || `animal:${selectedAnimal}`;
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: name,
        photoURL: newPhoto,
        avatarAnimal: selectedAnimal
      });
      onUpdate({ displayName: name, photoURL: newPhoto, avatarAnimal: selectedAnimal });
      showNotification('Profile updated successfully!');
      onClose();
    } catch (err) {
      console.error('Failed to update profile', err);
      showNotification('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteClearData = async () => {
    if (!onClearData) return;
    setIsActionLoading(true);
    try {
      await onClearData();
      setConfirmClearData(false);
      onClose();
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleExecuteDeleteAccount = async () => {
    if (!onDeleteAccount && !onDeleteSession) return;
    setIsActionLoading(true);
    try {
      if (onDeleteAccount) {
        await onDeleteAccount();
      } else if (onDeleteSession) {
        onDeleteSession();
      }
      onClose();
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-3 sm:p-4 z-50 backdrop-blur-sm select-none">
      <motion.div 
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="bg-[#202c33] p-4 sm:p-5 rounded-3xl w-full max-w-md border border-[#3b4a54] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-3 pb-2.5 border-b border-[#3b4a54]/50 shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#e9edef] leading-tight">Settings &amp; Preferences</h2>
            <p className="text-[11px] text-[#8696a0]">Manage profile, auto-delete, and account</p>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1 text-[#8696a0] hover:text-[#e9edef] rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-1 bg-[#111b21] rounded-xl mb-3 border border-[#3b4a54]/50 shrink-0">
          <button 
            type="button" 
            onClick={() => setActiveTab('profile')}
            className={cn(
              "flex-1 py-1.5 px-1.5 text-xs font-semibold rounded-lg transition text-center flex items-center justify-center gap-1", 
              activeTab === 'profile' ? "bg-[#00a884] text-white shadow-sm" : "text-[#8696a0] hover:text-[#e9edef]"
            )}
          >
            <span>👤 Profile</span>
          </button>
          <button 
            type="button" 
            onClick={() => setActiveTab('timer')}
            className={cn(
              "flex-1 py-1.5 px-1.5 text-xs font-semibold rounded-lg transition text-center flex items-center justify-center gap-1", 
              activeTab === 'timer' ? "bg-[#00a884] text-white shadow-sm" : "text-[#8696a0] hover:text-[#e9edef]"
            )}
          >
            <span>⏱️ Timer</span>
          </button>
          <button 
            type="button" 
            onClick={() => setActiveTab('share')}
            className={cn(
              "flex-1 py-1.5 px-1.5 text-xs font-semibold rounded-lg transition text-center flex items-center justify-center gap-1", 
              activeTab === 'share' ? "bg-[#00a884] text-white shadow-sm" : "text-[#8696a0] hover:text-[#e9edef]"
            )}
          >
            <span>📱 QR</span>
          </button>
          <button 
            type="button" 
            onClick={() => setActiveTab('data')}
            className={cn(
              "flex-1 py-1.5 px-1.5 text-xs font-semibold rounded-lg transition text-center flex items-center justify-center gap-1", 
              activeTab === 'data' ? "bg-red-500/80 text-white shadow-sm font-bold" : "text-[#8696a0] hover:text-red-400"
            )}
          >
            <span>🛡️ Data</span>
          </button>
        </div>

        {/* Tab 1: Profile & Avatar */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between overflow-y-auto pr-0.5 custom-scrollbar space-y-3">
            <div className="space-y-3">
              {/* Avatar Picker Section */}
              <div className="bg-[#111b21] p-3 rounded-2xl border border-[#3b4a54]">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <img 
                      src={getAvatarUrl(user.uid, photo || `animal:${selectedAnimal}`)} 
                      className="w-14 h-14 rounded-full border-2 border-[#00a884] object-cover shadow-md" 
                      alt="Preview" 
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#00a884] rounded-full border border-[#202c33] flex items-center justify-center text-[9px] text-white">
                      ✓
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#e9edef] capitalize">
                        {getAnimalById(selectedAnimal).name} {getAnimalById(selectedAnimal).emoji}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAnimalPicker(!showAnimalPicker)}
                        className="text-[11px] px-2 py-0.5 bg-[#00a884]/20 hover:bg-[#00a884]/30 text-[#00a884] rounded-lg font-medium transition"
                      >
                        {showAnimalPicker ? 'Hide ▲' : 'Switch ▼'}
                      </button>
                    </div>
                    <p className="text-[10px] text-[#8696a0] mt-0.5">Pick any of 16 vector animal avatars</p>
                  </div>
                </div>

                {/* Animals Carousel or Grid */}
                {showAnimalPicker && (
                  <div className="mt-2.5 pt-2 border-t border-[#3b4a54]">
                    <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
                      {ANIMAL_AVATARS.map((animal) => {
                        const isSelected = selectedAnimal === animal.id;
                        return (
                          <button
                            key={animal.id}
                            type="button"
                            onClick={() => handleSelectAnimal(animal.id)}
                            className={cn(
                              "flex flex-col items-center justify-center p-1 rounded-xl transition-all shrink-0 w-12",
                              isSelected 
                                ? "bg-[#00a884]/30 ring-2 ring-[#00a884] scale-105" 
                                : "hover:bg-[#202c33] opacity-75 hover:opacity-100"
                            )}
                            title={animal.name}
                          >
                            <img 
                              src={createAnimalSvgDataUri(animal)} 
                              alt={animal.name} 
                              className="w-7 h-7 rounded-full object-cover"
                            />
                            <span className="text-[9px] text-[#e9edef] mt-0.5 truncate max-w-full font-medium">
                              {animal.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Display Name Input */}
              <div>
                <label className="text-xs text-[#00a884] font-medium block mb-1">Display Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#2a3942] border border-[#3b4a54] outline-none text-[#e9edef] rounded-xl px-3.5 py-2 text-sm focus:border-[#00a884] transition"
                  placeholder="Your name"
                  maxLength={30}
                  required
                />
              </div>

              {/* Short User ID section with Copy */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs text-[#8696a0] font-medium">Your Short ID</label>
                  {copiedUid && (
                    <span className="text-[11px] text-[#00a884] font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" /> Copied!
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 bg-[#111b21] rounded-xl p-2 border border-[#3b4a54]">
                  <input 
                    type="text" 
                    readOnly 
                    value={user.uid}
                    className="w-full bg-transparent border-none outline-none text-[#00a884] font-bold text-sm font-mono select-all truncate px-1"
                  />
                  <button 
                    type="button" 
                    onClick={handleCopyUid}
                    className="px-3 py-1.5 bg-[#2a3942] hover:bg-[#3b4a54] text-[#e9edef] text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shrink-0"
                  >
                    {copiedUid ? <Check className="w-3.5 h-3.5 text-[#00a884]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUid ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || !name.trim()}
              className="w-full mt-2 bg-[#00a884] hover:bg-[#008f6f] text-white font-bold py-2.5 rounded-xl transition disabled:opacity-50 text-sm shadow-md flex items-center justify-center gap-2"
            >
              {loading ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        )}

        {/* Tab 2: Auto-Delete Timer & Privacy */}
        {activeTab === 'timer' && (
          <div className="flex-1 overflow-y-auto pr-0.5 custom-scrollbar space-y-3.5">
            {/* Auto-Delete Lifetime Card */}
            <div className="bg-[#111b21] p-3.5 rounded-2xl border border-emerald-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className={cn("w-4 h-4", remainingSeconds !== null ? "text-emerald-400 animate-pulse" : "text-[#8696a0]")} />
                  <div>
                    <p className="text-xs font-semibold text-[#e9edef]">Account Auto-Delete</p>
                    <p className="text-[10px] text-[#8696a0]">
                      {remainingSeconds !== null ? 'ID auto-deletes when timer ends' : 'Auto-delete is currently OFF'}
                    </p>
                  </div>
                </div>
                <span className={cn(
                  "text-xs font-mono font-bold px-2.5 py-1 rounded-lg",
                  remainingSeconds !== null 
                    ? "text-emerald-400 bg-emerald-500/15" 
                    : "text-amber-400 bg-amber-500/15"
                )}>
                  {remainingSeconds !== null && remainingSeconds !== undefined
                    ? `${Math.floor(remainingSeconds / 60)}m ${remainingSeconds % 60}s`
                    : 'OFF (Permanent)'}
                </span>
              </div>

              {/* Adjust Timer Buttons */}
              {onUpdateExpiry && (
                <div className="pt-2 border-t border-[#3b4a54]/50">
                  <span className="text-[10px] text-[#8696a0] block mb-1.5">Change timer or turn off:</span>
                  <div className="grid grid-cols-4 gap-1.5 text-center">
                    <button
                      type="button"
                      onClick={() => onUpdateExpiry(30 * 60 * 1000)}
                      className="py-1.5 px-1 bg-[#202c33] hover:bg-[#2a3942] text-[#e9edef] text-xs font-medium rounded-lg border border-[#3b4a54] transition"
                    >
                      30m
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateExpiry(60 * 60 * 1000)}
                      className="py-1.5 px-1 bg-[#202c33] hover:bg-[#2a3942] text-[#e9edef] text-xs font-medium rounded-lg border border-[#3b4a54] transition"
                    >
                      1h
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateExpiry(2 * 60 * 60 * 1000)}
                      className="py-1.5 px-1 bg-[#202c33] hover:bg-[#2a3942] text-[#00a884] text-xs font-semibold rounded-lg border border-[#00a884]/40 transition"
                    >
                      2h (Reset)
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateExpiry(null)}
                      className="py-1.5 px-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold rounded-lg border border-amber-500/30 transition"
                      title="Turn off automatic account deletion"
                    >
                      Turn OFF
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Blocked Contacts Section */}
            <div className="bg-[#111b21] p-3 rounded-2xl border border-[#3b4a54]">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-[#00a884] font-medium flex items-center gap-1.5">
                  <Ban className="w-3.5 h-3.5 text-red-400" />
                  <span>Blocked Contacts ({user.blockedUsers?.length || 0})</span>
                </label>
              </div>
              {user.blockedUsers && user.blockedUsers.length > 0 ? (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                  {user.blockedUsers.map((blockedUid) => (
                    <div key={blockedUid} className="flex items-center justify-between p-1.5 rounded-lg bg-[#202c33] text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <img src={getAvatarUrl(blockedUid, usersCache?.[blockedUid]?.photoURL)} className="w-6 h-6 rounded-full object-cover shrink-0" alt="" />
                        <span className="text-[#e9edef] truncate font-medium">{usersCache?.[blockedUid]?.displayName || `User (${blockedUid})`}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onToggleBlock?.(blockedUid)}
                        className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-medium rounded text-[10px] transition shrink-0"
                      >
                        Unblock
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-[#8696a0]">No blocked contacts.</p>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Share & QR */}
        {activeTab === 'share' && (
          <div className="flex-1 flex flex-col items-center justify-between overflow-y-auto pr-0.5 custom-scrollbar space-y-3 py-1">
            <div className="bg-[#111b21] p-3.5 rounded-2xl flex flex-col items-center border border-[#3b4a54] w-full">
              <p className="text-[#00a884] text-xs font-bold mb-2 uppercase tracking-wider">Your Personal QR Code</p>
              <div className="bg-white p-2.5 rounded-2xl shadow-md">
                <QRCodeSVG value={profileUrl || user.uid} size={120} />
              </div>
              <p className="text-[#8696a0] text-[10px] mt-2 text-center">Scan to start a direct encrypted chat with you</p>
            </div>

            {/* Profile URL section */}
            <div className="w-full">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-[#8696a0] font-medium">Direct Profile Link</label>
                {copiedLink && (
                  <span className="text-[11px] text-[#00a884] font-medium flex items-center gap-1">
                    <Check className="w-3 h-3" /> Copied!
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 bg-[#111b21] rounded-xl p-2 border border-[#3b4a54]">
                <input 
                  type="text" 
                  readOnly 
                  value={profileUrl}
                  className="w-full bg-transparent border-none outline-none text-[#e9edef] text-xs font-mono select-all truncate px-1"
                />
                <button 
                  type="button" 
                  onClick={handleCopyProfileUrl}
                  className="px-3 py-1.5 bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shrink-0"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Account & Data Privacy */}
        {activeTab === 'data' && (
          <div className="flex-1 overflow-y-auto pr-0.5 custom-scrollbar space-y-3 py-1">
            {/* End-to-End Encryption Security Card */}
            <div className="bg-[#111b21] p-3 rounded-2xl border border-emerald-500/30 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>End-to-End Encryption (E2EE)</span>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Active
                </span>
              </div>
              <p className="text-[11px] text-[#8696a0] leading-relaxed">
                Messages and code are encrypted client-side using <strong>AES-256-GCM</strong>. Only you and the recipient hold the keys. Voice calls are encrypted peer-to-peer with <strong>DTLS-SRTP</strong>.
              </p>
            </div>

            {/* Clear Chat Data */}
            <div className="bg-[#111b21] p-3 rounded-2xl border border-[#3b4a54] space-y-2">
              <div className="flex items-center gap-2 text-[#e9edef] text-xs font-semibold">
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>Clear Chat History &amp; Cache</span>
              </div>
              <p className="text-[11px] text-[#8696a0]">
                Removes your local message cache and chat history. Your user ID and profile will remain active.
              </p>

              {!confirmClearData ? (
                <button 
                  type="button"
                  onClick={() => setConfirmClearData(true)}
                  className="w-full py-2 px-3 bg-[#2a3942] hover:bg-[#3b4a54] text-[#e9edef] text-xs font-medium rounded-xl border border-[#3b4a54] transition flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Clear All Chat Data</span>
                </button>
              ) : (
                <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Confirm clear all data?</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isActionLoading}
                      onClick={handleExecuteClearData}
                      className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded-lg transition"
                    >
                      {isActionLoading ? 'Clearing...' : 'Yes, Clear Data'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClearData(false)}
                      className="flex-1 py-1.5 bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] text-xs font-medium rounded-lg transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Delete Account */}
            <div className="bg-[#111b21] p-3 rounded-2xl border border-red-500/30 space-y-2">
              <div className="flex items-center gap-2 text-red-400 text-xs font-semibold">
                <Trash2 className="w-4 h-4 text-red-400" />
                <span>Delete Account &amp; Permanent Wipe</span>
              </div>
              <p className="text-[11px] text-[#8696a0]">
                Permanently deletes your account document <strong className="text-white font-mono">{user.uid}</strong> and signs you out completely.
              </p>

              {!confirmDeleteAccount ? (
                <button 
                  type="button"
                  onClick={() => setConfirmDeleteAccount(true)}
                  className="w-full py-2.5 px-3 bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs font-semibold rounded-xl border border-red-500/30 transition flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Account Now</span>
                </button>
              ) : (
                <div className="bg-red-500/15 border border-red-500/40 p-3 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-red-400 text-xs font-bold">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>Permanent wipe confirmation</span>
                  </div>
                  <p className="text-[11px] text-red-300/80 leading-relaxed">
                    This will delete your user document from Firestore and wipe local storage immediately.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isActionLoading}
                      onClick={handleExecuteDeleteAccount}
                      className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition shadow"
                    >
                      {isActionLoading ? 'Deleting...' : 'Yes, Delete Permanently'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteAccount(false)}
                      className="flex-1 py-2 bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] text-xs font-medium rounded-lg transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

const ContactProfileModal: React.FC<{ 
  contact?: { uid: string; displayName: string; photoURL?: string }; 
  user?: { uid: string; displayName: string; photoURL?: string }; 
  currentUserId?: string;
  isBlocked: boolean; 
  onToggleBlock: (uid: string) => void; 
  onClose: () => void; 
  onStartCall?: () => void;
  showNotification?: (msg: string) => void; 
}> = ({ contact, user, isBlocked, onToggleBlock, onClose, onStartCall, showNotification }) => {
  const target = contact || user || { uid: '', displayName: 'Unknown' };
  const [copiedUid, setCopiedUid] = useState(false);
  const profileUrl = typeof window !== 'undefined' ? `${window.location.origin}/?user=${target.uid}` : '';

  const handleCopyUid = () => {
    navigator.clipboard.writeText(target.uid).then(() => {
      setCopiedUid(true);
      showNotification?.('User ID copied to clipboard!');
      setTimeout(() => setCopiedUid(false), 2000);
    }).catch(() => {});
  };

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="bg-[#202c33] p-6 rounded-2xl w-full max-w-sm border border-[#3b4a54] max-h-[92vh] overflow-y-auto space-y-4"
      >
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#e9edef]">Contact Info</h2>
          <button onClick={onClose} className="text-[#8696a0] hover:text-[#e9edef]"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="relative mb-3">
            <img 
              src={getAvatarUrl(target.uid, target.photoURL)} 
              className={cn("w-24 h-24 rounded-full object-cover shadow-lg border-2", isBlocked ? "border-red-500/80" : "border-[#00a884]")} 
              alt={target.displayName} 
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = getAvatarUrl(target.uid); }}
            />
            {isBlocked && (
              <span className="absolute bottom-0 right-0 p-1 bg-red-500 text-white rounded-full shadow">
                <Ban className="w-4 h-4" />
              </span>
            )}
          </div>
          <h3 className="text-lg font-bold text-[#e9edef] flex items-center gap-1.5">
            {target.displayName}
          </h3>
          {isBlocked ? (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-semibold mt-1">
              Blocked Contact
            </span>
          ) : (
            <span className="text-xs text-[#8696a0] mt-0.5">Chat 120 Contact</span>
          )}
        </div>

        {/* Quick Voice Call button from profile */}
        {!isBlocked && onStartCall && (
          <button
            type="button"
            onClick={onStartCall}
            className="w-full py-2.5 px-4 bg-[#00a884] hover:bg-[#008f6f] text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition shadow-md"
          >
            <Phone className="w-4 h-4" />
            <span>Voice Call {target.displayName}</span>
          </button>
        )}

        {/* User ID */}
        <div className="bg-[#111b21] p-3 rounded-xl border border-[#3b4a54] space-y-1">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#8696a0]">User ID</span>
            <button 
              onClick={handleCopyUid}
              className="text-[#00a884] hover:underline flex items-center gap-1 font-medium"
            >
              {copiedUid ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedUid ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="text-xs font-mono text-[#e9edef] select-all truncate">{target.uid}</p>
        </div>

        {/* QR Code */}
        <div className="bg-[#111b21] p-3.5 rounded-xl flex flex-col items-center border border-[#3b4a54]">
          <div className="bg-white p-2 rounded-lg shadow-sm mb-2">
            <QRCodeSVG value={profileUrl || target.uid} size={110} />
          </div>
          <p className="text-[11px] text-[#8696a0]">Direct conversation QR</p>
        </div>

        {/* Block / Unblock Action Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => onToggleBlock(target.uid)}
            className={cn(
              "w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition shadow-md",
              isBlocked 
                ? "bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40" 
                : "bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40"
            )}
          >
            {isBlocked ? (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Unblock Contact</span>
              </>
            ) : (
              <>
                <Ban className="w-4 h-4" />
                <span>Block Contact</span>
              </>
            )}
          </button>
          <p className="text-[11px] text-[#8696a0] text-center mt-1.5">
            {isBlocked 
              ? 'Unblocking will allow you and this user to message and voice call each other.' 
              : 'Blocked contacts cannot call you or send you messages.'}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

const VoiceNoteRecorder: React.FC<{
  onSend: (audioBlob: Blob, duration: number) => void;
  onCancel: () => void;
  showNotification?: (msg: string) => void;
}> = ({ onSend, onCancel, showNotification }) => {
  const [seconds, setSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showNotification?.('Microphone recording is not supported in this browser.');
      onCancel();
      return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      if (!isMounted) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.start(200);
      timerRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    }).catch((err) => {
      console.warn('Microphone permission denied', err);
      showNotification?.('Microphone access denied. Please allow microphone permissions.');
      onCancel();
    });

    return () => {
      isMounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch (e) {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const handleStopAndSend = () => {
    if (!mediaRecorderRef.current) return;
    const dur = seconds;
    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
      onSend(audioBlob, dur);
    };
    try { mediaRecorderRef.current.stop(); } catch (e) {}
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleCancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch (e) {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    if (timerRef.current) clearInterval(timerRef.current);
    onCancel();
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem < 10 ? '0' : ''}${rem}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      className="flex-1 flex items-center justify-between bg-[#1f2c34] rounded-2xl px-4 py-2 text-[#e9edef] border border-red-500/30 shadow-lg shadow-red-500/5"
    >
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center">
          <div className="w-3.5 h-3.5 rounded-full bg-red-500 animate-ping absolute opacity-70"></div>
          <div className="w-3 h-3 rounded-full bg-red-500 relative z-10 shadow-sm shadow-red-500"></div>
        </div>
        <span className="text-red-400 font-mono font-bold text-sm tracking-wide">{formatTime(seconds)}</span>
        
        {/* Animated Sound Wave Visualizer while recording */}
        <div className="flex items-center gap-1 h-5 px-1">
          {[14, 26, 16, 28, 12, 22, 10, 25, 18, 15, 24, 12].map((h, idx) => (
            <motion.div
              key={idx}
              animate={{ height: [6, h, 8, Math.max(8, h * 0.75), 6] }}
              transition={{ repeat: Infinity, duration: 0.65, delay: idx * 0.07, ease: "easeInOut" }}
              className="w-1 bg-red-400/85 rounded-full"
            />
          ))}
        </div>
        <span className="text-xs text-[#8696a0] hidden md:inline font-medium">Recording voice note...</span>
      </div>

      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.9 }}
          type="button"
          onClick={handleCancelRecording}
          className="p-2 text-[#8696a0] hover:text-red-400 hover:bg-red-500/10 rounded-full transition"
          title="Discard recording"
        >
          <Trash2 className="w-5 h-5" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          type="button"
          onClick={handleStopAndSend}
          className="p-2.5 bg-[#00a884] hover:bg-[#008f6f] text-white rounded-full transition shadow-md shadow-[#00a884]/25 flex items-center justify-center"
          title="Send voice note"
        >
          <Send className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
};

const QRScannerModal = ({ onClose, onScan, showNotification }: { onClose: () => void, onScan: (uid: string) => void, showNotification?: (msg: string) => void }) => {
  const [loadingScanner, setLoadingScanner] = useState(true);
  const [cameraError, setCameraError] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cleanAndScan = (rawText: string) => {
    let clean = rawText.trim();
    if (clean.includes('?user=')) {
      const match = clean.match(/[?&]user=([^&]+)/);
      if (match && match[1]) clean = decodeURIComponent(match[1]);
    } else if (clean.includes('?chatWith=')) {
      const match = clean.match(/[?&]chatWith=([^&]+)/);
      if (match && match[1]) clean = decodeURIComponent(match[1]);
    } else if (clean.includes('?join=')) {
      const match = clean.match(/[?&]join=([^&]+)/);
      if (match && match[1]) clean = decodeURIComponent(match[1]);
    } else if (clean.includes('/u/')) {
      const parts = clean.split('/u/');
      if (parts[1]) clean = parts[1].split(/[?#/]/)[0];
    }
    // Strip quotes and trailing slashes if accidentally pasted
    clean = clean.replace(/['"]/g, '').replace(/\/+$/, '').trim();
    onScan(clean);
  };

  useEffect(() => {
    let html5QrCode: any = null;
    let isMounted = true;

    // Load html5-qrcode
    import('html5-qrcode')
      .then(({ Html5Qrcode }) => {
        if (!isMounted) return;
        const readerElement = document.getElementById('qr-reader');
        if (!readerElement) {
          if (isMounted) {
            setLoadingScanner(false);
            setCameraError(true);
          }
          return;
        }

        const scanner = new Html5Qrcode('qr-reader');
        html5QrCode = scanner;

        scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText: string) => {
            scanner.stop().then(() => {
              cleanAndScan(decodedText);
            }).catch(() => {
              cleanAndScan(decodedText);
            });
          },
          () => {} // Frame scanning errors are benign
        )
        .then(() => {
          if (isMounted) setLoadingScanner(false);
        })
        .catch((err: any) => {
          console.warn('Camera scanner initialization failed:', err);
          if (isMounted) {
            setLoadingScanner(false);
            setCameraError(true);
          }
        });
      })
      .catch((err) => {
        console.error('Failed to load Html5Qrcode', err);
        if (isMounted) {
          setLoadingScanner(false);
          setCameraError(true);
        }
      });

    return () => {
      isMounted = false;
      if (html5QrCode) {
        try {
          html5QrCode.stop().then(() => html5QrCode.clear()).catch(() => {});
        } catch (e) {
          console.warn('Error clearing scanner', e);
        }
      }
    };
  }, []);

  const handleFileUploadScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      // Create hidden element if needed
      let cacheEl = document.getElementById('qr-file-cache');
      if (!cacheEl) {
        cacheEl = document.createElement('div');
        cacheEl.id = 'qr-file-cache';
        cacheEl.style.display = 'none';
        document.body.appendChild(cacheEl);
      }
      const fileScanner = new Html5Qrcode('qr-file-cache');
      const decodedText = await fileScanner.scanFile(file, true);
      fileScanner.clear();
      showNotification('QR code recognized from image!');
      cleanAndScan(decodedText);
    } catch (err) {
      console.warn('File scan failed', err);
      showNotification('No QR code found in selected image. Please try another image or enter ID.');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    cleanAndScan(manualCode);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#202c33] p-6 rounded-2xl w-full max-w-md border border-[#3b4a54] max-h-[92vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Scan className="w-5 h-5 text-[#00a884]" />
            <h2 className="text-xl font-bold text-[#e9edef]">Scan QR Code</h2>
          </div>
          <button onClick={onClose} className="text-[#8696a0] hover:text-[#e9edef]"><X className="w-5 h-5" /></button>
        </div>

        {/* Camera container */}
        <div className="overflow-hidden rounded-xl bg-black min-h-[240px] flex items-center justify-center relative border border-[#3b4a54]">
          <div id="qr-reader" className="w-full h-full min-h-[240px]" />
          
          {loadingScanner && !cameraError && (
            <div className="absolute inset-0 bg-[#111b21] flex flex-col items-center justify-center gap-2 text-[#8696a0] p-6">
              <div className="w-8 h-8 border-2 border-[#00a884] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-medium">Starting camera...</p>
            </div>
          )}

          {cameraError && (
            <div className="absolute inset-0 bg-[#111b21] flex flex-col items-center justify-center p-6 text-center">
              <Camera className="w-10 h-10 text-[#8696a0] mb-2" />
              <p className="text-sm font-semibold text-[#e9edef] mb-1">Camera is restricted or unavailable</p>
              <p className="text-xs text-[#8696a0] mb-4">You can still upload a QR code image or enter the User ID manually below.</p>
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition"
              >
                <ImageIcon className="w-4 h-4" /> Upload QR Code Image
              </button>
            </div>
          )}
        </div>

        {/* Alternate actions */}
        <div className="mt-4 space-y-3">
          <input 
            ref={fileInputRef}
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleFileUploadScan} 
          />

          {!cameraError && (
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 px-3 bg-[#2a3942] hover:bg-[#3b4a54] text-[#e9edef] text-xs font-medium rounded-lg flex items-center justify-center gap-2 border border-[#3b4a54] transition"
            >
              <ImageIcon className="w-4 h-4 text-[#00a884]" /> Choose QR Image from Gallery
            </button>
          )}

          {/* Manual Entry */}
          <form onSubmit={handleManualSubmit} className="pt-2 border-t border-[#3b4a54]">
            <label className="text-xs text-[#8696a0] block mb-1.5 font-medium">Or enter User ID, Profile link, or Group code manually:</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="User ID (e.g. 9VzYk...) or profile link..."
                className="flex-1 bg-[#111b21] border border-[#3b4a54] outline-none text-xs text-[#e9edef] rounded-lg px-3 py-2 font-mono focus:border-[#00a884]"
              />
              <button 
                type="submit"
                disabled={!manualCode.trim()}
                className="bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-bold px-4 py-2 rounded-lg transition disabled:opacity-50 shrink-0"
              >
                Connect
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

const GroupInfoModal = ({ 
  chat, 
  user, 
  onClose, 
  onLeave, 
  onCopyInvite,
  showNotification,
  onAddMember,
  activeUsers = []
}: { 
  chat: Chat, 
  user: UserProfile, 
  onClose: () => void, 
  onLeave: () => void,
  onCopyInvite: () => void,
  showNotification: (msg: string) => void,
  onAddMember?: (member: UserProfile) => void,
  activeUsers?: UserProfile[]
}) => {
  const [participants, setParticipants] = useState<{ uid: string, displayName: string, photoURL?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchParticipants = async () => {
      try {
        const userPromises = chat.participants.map(async (uid) => {
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            return { uid, displayName: data.displayName || 'User', photoURL: data.photoURL };
          }
          return { uid, displayName: uid === user.uid ? (user.displayName || 'You') : `User (${uid.slice(0, 5)})` };
        });
        const users = await Promise.all(userPromises);
        if (isMounted) {
          setParticipants(users);
          setLoading(false);
        }
      } catch (err) {
        console.warn('Failed to load participants', err);
        if (isMounted) setLoading(false);
      }
    };
    fetchParticipants();
    return () => { isMounted = false; };
  }, [chat.participants]);

  const candidatesToAdd = activeUsers.filter(u => 
    !chat.participants.includes(u.uid) && 
    (!memberSearch.trim() || (u.displayName || '').toLowerCase().includes(memberSearch.toLowerCase().trim()))
  );

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#202c33] p-6 rounded-2xl w-full max-w-md border border-[#3b4a54] max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#e9edef]">{chat.type === 'group' ? 'Group Info' : 'Chat Info'}</h2>
          <button onClick={onClose} className="text-[#8696a0] hover:text-[#e9edef]"><X className="w-5 h-5" /></button>
        </div>

        <div className="overflow-y-auto flex-1 pr-1 space-y-5">
          <div className="flex flex-col items-center text-center">
            <img src={getAvatarUrl(chat.id)} className="w-20 h-20 rounded-full object-cover border-2 border-[#00a884] mb-3 shadow-lg" alt={chat.name} />
            <h3 className="text-lg font-bold text-[#e9edef]">{chat.name}</h3>
            <p className="text-xs text-[#8696a0]">{chat.type === 'group' ? `Group • ${chat.participants.length} participants` : 'Direct Conversation'}</p>
          </div>

          {chat.type === 'group' && chat.groupCode && (
            <div className="bg-[#111b21] p-4 rounded-xl border border-[#3b4a54] space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#00a884] font-semibold uppercase tracking-wider">Group Code</span>
                <button 
                  onClick={onCopyInvite}
                  className="text-xs text-[#00a884] hover:underline flex items-center gap-1 font-medium"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Code
                </button>
              </div>
              <p className="text-xl font-mono font-bold text-[#e9edef] tracking-widest">{chat.groupCode}</p>
              <p className="text-[11px] text-[#8696a0]">Share this code or invite link so others can join this group.</p>
            </div>
          )}

          {chat.type === 'group' && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-semibold text-[#8696a0] uppercase tracking-wider">
                  Participants ({chat.participants.length})
                </h4>
                {onAddMember && (
                  <button
                    type="button"
                    onClick={() => setShowAddMember(!showAddMember)}
                    className="text-xs text-[#00a884] hover:underline font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{showAddMember ? 'Cancel' : 'Add by Name'}</span>
                  </button>
                )}
              </div>

              {/* Add member inline drawer */}
              {showAddMember && (
                <div className="mb-3 p-3 bg-[#111b21] rounded-xl border border-[#3b4a54] space-y-2">
                  <p className="text-xs font-semibold text-[#e9edef]">Search active users to add:</p>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#8696a0] absolute left-2.5 top-2.5" />
                    <input 
                      type="text" 
                      placeholder="Type name..." 
                      value={memberSearch} 
                      onChange={e => setMemberSearch(e.target.value)} 
                      className="w-full bg-[#202c33] border border-[#3b4a54] text-xs text-[#e9edef] rounded-lg pl-7 pr-2.5 py-1.5 outline-none focus:border-[#00a884]" 
                    />
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                    {candidatesToAdd.length === 0 ? (
                      <p className="text-[11px] text-[#8696a0] text-center py-2">No users to add</p>
                    ) : (
                      candidatesToAdd.map(cand => (
                        <div key={cand.uid} className="flex items-center justify-between p-1.5 rounded-lg bg-[#202c33] hover:bg-[#2a3942] text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <img 
                              src={getAvatarUrl(cand.uid, cand.photoURL)} 
                              className="w-5 h-5 rounded-full object-cover" 
                              alt={cand.displayName} 
                              onError={(e) => { (e.currentTarget as HTMLImageElement).src = getAvatarUrl(cand.uid); }} 
                            />
                            <span className="text-[#e9edef] truncate font-medium">{cand.displayName}</span>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => {
                              onAddMember?.(cand);
                              setShowAddMember(false);
                            }} 
                            className="px-2 py-0.5 bg-[#00a884] hover:bg-[#008f6f] text-white rounded text-[10px] font-semibold transition"
                          >
                            Add
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {participants.map((p) => (
                  <div key={p.uid} className="flex items-center justify-between p-2 rounded-lg bg-[#111b21] border border-[#2a3942]">
                    <div className="flex items-center gap-2.5">
                      <img src={getAvatarUrl(p.uid, p.photoURL)} className="w-8 h-8 rounded-full object-cover" alt="" />
                      <div>
                        <p className="text-sm font-medium text-[#e9edef]">{p.displayName} {p.uid === user.uid && '(You)'}</p>
                        <p className="text-[10px] text-[#8696a0] font-mono">{p.uid.slice(0, 8)}...</p>
                      </div>
                    </div>
                    {p.uid === chat.createdBy && (
                      <span className="text-[10px] bg-[#00a884]/20 text-[#00a884] px-2 py-0.5 rounded-full font-medium">Admin</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {chat.type === 'group' && (
            <button 
              onClick={onLeave}
              className="w-full py-2.5 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition"
            >
              <LogOut className="w-4 h-4" /> Exit Group
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupCode, setGroupCode] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [showQR, setShowQR] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [chatFilter, setChatFilter] = useState<'all' | 'direct' | 'group' | 'requests'>('all');
  const [showEmojiTray, setShowEmojiTray] = useState(false);

  // Developer Code Sharing & Fullscreen Viewer state (supports 10,000+ lines of code)
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [fullscreenCodeData, setFullscreenCodeData] = useState<CodeData | null>(null);
  const [codeModalInitialCode, setCodeModalInitialCode] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [detectedLargeCode, setDetectedLargeCode] = useState<string | null>(null);

  // WhatsApp-style message deletion & selection mode states
  const [deleteConfirmMessage, setDeleteConfirmMessage] = useState<Message | null>(null);
  const [showClearChatModal, setShowClearChatModal] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);

  // User Profile Viewing & Blocking state
  const [contactProfileModalUser, setContactProfileModalUser] = useState<{ uid: string; displayName: string; photoURL?: string } | null>(null);

  // Voice Note Recording state
  const [isRecordingVoiceNote, setIsRecordingVoiceNote] = useState(false);

  // Direct chat user caching for accurate friend's name and avatar display
  const [usersCache, setUsersCache] = useState<Record<string, { displayName: string; photoURL?: string }>>({});

  // Universal 2-hour temporary ID session timer
  const [sessionRemainingSeconds, setSessionRemainingSeconds] = useState<number | null>(null);

  // Active Users and User Search by Name state
  const [searchedUsers, setSearchedUsers] = useState<UserProfile[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [showFindPeopleModal, setShowFindPeopleModal] = useState(false);
  const [activeUsersList, setActiveUsersList] = useState<UserProfile[]>([]);

  // Group creation member selection state
  const [selectedGroupMemberUids, setSelectedGroupMemberUids] = useState<string[]>([]);
  const [groupMemberSearch, setGroupMemberSearch] = useState('');

  // Bidirectional Block state
  const [isBlockedByOther, setIsBlockedByOther] = useState(false);

  // In-app Delete Account confirmation modal state (no window.confirm)
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);

  const showNotification = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };
  
  // Voice Call state (Voice-only with real WebRTC audio playback)
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [activeCall, setActiveCall] = useState<any>(null);
  const [activeGroupCall, setActiveGroupCall] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [activeCallSeconds, setActiveCallSeconds] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const peerRef = useRef<any>(null);
  const callStatusUnsubRef = useRef<(() => void) | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const isInitialChatLoadRef = useRef(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [unreadWhileScrolled, setUnreadWhileScrolled] = useState(0);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    if (!navigator.onLine) {
      setIsOffline(true);
    }

    // Check stored 120-minute session from localStorage
    try {
      const stored = localStorage.getItem('chat120_user_session') || localStorage.getItem('chatwave_user_session');
      if (stored) {
        const parsed = JSON.parse(stored) as UserProfile;
        const now = Date.now();
        if (parsed.expiresAt && now >= parsed.expiresAt) {
          // Expired
          localStorage.removeItem('chat120_user_session');
          localStorage.removeItem('chatwave_user_session');
          deleteDoc(doc(db, 'users', parsed.uid)).catch(() => {});
          setUser(null);
          setAuthLoading(false);
          showNotification('Your previous 120-minute session expired and your ID was deleted.');
        } else {
          setUser(parsed);
          setAuthLoading(false);
          // Sync with Firestore in background
          getDoc(doc(db, 'users', parsed.uid)).then(snap => {
            if (snap.exists()) {
              const remote = snap.data() as UserProfile;
              setUser(prev => prev ? { ...prev, ...remote, photoURL: getAvatarUrl(remote.uid, remote.photoURL) } : null);
            } else {
              // The user document was deleted (fresh database reset)
              localStorage.removeItem('chat120_user_session');
              localStorage.removeItem('chatwave_user_session');
              setUser(null);
            }
          }).catch(() => {});
        }
      } else {
        setUser(null);
        setAuthLoading(false);
      }
    } catch {
      setUser(null);
      setAuthLoading(false);
    }

    // Check for join code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const joinCode = urlParams.get('join');
    if (joinCode) {
      setGroupCode(joinCode);
      setShowGroupModal(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setChats([]);
      setChatsLoading(false);
      return;
    }

    setChatsLoading(true);

    // Query participants without combining orderBy to prevent missing composite index errors
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chat));
      // In-memory sort by lastMessageAt descending
      chatList.sort((a, b) => {
        const timeA = a.lastMessageAt?.toMillis ? a.lastMessageAt.toMillis() : (a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0);
        const timeB = b.lastMessageAt?.toMillis ? b.lastMessageAt.toMillis() : (b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0);
        return timeB - timeA;
      });
      setChats(chatList);
      setActiveChat(prev => {
        if (!prev) return null;
        const fresh = chatList.find(c => c.id === prev.id);
        return fresh || prev;
      });
      setChatsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'chats');
      setChatsLoading(false);
    });

    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!activeChat) {
      isInitialChatLoadRef.current = true;
      setShowScrollToBottom(false);
      setUnreadWhileScrolled(0);
      return;
    }

    isInitialChatLoadRef.current = true;
    setShowScrollToBottom(false);
    setUnreadWhileScrolled(0);

    const q = query(
      collection(db, 'chats', activeChat.id, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const rawList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      const currentChatId = activeChat.id;
      const currentParticipants = activeChat.participants;

      const msgList = await Promise.all(
        rawList.map(async (msg) => {
          if (msg.isEncrypted && msg.e2eeIv && msg.text) {
            try {
              const dec = await e2ee.decrypt(msg.text, msg.e2eeIv, currentChatId, currentParticipants);
              return { ...msg, text: dec };
            } catch (err) {
              console.warn('Failed to decrypt message:', err);
            }
          }
          if (msg.isEncrypted && (msg as any).codeIv && msg.code) {
            try {
              const dec = await e2ee.decrypt(msg.code, (msg as any).codeIv, currentChatId, currentParticipants);
              return { ...msg, code: dec };
            } catch (err) {
              console.warn('Failed to decrypt code:', err);
            }
          }
          return msg;
        })
      );

      setMessages(msgList);

      if (isInitialChatLoadRef.current) {
        isInitialChatLoadRef.current = false;
        // On opening chat, jump directly to newest messages
        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
          } else {
            messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
          }
        }, 40);
      } else if (isNearBottomRef.current) {
        // User was already near bottom, smoothly follow new messages
        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
              top: chatContainerRef.current.scrollHeight,
              behavior: 'smooth'
            });
          } else {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }
        }, 50);
      } else {
        // User is currently reading older messages higher up!
        const lastMsg = msgList[msgList.length - 1];
        if (lastMsg && lastMsg.senderId === user?.uid) {
          // If the message was sent by the current user, scroll down to see it
          setTimeout(() => {
            if (chatContainerRef.current) {
              chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth'
              });
            }
          }, 50);
        } else if (lastMsg) {
          // Received a message while reading history: show count badge on scroll down button
          setUnreadWhileScrolled(prev => prev + 1);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `chats/${activeChat.id}/messages`);
    });

    return unsubscribe;
  }, [activeChat?.id, user?.uid]);

  // Resolve user profiles for DMs so Friend sees Mine name and Mine sees Friend's name
  useEffect(() => {
    if (!user || chats.length === 0) return;
    chats.forEach(chat => {
      if (chat.type === 'dm') {
        const otherId = chat.participants.find(p => p !== user.uid);
        if (otherId && !usersCache[otherId] && !chat.participantsDetails?.[otherId]) {
          getDoc(doc(db, 'users', otherId)).then(snap => {
            if (snap.exists()) {
              const uData = snap.data();
              setUsersCache(prev => ({
                ...prev,
                [otherId]: { displayName: uData.displayName || `User_${otherId.slice(0, 5)}`, photoURL: uData.photoURL }
              }));
            }
          }).catch(() => {});
        }
      }
    });
  }, [chats, user]);

  // Auto-delete / Disappearing Messages after 1 hour (WhatsApp-style)
  const ONE_HOUR_MS = 60 * 60 * 1000;

  const visibleMessages = useMemo(() => {
    if (!user) return [];
    const now = Date.now();
    const userClearTime = activeChat?.clearedAt?.[user.uid] 
      ? (activeChat.clearedAt[user.uid]?.toMillis ? activeChat.clearedAt[user.uid].toMillis() : new Date(activeChat.clearedAt[user.uid]).getTime())
      : 0;

    return messages.filter(m => {
      // Hidden if deleted for me
      if (m.deletedFor && m.deletedFor.includes(user.uid)) return false;

      // Hidden if sent by contact that is blocked by me in DM
      if (activeChat?.type === 'dm') {
        const otherUid = activeChat.participants.find(p => p !== user.uid);
        if (otherUid && user.blockedUsers?.includes(otherUid) && m.senderId === otherUid) {
          return false;
        }
      }

      const msgTime = m.createdAt?.toMillis ? m.createdAt.toMillis() : (m.createdAt ? new Date(m.createdAt).getTime() : now);
      // Hidden if before user's clear timestamp
      if (userClearTime && msgTime <= userClearTime) return false;

      // Automatically hide and delete after 1 hour
      if (m.createdAt && (now - msgTime > ONE_HOUR_MS)) {
        return false;
      }
      return true;
    });
  }, [messages, user, activeChat]);

  // Background 1-hour old message permanent cleanup for the active chat
  useEffect(() => {
    if (!activeChat) return;
    const cleanupOldMessages = async () => {
      const now = Date.now();
      const expiredMsgs = messages.filter(m => {
        if (!m.createdAt) return false;
        const msgTime = m.createdAt?.toMillis ? m.createdAt.toMillis() : new Date(m.createdAt).getTime();
        return (now - msgTime > ONE_HOUR_MS);
      });

      for (const expMsg of expiredMsgs) {
        try {
          await deleteDoc(doc(db, 'chats', activeChat.id, 'messages', expMsg.id));
        } catch {}
      }
    };

    cleanupOldMessages();
    const interval = setInterval(cleanupOldMessages, 60000);
    return () => clearInterval(interval);
  }, [activeChat, messages]);

  // Universal ID Auto-Deletion & Countdown (Supports customizable duration or Off)
  useEffect(() => {
    if (!user) {
      setSessionRemainingSeconds(null);
      return;
    }

    const checkExpiry = async () => {
      // If user turned off auto-delete (expiresAt is null or 0)
      if (!user.expiresAt || user.expiresAt <= 0) {
        setSessionRemainingSeconds(null);
        return;
      }

      const now = Date.now();
      const expiresAt = user.expiresAt;
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setSessionRemainingSeconds(remaining);

      if (remaining <= 0) {
        try {
          await deleteDoc(doc(db, 'users', user.uid));
        } catch (e) {
          console.warn('Failed to delete expired user doc:', e);
        }
        localStorage.removeItem('chatwave_user_session');
        setUser(null);
        setActiveChat(null);
        showNotification('Your temporary ID has expired and was automatically deleted.');
      }
    };

    checkExpiry();
    const timer = setInterval(checkExpiry, 1000);
    return () => clearInterval(timer);
  }, [user]);

  // Adjust account auto-delete lifetime or turn it off
  const handleUpdateExpiry = async (newDurationMs: number | null) => {
    if (!user) return;
    const now = Date.now();
    const newExpiresAt = newDurationMs !== null ? now + newDurationMs : null;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        expiresAt: newExpiresAt,
        autoDeleteDuration: newDurationMs
      });
      const updatedUser: UserProfile = {
        ...user,
        expiresAt: newExpiresAt,
        autoDeleteDuration: newDurationMs
      };
      setUser(updatedUser);
      localStorage.setItem('chatwave_user_session', JSON.stringify(updatedUser));
      if (newDurationMs === null) {
        setSessionRemainingSeconds(null);
        showNotification('Auto-delete turned OFF. Account will be kept.');
      } else {
        const remaining = Math.max(0, Math.floor(newDurationMs / 1000));
        setSessionRemainingSeconds(remaining);
        showNotification('Account lifetime updated successfully.');
      }
    } catch (e) {
      console.error('Failed to update account expiry:', e);
      showNotification('Failed to update account expiry.');
    }
  };

  // Clear all chat messages, active chats, and cached data
  const handleClearAllData = async () => {
    if (!user) return;
    try {
      // Update clearedAt timestamp for all chats user participates in
      for (const c of chats) {
        try {
          await updateDoc(doc(db, 'chats', c.id), {
            [`clearedAt.${user.uid}`]: serverTimestamp(),
          });
        } catch {}
      }
      setMessages([]);
      setActiveChat(null);
      setSearchQuery('');
      setShowProfileModal(false);
      showNotification('All chat history and cache cleared successfully.');
    } catch (e) {
      console.error('Failed to clear chat data:', e);
      showNotification('Failed to clear chat data.');
    }
  };

  // Delete account and permanently wipe user doc, auth, and local session
  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid));
    } catch (e) {
      console.warn('Failed to delete user doc in firestore:', e);
    }
    try {
      if (auth.currentUser) {
        await auth.currentUser.delete().catch(() => signOut(auth));
      } else {
        await signOut(auth);
      }
    } catch {}
    localStorage.removeItem('chatwave_user_session');
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith('chatwave_')) {
        localStorage.removeItem(key);
      }
    }
    setUser(null);
    setActiveChat(null);
    setChats([]);
    setMessages([]);
    setShowProfileModal(false);
    setShowDeleteAccountConfirm(false);
    showNotification('Account and ID permanently deleted.');
  };

  // Delete session manually on exit
  const handleDeleteSession = async () => {
    await handleDeleteAccount();
  };

  // Real-time user search by name or short user ID
  useEffect(() => {
    if (!user || !searchQuery.trim()) {
      setSearchedUsers([]);
      setIsSearchingUsers(false);
      return;
    }

    const queryTerm = searchQuery.trim().toLowerCase();
    setIsSearchingUsers(true);

    const debounce = setTimeout(async () => {
      try {
        const snap = await getDocs(collection(db, 'users'));
        const now = Date.now();
        const matches: UserProfile[] = [];

        snap.forEach(d => {
          const u = d.data() as UserProfile;
          if (u.uid === user.uid) return;
          if (u.expiresAt && u.expiresAt > 0 && now > u.expiresAt) return;
          // Privacy: hide users whom I have blocked, or who have blocked me
          if (user.blockedUsers?.includes(u.uid) || u.blockedUsers?.includes(user.uid)) return;
          const dName = (u.displayName || '').toLowerCase();
          const uName = (u.username || '').toLowerCase();
          const uidStr = (u.uid || '').toLowerCase();
          if (dName.includes(queryTerm) || uName.includes(queryTerm) || uidStr.includes(queryTerm)) {
            matches.push({
              ...u,
              photoURL: getAvatarUrl(u.uid, u.photoURL)
            });
          }
        });

        setSearchedUsers(matches);
      } catch (err) {
        console.warn('User search error:', err);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 200);

    return () => clearTimeout(debounce);
  }, [searchQuery, user]);

  const loadActiveUsers = async () => {
    if (!user) return;
    try {
      const snap = await getDocs(collection(db, 'users'));
      const now = Date.now();
      const list: UserProfile[] = [];
      snap.forEach(d => {
        const u = d.data() as UserProfile;
        if (u.uid === user.uid) return;
        if (u.expiresAt && u.expiresAt > 0 && now > u.expiresAt) return;
        // Privacy: hide users whom I have blocked, or who have blocked me
        if (user.blockedUsers?.includes(u.uid) || u.blockedUsers?.includes(user.uid)) return;
        list.push({ ...u, photoURL: getAvatarUrl(u.uid, u.photoURL) });
      });
      list.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
      setActiveUsersList(list);
    } catch (e) {
      console.warn('Failed to load active users:', e);
    }
  };

  const handleOpenSelfChat = async () => {
    if (!user) return;
    try {
      // Check existing in-memory chats for self-chat
      const existing = chats.find(c => c.type === 'dm' && c.participants.length === 1 && c.participants[0] === user.uid);
      if (existing) {
        setActiveChat(existing);
        setSearchQuery('');
        setShowFindPeopleModal(false);
        return;
      }

      // Check Firestore
      const q = query(
        collection(db, 'chats'),
        where('type', '==', 'dm'),
        where('participants', 'array-contains', user.uid)
      );
      const snap = await getDocs(q);
      const foundDoc = snap.docs.find(d => {
        const c = d.data() as Chat;
        return c.participants && c.participants.length === 1 && c.participants[0] === user.uid;
      });

      if (foundDoc) {
        const chatData = { id: foundDoc.id, ...foundDoc.data() } as Chat;
        setActiveChat(chatData);
        setSearchQuery('');
        setShowFindPeopleModal(false);
        return;
      }

      // Create new self chat document
      const participantsDetails = {
        [user.uid]: { displayName: `${user.displayName} (Notes)`, photoURL: user.photoURL || '' }
      };

      const newChatRef = await addDoc(collection(db, 'chats'), {
        type: 'dm',
        name: `${user.displayName} (Notes)`,
        participants: [user.uid],
        participantsDetails,
        requestStatus: 'accepted',
        lastMessage: '📝 Notes to Self: Type any message, code, or file to test your chat box',
        lastMessageAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });

      const newChatObj: Chat = {
        id: newChatRef.id,
        type: 'dm',
        name: `${user.displayName} (Notes)`,
        participants: [user.uid],
        participantsDetails,
        requestStatus: 'accepted',
        lastMessage: '📝 Notes to Self: Type any message, code, or file to test your chat box'
      };

      setActiveChat(newChatObj);
      setSearchQuery('');
      setShowFindPeopleModal(false);
      showNotification('Chat box opened! Send notes, test code & files.');
    } catch (err) {
      console.error('Failed to open self chat', err);
      showNotification('Could not open Notes chat.');
    }
  };

  const handleStartDirectChat = async (targetUser: UserProfile) => {
    if (!user) return;
    if (targetUser.uid === user.uid) {
      await handleOpenSelfChat();
      return;
    }

    if (user.blockedUsers?.includes(targetUser.uid)) {
      showNotification("You have blocked this contact. Unblock them first in Settings.");
      return;
    }

    try {
      // Check existing in-memory chats
      const existing = chats.find(c => c.type === 'dm' && c.participants.includes(targetUser.uid));
      if (existing) {
        setActiveChat(existing);
        setSearchQuery('');
        setShowFindPeopleModal(false);
        return;
      }

      // Check Firestore
      const q = query(
        collection(db, 'chats'),
        where('type', '==', 'dm'),
        where('participants', 'array-contains', user.uid)
      );
      const snap = await getDocs(q);
      const foundDoc = snap.docs.find(d => (d.data() as Chat).participants.includes(targetUser.uid));

      if (foundDoc) {
        const chatData = { id: foundDoc.id, ...foundDoc.data() } as Chat;
        setActiveChat(chatData);
        setSearchQuery('');
        setShowFindPeopleModal(false);
        return;
      }

      const participantsDetails = {
        [user.uid]: { displayName: user.displayName, photoURL: user.photoURL || '' },
        [targetUser.uid]: { displayName: targetUser.displayName, photoURL: targetUser.photoURL || '' }
      };

      const newChatRef = await addDoc(collection(db, 'chats'), {
        type: 'dm',
        name: `${user.displayName} & ${targetUser.displayName}`,
        participants: [user.uid, targetUser.uid],
        participantsDetails,
        requestStatus: 'pending',
        requestSenderId: user.uid,
        requestReceiverId: targetUser.uid,
        lastMessage: '👋 Chat request sent',
        lastMessageAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });

      const newChatObj: Chat = {
        id: newChatRef.id,
        type: 'dm',
        name: `${user.displayName} & ${targetUser.displayName}`,
        participants: [user.uid, targetUser.uid],
        participantsDetails,
        requestStatus: 'pending',
        requestSenderId: user.uid,
        requestReceiverId: targetUser.uid,
        lastMessage: '👋 Chat request sent'
      };

      setUsersCache(prev => ({
        ...prev,
        [targetUser.uid]: { displayName: targetUser.displayName, photoURL: targetUser.photoURL }
      }));

      setActiveChat(newChatObj);
      setSearchQuery('');
      setShowFindPeopleModal(false);
      showNotification(`Chat request sent to ${targetUser.displayName}!`);
    } catch (err) {
      console.error('Failed to send chat request', err);
      showNotification('Could not send chat request.');
    }
  };

  const handleAcceptChatRequest = async (chatId: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'chats', chatId), {
        requestStatus: 'accepted',
        acceptedAt: serverTimestamp(),
        lastMessage: '🤝 Chat request accepted',
        lastMessageAt: serverTimestamp(),
      });

      // System notification message in the chat
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        chatId,
        senderId: 'system',
        senderName: 'System',
        text: '🤝 Chat request accepted! You can now send end-to-end encrypted messages and make voice calls.',
        type: 'text',
        createdAt: serverTimestamp(),
      });

      setActiveChat(prev => (prev?.id === chatId ? { ...prev, requestStatus: 'accepted' } : prev));
      showNotification('Chat request accepted! You can now chat.');
    } catch (err) {
      console.error('Failed to accept chat request:', err);
      showNotification('Failed to accept request.');
    }
  };

  const handleDeclineChatRequest = async (chatId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'chats', chatId));
      if (activeChat?.id === chatId) {
        setActiveChat(null);
      }
      showNotification('Chat request declined.');
    } catch (err) {
      console.error('Failed to decline chat request:', err);
      showNotification('Failed to decline request.');
    }
  };

  const handleCancelChatRequest = async (chatId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'chats', chatId));
      if (activeChat?.id === chatId) {
        setActiveChat(null);
      }
      showNotification('Chat request canceled.');
    } catch (err) {
      console.error('Failed to cancel chat request:', err);
      showNotification('Failed to cancel request.');
    }
  };

  const handleAddMemberToGroup = async (targetUser: UserProfile) => {
    if (!activeChat || !user) return;
    try {
      const updatedParticipants = Array.from(new Set([...activeChat.participants, targetUser.uid]));
      const updatedDetails = {
        ...(activeChat.participantsDetails || {}),
        [targetUser.uid]: { displayName: targetUser.displayName, photoURL: targetUser.photoURL || '' }
      };

      await updateDoc(doc(db, 'chats', activeChat.id), {
        participants: updatedParticipants,
        participantsDetails: updatedDetails,
        lastMessage: `${user.displayName} added ${targetUser.displayName}`,
        lastMessageAt: serverTimestamp(),
      });

      setActiveChat(prev => prev ? {
        ...prev,
        participants: updatedParticipants,
        participantsDetails: updatedDetails
      } : null);

      showNotification(`Added ${targetUser.displayName} to "${activeChat.name}"`);
    } catch (err) {
      console.error('Failed to add member to group', err);
      showNotification('Failed to add member.');
    }
  };

  // Call signaling (Voice-only, auto-ignoring blocked contacts)
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'calls'),
      where('receiverId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ringingCall = snapshot.docs.find(d => {
        const data = d.data();
        if (data.status !== 'ringing') return false;
        // Don't ring if the caller is in your blocked list
        if (user.blockedUsers && user.blockedUsers.includes(data.callerId)) return false;
        return true;
      });
      if (ringingCall) {
        const callData = { id: ringingCall.id, ...ringingCall.data() };
        setIncomingCall(callData);
      } else {
        setIncomingCall(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'calls');
    });

    return unsubscribe;
  }, [user]);

  // Voice Call Active Timer
  useEffect(() => {
    let timer: any = null;
    if (activeCall) {
      setActiveCallSeconds(0);
      timer = setInterval(() => {
        setActiveCallSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setActiveCallSeconds(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeCall?.id]);

  // User Blocking & Unblocking logic with real-time bidirectional sync
  const handleToggleBlock = async (targetUid: string) => {
    if (!user) return;
    const currentBlocked = user.blockedUsers || [];
    const isAlreadyBlocked = currentBlocked.includes(targetUid);
    const updatedBlocked = isAlreadyBlocked
      ? currentBlocked.filter(id => id !== targetUid)
      : [...currentBlocked, targetUid];

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        blockedUsers: updatedBlocked
      });
      setUser(prev => prev ? { ...prev, blockedUsers: updatedBlocked } : null);

      // Synchronize block state across DM chat documents in Firestore so the other user is immediately blocked in real time
      try {
        const chatQ = query(
          collection(db, 'chats'),
          where('type', '==', 'dm'),
          where('participants', 'array-contains', user.uid)
        );
        const snap = await getDocs(chatQ);
        for (const cDoc of snap.docs) {
          const cData = cDoc.data() as Chat;
          if (cData.participants?.includes(targetUid)) {
            const currentBlockedBy = cData.blockedBy || [];
            const newBlockedBy = isAlreadyBlocked
              ? currentBlockedBy.filter(id => id !== user.uid)
              : Array.from(new Set([...currentBlockedBy, user.uid]));
            await updateDoc(cDoc.ref, { blockedBy: newBlockedBy });
            if (activeChat?.id === cDoc.id) {
              setActiveChat(prev => prev ? { ...prev, blockedBy: newBlockedBy } : null);
            }
          }
        }
      } catch (chatSyncErr) {
        console.warn('Chat block sync warning:', chatSyncErr);
      }

      showNotification(isAlreadyBlocked ? 'Contact unblocked successfully.' : 'Contact blocked successfully.');
    } catch (err) {
      console.error('Failed to update blocked users', err);
      showNotification('Failed to update block status.');
    }
  };

  // Real-time check if active chat contact has blocked current user
  useEffect(() => {
    if (!activeChat || activeChat.type !== 'dm' || !user) {
      setIsBlockedByOther(false);
      return;
    }
    const otherUid = activeChat.participants.find(p => p !== user.uid);
    if (!otherUid) {
      setIsBlockedByOther(false);
      return;
    }

    if (activeChat.blockedBy && activeChat.blockedBy.includes(otherUid)) {
      setIsBlockedByOther(true);
      return;
    }

    let isMounted = true;
    getDoc(doc(db, 'users', otherUid)).then(snap => {
      if (!isMounted) return;
      if (snap.exists()) {
        const oData = snap.data();
        const otherBlockedList = (oData?.blockedUsers as string[]) || [];
        setIsBlockedByOther(otherBlockedList.includes(user.uid));
      } else {
        setIsBlockedByOther(false);
      }
    }).catch(() => {
      if (isMounted) setIsBlockedByOther(false);
    });

    return () => { isMounted = false; };
  }, [activeChat?.id, activeChat?.blockedBy, user?.uid]);

  // Voice Note sending logic
  const handleSendVoiceNote = async (audioBlob: Blob, duration: number) => {
    if (!activeChat || !user) return;

    // Request guard
    if (activeChat.type === 'dm' && activeChat.requestStatus === 'pending') {
      showNotification(activeChat.requestSenderId === user.uid ? "Waiting for user to accept your chat request." : "Please accept the chat request to send voice notes.");
      return;
    }

    // Block guard
    if (activeChat.type === 'dm') {
      const otherUid = activeChat.participants.find(p => p !== user.uid);
      const isBlockedByMe = otherUid ? (user.blockedUsers?.includes(otherUid) || false) : false;
      if (isBlockedByMe) {
        showNotification("You have blocked this contact. Unblock to send voice notes.");
        return;
      }
    }
    try {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Audio = reader.result as string;
          const msgData = {
            chatId: activeChat.id,
            senderId: user.uid,
            senderName: user.displayName,
            type: 'audio',
            audioUrl: base64Audio,
            audioDuration: duration,
            text: '🎤 Voice note',
            createdAt: serverTimestamp(),
          };

          await addDoc(collection(db, 'chats', activeChat.id, 'messages'), msgData);
          await updateDoc(doc(db, 'chats', activeChat.id), {
            lastMessage: `🎤 Voice note (${Math.floor(duration / 60)}:${duration % 60 < 10 ? '0' : ''}${duration % 60})`,
            lastMessageAt: serverTimestamp(),
          });
          setIsRecordingVoiceNote(false);
          showNotification('Voice note sent!');
        } catch (err) {
          console.error('Failed to send voice note', err);
          showNotification('Failed to send voice note.');
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(audioBlob);
    } catch (err) {
      console.error('Failed to process voice note', err);
      setIsUploading(false);
      showNotification('Failed to record voice note.');
    }
  };

  // WhatsApp-style Delete for Everyone / Delete for Me (Individual Message Deletion)
  const handleDeleteForEveryone = async (msg: Message) => {
    if (!activeChat) return;
    setDeleteConfirmMessage(null);
    try {
      const msgRef = doc(db, 'chats', activeChat.id, 'messages', msg.id);
      await updateDoc(msgRef, {
        deletedForEveryone: true,
        text: '🚫 This message was deleted',
        imageUrl: null,
        videoUrl: null,
        fileUrl: null,
        audioUrl: null,
        code: null,
        codeTitle: null,
      });
      showNotification('Message deleted for everyone');
    } catch (err) {
      console.error('Failed to delete for everyone', err);
      showNotification('Failed to delete message');
    }
  };

  const handleDeleteForMe = async (msg: Message) => {
    if (!activeChat || !user) return;
    setDeleteConfirmMessage(null);
    try {
      const msgRef = doc(db, 'chats', activeChat.id, 'messages', msg.id);
      const existing = msg.deletedFor || [];
      if (!existing.includes(user.uid)) {
        await updateDoc(msgRef, {
          deletedFor: [...existing, user.uid]
        });
      }
      showNotification('Message deleted for you');
    } catch (err) {
      console.error('Failed to delete for me', err);
      showNotification('Failed to delete message');
    }
  };

  // Multi-Select Batch Deletion Handlers
  const handleBatchDeleteForEveryone = async () => {
    if (!activeChat || !user || selectedMessageIds.length === 0) return;
    setShowBatchDeleteModal(false);
    try {
      const msgsToDelete = messages.filter(m => selectedMessageIds.includes(m.id) && m.senderId === user.uid);
      for (const m of msgsToDelete) {
        const msgRef = doc(db, 'chats', activeChat.id, 'messages', m.id);
        await updateDoc(msgRef, {
          deletedForEveryone: true,
          text: '🚫 This message was deleted',
          imageUrl: null,
          videoUrl: null,
          fileUrl: null,
          audioUrl: null,
          code: null,
          codeTitle: null,
        });
      }
      setSelectedMessageIds([]);
      setIsSelectMode(false);
      showNotification(`${msgsToDelete.length} message(s) deleted for everyone`);
    } catch (err) {
      console.error('Failed to batch delete for everyone', err);
      showNotification('Failed to delete messages');
    }
  };

  const handleBatchDeleteForMe = async () => {
    if (!activeChat || !user || selectedMessageIds.length === 0) return;
    setShowBatchDeleteModal(false);
    try {
      for (const msgId of selectedMessageIds) {
        const msgRef = doc(db, 'chats', activeChat.id, 'messages', msgId);
        const msg = messages.find(m => m.id === msgId);
        const existing = msg?.deletedFor || [];
        if (!existing.includes(user.uid)) {
          await updateDoc(msgRef, {
            deletedFor: [...existing, user.uid]
          });
        }
      }
      setSelectedMessageIds([]);
      setIsSelectMode(false);
      showNotification(`${selectedMessageIds.length} message(s) deleted for you`);
    } catch (err) {
      console.error('Failed to batch delete for me', err);
      showNotification('Failed to delete messages');
    }
  };

  // Incoming Call Ringtone Chime using Web Audio API
  useEffect(() => {
    if (!incomingCall) return;

    let ringInterval: any = null;
    const playChime = () => {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, ctx.currentTime);
        osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.8);
      } catch {}
    };

    playChime();
    ringInterval = setInterval(playChime, 2500);

    return () => {
      if (ringInterval) clearInterval(ringInterval);
    };
  }, [incomingCall]);

  const handleClearChatForMe = async () => {
    if (!activeChat || !user) return;
    setShowClearChatModal(false);
    try {
      await updateDoc(doc(db, 'chats', activeChat.id), {
        [`clearedAt.${user.uid}`]: serverTimestamp(),
      });
      showNotification('Chat history cleared for you');
    } catch (err) {
      console.error('Failed to clear chat for me', err);
      showNotification('Failed to clear chat');
    }
  };

  const handleClearChatForEveryone = async () => {
    if (!activeChat) return;
    setShowClearChatModal(false);
    try {
      const q = query(collection(db, 'chats', activeChat.id, 'messages'));
      const snap = await getDocs(q);
      for (const mDoc of snap.docs) {
        await deleteDoc(mDoc.ref);
      }
      await updateDoc(doc(db, 'chats', activeChat.id), {
        lastMessage: 'Messages cleared',
        lastMessageAt: serverTimestamp(),
      });
      showNotification('Chat history cleared for everyone');
    } catch (err) {
      console.error('Failed to clear chat for everyone', err);
      showNotification('Failed to clear chat');
    }
  };

  const handleChatScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const nearBottom = distanceFromBottom < 100;
    isNearBottomRef.current = nearBottom;
    setShowScrollToBottom(distanceFromBottom > 150);
    if (nearBottom) {
      setUnreadWhileScrolled(0);
    }
  };

  const scrollToBottom = (smooth = true) => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
      setShowScrollToBottom(false);
      setUnreadWhileScrolled(0);
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !activeChat || !user) return;

    // Request guard
    if (activeChat.type === 'dm' && activeChat.requestStatus === 'pending') {
      showNotification(activeChat.requestSenderId === user.uid ? "Waiting for user to accept your chat request." : "Please accept the chat request to send messages.");
      return;
    }

    // Block guard
    if (activeChat.type === 'dm') {
      const otherUid = activeChat.participants.find(p => p !== user.uid);
      const isBlockedByMe = otherUid ? (user.blockedUsers?.includes(otherUid) || false) : false;
      if (isBlockedByMe) {
        showNotification("You have blocked this contact. Unblock to send messages.");
        return;
      }
    }

    const msgText = newMessage;
    setNewMessage('');
    setDetectedLargeCode(null);
    isNearBottomRef.current = true;
    setTimeout(() => scrollToBottom(true), 50);

    // If message is surrounded by ```...``` markdown code block, save as code message
    const trimmed = msgText.trim();
    const isMarkdownCode = trimmed.startsWith('```') && trimmed.endsWith('```') && trimmed.length > 6;

    try {
      if (isMarkdownCode) {
        const match = trimmed.match(/^```([a-zA-Z0-9_-]*)\n?([\s\S]+)```$/);
        const codeLang = match?.[1] || 'typescript';
        const rawCode = match?.[2]?.trim() || trimmed;
        const lineCount = rawCode.split('\n').length;
        const preview = `💻 [${codeLang.toUpperCase()}] Code snippet (${lineCount} lines)`;

        const encrypted = await e2ee.encrypt(rawCode, activeChat.id, activeChat.participants);

        await addDoc(collection(db, 'chats', activeChat.id, 'messages'), {
          chatId: activeChat.id,
          senderId: user.uid,
          senderName: user.displayName,
          text: preview,
          code: encrypted.ciphertext,
          codeIv: encrypted.iv,
          isEncrypted: !!encrypted.iv,
          codeLanguage: codeLang,
          codeLineCount: lineCount,
          type: 'code',
          createdAt: serverTimestamp(),
        });

        await updateDoc(doc(db, 'chats', activeChat.id), {
          lastMessage: preview,
          lastMessageAt: serverTimestamp(),
        });
      } else {
        const encrypted = await e2ee.encrypt(msgText, activeChat.id, activeChat.participants);

        await addDoc(collection(db, 'chats', activeChat.id, 'messages'), {
          chatId: activeChat.id,
          senderId: user.uid,
          senderName: user.displayName,
          text: encrypted.ciphertext,
          e2eeIv: encrypted.iv,
          isEncrypted: !!encrypted.iv,
          type: 'text',
          createdAt: serverTimestamp(),
        });

        await updateDoc(doc(db, 'chats', activeChat.id), {
          lastMessage: msgText,
          lastMessageAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Failed to send message', error);
      handleFirestoreError(error, OperationType.WRITE, `chats/${activeChat.id}`);
    }
  };

  const handleSendCode = async (codeData: { code: string; language: string; title?: string }) => {
    if (!activeChat || !user || !codeData.code.trim()) return;

    // Request guard
    if (activeChat.type === 'dm' && activeChat.requestStatus === 'pending') {
      showNotification(activeChat.requestSenderId === user.uid ? "Waiting for user to accept your chat request." : "Please accept the chat request to send code.");
      return;
    }

    // Block guard
    if (activeChat.type === 'dm') {
      const otherUid = activeChat.participants.find(p => p !== user.uid);
      const isBlockedByMe = otherUid ? (user.blockedUsers?.includes(otherUid) || false) : false;
      if (isBlockedByMe) {
        showNotification("You have blocked this contact. Unblock to send code.");
        return;
      }
    }

    const lineCount = codeData.code.split('\n').length;
    const preview = codeData.title 
      ? `💻 [${codeData.language.toUpperCase()}] ${codeData.title} (${lineCount} lines)`
      : `💻 [${codeData.language.toUpperCase()}] Code snippet (${lineCount} lines)`;

    try {
      const encrypted = await e2ee.encrypt(codeData.code, activeChat.id, activeChat.participants);

      await addDoc(collection(db, 'chats', activeChat.id, 'messages'), {
        chatId: activeChat.id,
        senderId: user.uid,
        senderName: user.displayName,
        text: preview,
        code: encrypted.ciphertext,
        codeIv: encrypted.iv,
        isEncrypted: !!encrypted.iv,
        codeLanguage: codeData.language,
        codeTitle: codeData.title || '',
        codeLineCount: lineCount,
        type: 'code',
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'chats', activeChat.id), {
        lastMessage: preview,
        lastMessageAt: serverTimestamp(),
      });
      showNotification('Code snippet shared successfully!');
    } catch (error) {
      console.error('Failed to send code snippet', error);
      handleFirestoreError(error, OperationType.WRITE, `chats/${activeChat.id}`);
      showNotification('Failed to send code snippet.');
    }
  };

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    if (!activeChat || !user) return;
    try {
      const msgRef = doc(db, 'chats', activeChat.id, 'messages', messageId);
      const msgDoc = await getDoc(msgRef);
      if (!msgDoc.exists()) return;

      const currentReactions: Record<string, string[]> = msgDoc.data()?.reactions || {};
      const userList = currentReactions[emoji] || [];
      const hasReacted = userList.includes(user.uid);

      const updatedUsers = hasReacted 
        ? userList.filter(id => id !== user.uid)
        : [...userList, user.uid];

      const newReactions = { ...currentReactions };
      if (updatedUsers.length > 0) {
        newReactions[emoji] = updatedUsers;
      } else {
        delete newReactions[emoji];
      }

      await updateDoc(msgRef, { reactions: newReactions });
    } catch (err) {
      console.warn('Reaction update failed', err);
    }
  };

  const handleTogglePin = async (messageId: string, currentPin?: boolean) => {
    if (!activeChat) return;
    try {
      const msgRef = doc(db, 'chats', activeChat.id, 'messages', messageId);
      await updateDoc(msgRef, { isPinned: !currentPin });
      showNotification(!currentPin ? 'Message pinned!' : 'Message unpinned');
    } catch (err) {
      console.warn('Pin toggle failed', err);
    }
  };

  const processFileAndSend = async (file: File) => {
    if (!file || !activeChat || !user) return;

    // Request guard
    if (activeChat.type === 'dm' && activeChat.requestStatus === 'pending') {
      showNotification(activeChat.requestSenderId === user.uid ? "Waiting for user to accept your chat request." : "Please accept the chat request to send files.");
      return;
    }

    // Block guard
    if (activeChat.type === 'dm') {
      const otherUid = activeChat.participants.find(p => p !== user.uid);
      const isBlockedByMe = otherUid ? (user.blockedUsers?.includes(otherUid) || false) : false;
      if (isBlockedByMe) {
        showNotification("You have blocked this contact. Unblock to send files.");
        return;
      }
    }

    setShowAttachMenu(false);
    setIsUploading(true);
    try {
      const isImg = file.type.startsWith('image/');
      const isVid = file.type.startsWith('video/');
      const isCodeOrText = file.name.match(/\.(txt|md|log|json|csv|env|py|js|ts|tsx|jsx|html|htm|css|sql|sh|yaml|yml|java|c|cpp|h|hpp|rs|go|xml|php|rb|swift|kt|dart|ini|conf|bash|zsh)$/i) || file.type.startsWith('text/');
      
      // Automatically preview all code and text files inline so download is not needed!
      if (isCodeOrText && file.size < 10 * 1024 * 1024) {
        try {
          const codeText = await file.text();
          const ext = file.name.split('.').pop()?.toLowerCase() || 'txt';
          await handleSendCode({
            code: codeText,
            language: ext,
            title: file.name
          });
          setIsUploading(false);
          return;
        } catch (codeReadErr) {
          console.warn('Fallback to standard file for code upload', codeReadErr);
        }
      }

      const msgType: 'image' | 'video' | 'file' = isImg ? 'image' : isVid ? 'video' : 'file';

      let mediaUrl = '';
      if (isImg) {
        try {
          // Fast high-quality compressed image (<50ms, ~50KB)
          mediaUrl = await compressImage(file, 960, 0.72);
        } catch {
          mediaUrl = await readFileAsDataURL(file);
        }
      } else {
        if (file.size > 100 * 1024 * 1024) {
          showNotification('File exceeds 100MB limit. Please choose a file up to 100MB.');
          setIsUploading(false);
          return;
        }
        if (file.size <= 700 * 1024) {
          mediaUrl = await readFileAsDataURL(file);
        }
      }

      // Upload to Cloud Storage for all files (especially large files up to 100MB)
      try {
        showNotification(`Uploading ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)...`);
        const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const fileRef = ref(storage, `chats/${activeChat.id}/${safeName}`);
        await uploadBytes(fileRef, file);
        const storageUrl = await getDownloadURL(fileRef);
        if (storageUrl) mediaUrl = storageUrl;
      } catch (storageErr) {
        console.warn('Storage upload note:', storageErr);
        if (!mediaUrl) {
          if (file.size <= 700 * 1024) {
            mediaUrl = await readFileAsDataURL(file);
          } else {
            showNotification('Upload failed. Cloud storage required for files over 1MB.');
            setIsUploading(false);
            return;
          }
        }
      }

      const defaultText = msgType === 'image' ? '📷 Photo' : msgType === 'video' ? '🎥 Video' : `📄 ${file.name}`;
      
      await addDoc(collection(db, 'chats', activeChat.id, 'messages'), {
        chatId: activeChat.id,
        senderId: user.uid,
        senderName: user.displayName,
        text: defaultText,
        imageUrl: msgType === 'image' ? mediaUrl : null,
        videoUrl: msgType === 'video' ? mediaUrl : null,
        fileUrl: msgType === 'file' ? mediaUrl : null,
        fileName: file.name,
        fileSize: file.size,
        type: msgType,
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'chats', activeChat.id), {
        lastMessage: defaultText,
        lastMessageAt: serverTimestamp(),
      });
      showNotification('Media sent successfully!');
    } catch (error) {
      console.error('Upload failed', error);
      showNotification('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, mediaKind: 'media' | 'doc' | 'camera' = 'media') => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFileAndSend(file);
    if (e.target) e.target.value = '';
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !user) return;

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const allParticipants = Array.from(new Set([user.uid, ...selectedGroupMemberUids]));

    const participantsDetails: Record<string, { displayName: string; photoURL?: string }> = {
      [user.uid]: { displayName: user.displayName, photoURL: user.photoURL || '' }
    };

    selectedGroupMemberUids.forEach(mUid => {
      const found = activeUsersList.find(u => u.uid === mUid) || searchedUsers.find(u => u.uid === mUid) || usersCache[mUid];
      participantsDetails[mUid] = {
        displayName: found?.displayName || `User_${mUid.slice(0, 5)}`,
        photoURL: found?.photoURL || ''
      };
    });
    
    try {
      const chatRef = await addDoc(collection(db, 'chats'), {
        name: newGroupName,
        type: 'group',
        participants: allParticipants,
        participantsDetails,
        groupCode: code,
        createdBy: user.uid,
        lastMessage: `${user.displayName} created group "${newGroupName}"`,
        lastMessageAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });

      setNewGroupName('');
      setSelectedGroupMemberUids([]);
      setGroupMemberSearch('');
      setIsCreatingGroup(false);
      setShowGroupModal(false);
      setActiveChat({ 
        id: chatRef.id, 
        name: newGroupName, 
        type: 'group', 
        participants: allParticipants, 
        participantsDetails,
        groupCode: code 
      });
      showNotification(`Group "${newGroupName}" created with ${allParticipants.length} members!`);
    } catch (error) {
      console.error('Failed to create group', error);
      handleFirestoreError(error, OperationType.CREATE, 'chats');
      showNotification('Failed to create group.');
    }
  };

  const handleJoinGroup = async () => {
    if (!groupCode.trim() || !user) return;

    try {
      // Must include type: 'group' to match security rules for non-participants
      const q = query(
        collection(db, 'chats'), 
        where('type', '==', 'group'),
        where('groupCode', '==', groupCode), 
        limit(1)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        showNotification('Invalid group code');
        return;
      }

      const chatDoc = snapshot.docs[0];
      const chatData = chatDoc.data() as Chat;

      if (chatData.participants.includes(user.uid)) {
        showNotification('You are already in this group');
        setActiveChat({ id: chatDoc.id, ...chatData });
        setShowGroupModal(false);
        return;
      }

      await updateDoc(doc(db, 'chats', chatDoc.id), {
        participants: [...chatData.participants, user.uid]
      });

      setActiveChat({ id: chatDoc.id, ...chatData, participants: [...chatData.participants, user.uid] });
      setShowGroupModal(false);
      setGroupCode('');
    } catch (error) {
      console.error('Failed to join group', error);
      handleFirestoreError(error, OperationType.UPDATE, 'chats');
      showNotification('Failed to join group. Please check your permissions or the group code.');
    }
  };

  const handleScanQR = async (scannedUid: string) => {
    if (!user) return;
    setShowScanner(false);

    // If scanned UID matches group code pattern
    try {
      const groupQ = query(collection(db, 'chats'), where('type', '==', 'group'), where('groupCode', '==', scannedUid));
      const groupSnap = await getDocs(groupQ);
      if (!groupSnap.empty) {
        const targetGroup = groupSnap.docs[0];
        const groupData = targetGroup.data() as Chat;
        if (!groupData.participants.includes(user.uid)) {
          const updated = [...groupData.participants, user.uid];
          await updateDoc(doc(db, 'chats', targetGroup.id), { participants: updated });
          showNotification(`Joined group "${groupData.name}"!`);
        }
        setActiveChat({ id: targetGroup.id, ...groupData, participants: Array.from(new Set([...groupData.participants, user.uid])) });
        return;
      }
    } catch (err) {
      console.warn('Group check skipped', err);
    }

    if (scannedUid === user.uid) {
      showNotification("You scanned your own QR code!");
      return;
    }

    try {
      // Check if DM already exists
      const q = query(
        collection(db, 'chats'),
        where('type', '==', 'dm'),
        where('participants', 'array-contains', user.uid)
      );
      const snapshot = await getDocs(q);
      let existingChat = snapshot.docs.find(doc => doc.data().participants.includes(scannedUid));

      if (existingChat) {
        const chatData = existingChat.data() as Chat;
        setActiveChat({ id: existingChat.id, ...chatData });
      } else {
        // Get scanned user's info
        const userDoc = await getDoc(doc(db, 'users', scannedUid));
        const scannedUser = userDoc.data();
        const scannedName = scannedUser?.displayName || `User_${scannedUid.slice(0, 5)}`;
        
        const participantsDetails = {
          [user.uid]: { displayName: user.displayName, photoURL: user.photoURL || '' },
          [scannedUid]: { displayName: scannedName, photoURL: scannedUser?.photoURL || '' }
        };

        const chatRef = await addDoc(collection(db, 'chats'), {
          type: 'dm',
          name: `${user.displayName} & ${scannedName}`,
          participants: [user.uid, scannedUid],
          participantsDetails,
          requestStatus: 'pending',
          requestSenderId: user.uid,
          requestReceiverId: scannedUid,
          lastMessage: '👋 Chat request sent via QR',
          lastMessageAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        });

        setUsersCache(prev => ({
          ...prev,
          [scannedUid]: { displayName: scannedName, photoURL: scannedUser?.photoURL }
        }));

        setActiveChat({ 
          id: chatRef.id, 
          type: 'dm', 
          name: `${user.displayName} & ${scannedName}`, 
          participants: [user.uid, scannedUid],
          participantsDetails,
          requestStatus: 'pending',
          requestSenderId: user.uid,
          requestReceiverId: scannedUid,
          lastMessage: '👋 Chat request sent via QR'
        });
        showNotification(`Chat request sent to ${scannedName}!`);
      }
    } catch (error) {
      console.error('Failed to start DM', error);
      showNotification('Could not connect with user.');
    }
  };

  const startVoiceCall = async () => {
    if (!activeChat || !user) return;
    const isGroup = activeChat.type === 'group';
    const otherUid = activeChat.participants.find(p => p !== user.uid);

    if (!isGroup && otherUid) {
      if (activeChat.requestStatus === 'pending') {
        showNotification('Voice call will be available once the chat request is accepted.');
        return;
      }
      const isBlockedByMe = user.blockedUsers?.includes(otherUid) || false;
      if (isBlockedByMe) {
        showNotification('Cannot call a blocked contact. Please unblock first.');
        return;
      }
      if (isBlockedByOther) {
        showNotification('Cannot place call. User is currently unavailable.');
        return;
      }
    }

    try {
      let userStream: MediaStream;
      try {
        if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
          showNotification('Microphone is not supported in this browser.');
          return;
        }
        userStream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false 
        });
      } catch (mediaErr) {
        console.warn('Microphone permission denied or unavailable', mediaErr);
        showNotification('Could not access microphone. Please grant permissions.');
        return;
      }

      setStream(userStream);
      setIsMuted(false);

      if (isGroup) {
        const callRef = await addDoc(collection(db, 'calls'), {
          chatId: activeChat.id,
          chatName: activeChat.name,
          callerId: user.uid,
          callerName: user.displayName,
          callerPhoto: user.photoURL || null,
          isGroup: true,
          callType: 'audio',
          participants: [user.uid],
          status: 'active',
          createdAt: serverTimestamp(),
        });

        setActiveCall({ 
          id: callRef.id, 
          chatId: activeChat.id,
          chatName: activeChat.name,
          isGroup: true,
          callType: 'audio',
          isCaller: true,
          participants: [user.uid]
        });

        await addDoc(collection(db, 'chats', activeChat.id, 'messages'), {
          chatId: activeChat.id,
          senderId: user.uid,
          senderName: user.displayName,
          text: `📞 Started a group voice call`,
          type: 'call',
          createdAt: serverTimestamp(),
        });
      } else {
        const receiverId = activeChat.participants.find(p => p !== user.uid);
        if (!receiverId) return;

        const callRef = await addDoc(collection(db, 'calls'), {
          chatId: activeChat.id,
          chatName: activeChat.name,
          callerId: user.uid,
          callerName: user.displayName,
          callerPhoto: user.photoURL || null,
          receiverId: receiverId,
          participants: [user.uid, receiverId],
          isGroup: false,
          callType: 'audio',
          status: 'ringing',
          createdAt: serverTimestamp(),
        });

        setActiveCall({ 
          id: callRef.id, 
          receiverId, 
          chatName: activeChat.name,
          isGroup: false,
          callType: 'audio',
          isCaller: true,
          participants: [user.uid, receiverId]
        });

        if (callStatusUnsubRef.current) {
          callStatusUnsubRef.current();
        }

        callStatusUnsubRef.current = onSnapshot(doc(db, 'calls', callRef.id), (docSnapshot) => {
          const data = docSnapshot.data();
          if (data?.status === 'ended') {
            endCall();
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `calls/${callRef.id}`);
        });
      }

      showNotification(`${isGroup ? 'Group' : 'Direct'} voice call started!`);
    } catch (err) {
      console.error('Failed to start voice call', err);
      handleFirestoreError(err, OperationType.CREATE, 'calls');
      showNotification('Failed to initiate voice call.');
    }
  };

  const joinGroupCall = async (groupCall: any) => {
    if (!user) return;
    try {
      let userStream: MediaStream;
      try {
        if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
          showNotification('Microphone not supported.');
          return;
        }
        userStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false
        });
      } catch (mediaErr) {
        console.warn('Microphone permission denied', mediaErr);
        showNotification('Could not access microphone.');
        return;
      }

      setStream(userStream);
      setIsMuted(false);

      const updated = Array.from(new Set([...(groupCall.participants || []), user.uid]));
      await updateDoc(doc(db, 'calls', groupCall.id), { participants: updated });

      setActiveCall({
        ...groupCall,
        participants: updated,
        isCaller: false
      });
      setActiveGroupCall(null);
      showNotification('Joined group voice call!');
    } catch (err) {
      console.error('Failed to join group call', err);
      showNotification('Could not join group voice call.');
    }
  };

  const toggleMute = () => {
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
      showNotification(!isMuted ? 'Microphone muted' : 'Microphone unmuted');
    }
  };

  const handleClearChat = async () => {
    if (!activeChat || !user) return;
    showNotification('Messages view cleared.');
    setMessages([]);
  };

  const handleCopyGroupInvite = () => {
    if (!activeChat) return;
    const inviteLink = activeChat.groupCode 
      ? `${window.location.origin}/?join=${activeChat.groupCode}` 
      : window.location.href;
    navigator.clipboard.writeText(inviteLink).then(() => {
      showNotification('Group invite link copied to clipboard!');
    }).catch(() => {
      showNotification(`Group Code: ${activeChat.groupCode}`);
    });
  };

  const handleLeaveGroup = async () => {
    if (!activeChat || !user || activeChat.type !== 'group') return;
    try {
      const updated = activeChat.participants.filter(p => p !== user.uid);
      await updateDoc(doc(db, 'chats', activeChat.id), { participants: updated });
      setActiveChat(null);
      setShowGroupInfo(false);
      showNotification(`Left group "${activeChat.name}"`);
    } catch (err) {
      console.error('Failed to leave group', err);
      showNotification('Failed to leave group.');
    }
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    try {
      let userStream: MediaStream;
      try {
        if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
          showNotification('Microphone is not supported in this environment.');
          return;
        }
        userStream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false 
        });
      } catch (mediaErr) {
        console.warn('Microphone permission denied or unavailable', mediaErr);
        showNotification('Could not access microphone. Please grant permissions.');
        return;
      }
      setStream(userStream);
      setIsMuted(false);
      await updateDoc(doc(db, 'calls', incomingCall.id), { status: 'active' });
      setActiveCall({ ...incomingCall, isCaller: false });
      setIncomingCall(null);
    } catch (err) {
      console.error('Failed to accept call', err);
      handleFirestoreError(err, OperationType.UPDATE, `calls/${incomingCall.id}`);
    }
  };

  const endCall = async () => {
    const callId = activeCall?.id || incomingCall?.id;
    if (callStatusUnsubRef.current) {
      callStatusUnsubRef.current();
      callStatusUnsubRef.current = null;
    }
    if (callId) {
      try {
        if (activeCall?.isGroup && user) {
          const remaining = (activeCall.participants || []).filter((p: string) => p !== user.uid);
          if (remaining.length === 0) {
            await updateDoc(doc(db, 'calls', callId), { status: 'ended', participants: [] });
          } else {
            await updateDoc(doc(db, 'calls', callId), { participants: remaining });
          }
        } else {
          await updateDoc(doc(db, 'calls', callId), { status: 'ended' });
        }
      } catch (err) {
        console.error('Failed to end call', err);
        handleFirestoreError(err, OperationType.UPDATE, `calls/${callId}`);
      }
    }
    if (peerRef.current) {
      try {
        if (!peerRef.current.destroyed) {
          peerRef.current.destroy();
        }
      } catch (e) {
        console.warn('Error destroying peer:', e);
      }
      peerRef.current = null;
    }
    if (stream) {
      try {
        stream.getTracks().forEach(track => track.stop());
      } catch (e) {
        console.warn('Error stopping stream tracks:', e);
      }
    }
    setStream(null);
    setActiveCall(null);
    setIncomingCall(null);
    showNotification('Voice call ended');
  };

  // Active voice call duration timer
  useEffect(() => {
    if (!activeCall) {
      setActiveCallSeconds(0);
      return;
    }
    const timer = setInterval(() => {
      setActiveCallSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [activeCall]);

  // WebRTC Peer connection with STUN configuration and direct Audio Output
  useEffect(() => {
    if (!activeCall || !stream) return;

    const callDoc = doc(db, 'calls', activeCall.id);
    let peer: any = null;

    try {
      peer = new Peer({ 
        initiator: activeCall.isCaller, 
        trickle: false, 
        stream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
          ]
        }
      });
      peerRef.current = peer;

      peer.on('error', (err: any) => {
        console.warn('WebRTC peer error:', err);
      });

      peer.on('signal', async (data: any) => {
        try {
          const signalKey = activeCall.isCaller ? 'callerSignal' : 'receiverSignal';
          await updateDoc(callDoc, { [signalKey]: JSON.stringify(data) });
        } catch (e) {
          console.warn('Failed to send peer signal', e);
        }
      });

      peer.on('stream', (remoteStream: MediaStream) => {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
          remoteAudioRef.current.play().catch(err => {
            console.warn('Auto-play audio blocked:', err);
          });
        }
      });
    } catch (e) {
      console.error('Failed to instantiate Peer:', e);
      return;
    }

    const appliedSignals = new Set<string>();

    const unsubscribe = onSnapshot(callDoc, (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data();

      // If other party ended call
      if (data?.status === 'ended') {
        endCall();
        return;
      }

      const signalToReceive = activeCall.isCaller ? data?.receiverSignal : data?.callerSignal;
      if (signalToReceive && peer && !peer.destroyed && !appliedSignals.has(signalToReceive)) {
        appliedSignals.add(signalToReceive);
        try {
          peer.signal(JSON.parse(signalToReceive));
        } catch (e) {
          console.warn('Failed to parse or apply peer signal', e);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `calls/${activeCall.id}`);
    });

    return () => {
      unsubscribe();
      if (peer && !peer.destroyed) {
        try {
          peer.destroy();
        } catch (e) {
          console.warn('Peer destroy error during cleanup:', e);
        }
      }
      peerRef.current = null;
    };
  }, [activeCall?.id, stream]);

  if (authLoading) {
    return (
      <div className="h-full h-[100dvh] w-full overflow-hidden bg-[#111b21] flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col items-center text-center"
        >
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-full bg-[#00a884]/20 animate-ping absolute inset-0"></div>
            <div className="w-20 h-20 rounded-2xl bg-[#00a884] flex items-center justify-center shadow-lg shadow-[#00a884]/30 relative z-10">
              <MessageCircle className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-[#e9edef] tracking-tight mb-2">Chat 120</h1>
          <div className="flex items-center gap-2 text-[#8696a0] text-sm">
            <div className="w-2 h-2 rounded-full bg-[#00a884] animate-pulse"></div>
            <span>Connecting securely...</span>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <NameEntryScreen onJoin={(newUser) => setUser(newUser)} />;
  }

  return (
    <div className="flex h-screen h-[100dvh] w-full max-w-full bg-[#111b21] overflow-hidden">
      {/* Sidebar */}
      <div className={cn(
        "w-full md:w-[400px] border-r border-[#3b4a54] flex flex-col transition-all h-full max-w-full",
        activeChat ? "hidden md:flex" : "flex"
      )}>
        {/* Chat 120 Brand Header */}
        <div className="bg-[#111b21] px-4 py-2.5 flex items-center border-b border-[#2e3b43]/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#00a884] via-[#05cd99] to-[#25d366] flex items-center justify-center text-white shadow-md shadow-[#00a884]/25 shrink-0">
              <MessageCircle className="w-4 h-4 fill-current" />
            </div>
            <span className="text-white font-extrabold text-base tracking-tight select-none">Chat 120</span>
          </div>
        </div>

        {/* Header */}
        <div className="bg-[#202c33] px-4 py-3 flex justify-between items-center border-b border-[#2e3b43]/40">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-3 hover:bg-[#2a3942] p-1.5 rounded-xl transition-colors text-left group"
            title="Edit profile & copy ID"
          >
            <div className="relative">
              <img 
                src={getAvatarUrl(user.uid, user.photoURL)} 
                className="w-10 h-10 rounded-full border-2 border-[#00a884] object-cover group-hover:ring-2 group-hover:ring-[#00a884]/50 transition" 
                alt="Profile" 
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#202c33]"></span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[#e9edef] font-semibold text-sm truncate max-w-[170px] leading-tight group-hover:text-[#00a884] transition">{user.displayName}</span>
              <span className="text-[11px] text-[#00a884] font-medium mt-0.5 flex items-center gap-1">
                <span>Online</span>
              </span>
            </div>
          </motion.button>

          <div className="flex items-center gap-1 text-[#8696a0]">
            <motion.button 
              whileHover={{ scale: 1.1, color: "#00a884" }}
              whileTap={{ scale: 0.92 }}
              onClick={() => { loadActiveUsers(); setShowFindPeopleModal(true); }} 
              title="Find People by Name or ID" 
              className="p-2 hover:bg-[#2a3942] rounded-full transition-colors text-[#8696a0]"
            >
              <UserPlus className="w-5 h-5" />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.1, color: "#e9edef" }}
              whileTap={{ scale: 0.92 }}
              onClick={() => { loadActiveUsers(); setIsCreatingGroup(true); setShowGroupModal(true); }} 
              title="Create New Group" 
              className="p-2 hover:bg-[#2a3942] rounded-full transition-colors text-[#8696a0]"
            >
              <Plus className="w-5 h-5" />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.1, color: "#e9edef" }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setShowScanner(true)} 
              title="Scan QR Code" 
              className="p-2 hover:bg-[#2a3942] rounded-full transition-colors text-[#8696a0]"
            >
              <Scan className="w-5 h-5" />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.1, color: "#ef4444" }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setShowDeleteAccountConfirm(true)} 
              title="End Session & Delete Account" 
              className="p-2 hover:bg-[#2a3942] rounded-full transition-colors text-[#8696a0]"
            >
              <LogOut className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {isOffline && (
          <div className="bg-amber-600/90 text-white text-xs px-4 py-2 flex items-center justify-between shadow-sm animate-pulse">
            <span>Offline mode &mdash; checking connection...</span>
          </div>
        )}

        {/* Search & Filter bar */}
        <div className="p-2.5 bg-[#111b21] space-y-2">
          <div className="bg-[#202c33] flex items-center gap-3 px-3.5 py-1.5 rounded-xl border border-transparent focus-within:border-[#00a884]/60 transition-all">
            <Search className="w-4 h-4 text-[#8696a0] shrink-0" />
            <input 
              type="text" 
              placeholder="Search people by name or chat" 
              className="bg-transparent border-none outline-none text-[#e9edef] text-sm w-full py-1 placeholder:text-[#8696a0]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => setSearchQuery('')}
                className="text-[#8696a0] hover:text-[#e9edef] p-0.5 rounded-full transition"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Tabs (All / Direct / Groups / Requests) */}
          {(() => {
            const incomingRequestsCount = chats.filter(c => c.type === 'dm' && c.requestStatus === 'pending' && c.requestReceiverId === user.uid).length;
            return (
              <>
                <div className="flex items-center gap-1.5 px-0.5 overflow-x-auto no-scrollbar">
                  {(['all', 'direct', 'group', 'requests'] as const).map(tab => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setChatFilter(tab)}
                      className={cn(
                        "px-3 py-1 text-xs font-medium rounded-full transition-all capitalize select-none shrink-0 flex items-center gap-1",
                        chatFilter === tab 
                          ? "bg-[#00a884] text-white shadow-sm font-semibold" 
                          : "bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942]"
                      )}
                    >
                      <span>{tab === 'all' ? 'All' : tab === 'direct' ? 'Direct' : tab === 'group' ? 'Groups' : 'Requests'}</span>
                      {tab === 'requests' && incomingRequestsCount > 0 && (
                        <span className={cn(
                          "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
                          chatFilter === 'requests' ? "bg-white text-[#00a884]" : "bg-emerald-500 text-white animate-pulse"
                        )}>
                          {incomingRequestsCount}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {incomingRequestsCount > 0 && chatFilter !== 'requests' && (
                  <div 
                    onClick={() => setChatFilter('requests')}
                    className="mt-2 p-2 bg-emerald-950/40 hover:bg-emerald-950/60 border border-emerald-500/40 rounded-xl flex items-center justify-between text-xs text-emerald-300 cursor-pointer transition shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />
                      <span>{incomingRequestsCount} pending chat request{incomingRequestsCount > 1 ? 's' : ''}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-400 underline">View</span>
                  </div>
                )}

                {chats.length === 0 && !searchQuery && (
                  <div 
                    onClick={handleOpenSelfChat}
                    className="mt-2 p-2.5 bg-gradient-to-r from-[#00a884]/20 via-[#05cd99]/15 to-[#202c33] hover:from-[#00a884]/25 border border-[#00a884]/40 rounded-xl flex items-center justify-between text-xs text-white cursor-pointer transition shadow-sm"
                    title="Tap to open your personal chat box to test sending messages, code & voice notes"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-[#00a884] flex items-center justify-center text-white shrink-0 shadow-sm">
                        <MessageCircle className="w-4 h-4 fill-current" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white text-[12px] truncate">Open Chat Box & Notes</p>
                        <p className="text-[10px] text-[#8696a0] truncate">Tap to test messages, code & media</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-400 shrink-0 ml-2">Open →</span>
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {/* Search Results: People Found on Chat 120 */}
        {searchQuery.trim() && (
          <div className="bg-[#182229] border-b border-[#2e3b43] p-2.5">
            <div className="flex items-center justify-between mb-1.5 px-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#00a884] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>People on Chat 120 ({searchedUsers.length})</span>
              </span>
              {isSearchingUsers && (
                <span className="w-3 h-3 border border-[#00a884] border-t-transparent rounded-full animate-spin"></span>
              )}
            </div>

            {searchedUsers.length > 0 ? (
              <div className="space-y-1 max-h-48 overflow-y-auto pr-0.5 custom-scrollbar">
                {searchedUsers.map((su) => {
                  const existingChat = chats.find(c => c.type === 'dm' && c.participants.includes(su.uid));
                  const isPending = existingChat?.requestStatus === 'pending';
                  const isSender = isPending && existingChat?.requestSenderId === user.uid;
                  const isReceiver = isPending && existingChat?.requestReceiverId === user.uid;
                  const isAccepted = existingChat && (!existingChat.requestStatus || existingChat.requestStatus === 'accepted');

                  const now = Date.now();
                  const timeLeft = su.expiresAt ? Math.max(0, Math.floor((su.expiresAt - now) / 60000)) : 120;
                  return (
                    <div key={su.uid} className="flex items-center justify-between p-2 rounded-xl bg-[#202c33] hover:bg-[#2a3942] transition">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img 
                          src={getAvatarUrl(su.uid, su.photoURL)} 
                          className="w-8 h-8 rounded-full object-cover shrink-0" 
                          alt={su.displayName} 
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = getAvatarUrl(su.uid); }} 
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#e9edef] truncate">{su.displayName}</p>
                          <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            <span>{timeLeft}m left</span>
                          </p>
                        </div>
                      </div>
                      {isAccepted ? (
                        <button
                          onClick={() => handleStartDirectChat(su)}
                          className="px-2.5 py-1 bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-semibold rounded-lg transition shrink-0 flex items-center gap-1 shadow-sm"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>Open</span>
                        </button>
                      ) : isSender ? (
                        <button
                          onClick={() => handleStartDirectChat(su)}
                          className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold rounded-lg transition shrink-0 flex items-center gap-1"
                        >
                          <Clock className="w-3 h-3 animate-pulse" />
                          <span>Requested</span>
                        </button>
                      ) : isReceiver ? (
                        <button
                          onClick={() => handleStartDirectChat(su)}
                          className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold rounded-lg transition shrink-0 flex items-center gap-1 shadow-sm"
                        >
                          <Check className="w-3 h-3" />
                          <span>Respond</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStartDirectChat(su)}
                          className="px-2.5 py-1 bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-semibold rounded-lg transition shrink-0 flex items-center gap-1 shadow-sm"
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>Request</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : !isSearchingUsers ? (
              <div className="p-2 text-center text-[#8696a0] text-xs">
                No active users found matching "{searchQuery}".
              </div>
            ) : null}
          </div>
        )}

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
          {chatsLoading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-[#202c33]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-[#202c33] rounded w-2/3" />
                    <div className="h-3 bg-[#202c33] rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (() => {
            const filteredChats = chats.filter(c => {
              if (chatFilter === 'requests') {
                return c.type === 'dm' && c.requestStatus === 'pending' && c.requestReceiverId === user.uid;
              }
              if (chatFilter === 'direct' && c.type !== 'dm') return false;
              if (chatFilter === 'group' && c.type !== 'group') return false;
              const otherUid = c.participants.find(p => p !== user.uid);
              const dName = getChatDisplayName(c, user.uid, otherUid ? usersCache[otherUid]?.displayName : undefined);
              return dName.toLowerCase().includes(searchQuery.toLowerCase());
            });

            if (filteredChats.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center select-none">
                  <div className="w-16 h-16 rounded-2xl bg-[#202c33] flex items-center justify-center text-[#00a884] mb-3 shadow-md">
                    <MessageCircle className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-semibold text-[#e9edef] mb-1">
                    {searchQuery 
                      ? 'No matching chats' 
                      : chatFilter === 'requests'
                      ? 'No pending chat requests'
                      : chatFilter !== 'all' 
                      ? `No ${chatFilter} chats yet` 
                      : 'No conversations yet'}
                  </h4>
                  <p className="text-xs text-[#8696a0] max-w-xs mb-4">
                    {searchQuery 
                      ? 'Try searching a different name or start a new chat.' 
                      : chatFilter === 'requests'
                      ? 'When other users search for your name and request to chat, they will appear here for you to accept or decline.'
                      : 'Scan a friend\'s QR code or start a new group to begin messaging.'}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      onClick={handleOpenSelfChat}
                      className="px-3.5 py-1.5 bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-semibold rounded-xl transition shadow flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5 fill-current" />
                      <span>Open Chat Box</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { loadActiveUsers(); setShowFindPeopleModal(true); }}
                      className="px-3.5 py-1.5 bg-[#202c33] hover:bg-[#2a3942] text-[#e9edef] text-xs font-medium rounded-xl transition border border-[#3b4a54] flex items-center gap-1.5 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-[#00a884]" />
                      <span>Find People</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { loadActiveUsers(); setIsCreatingGroup(true); setShowGroupModal(true); }}
                      className="px-3.5 py-1.5 bg-[#202c33] hover:bg-[#2a3942] text-[#e9edef] text-xs font-medium rounded-xl transition border border-[#3b4a54] flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Group</span>
                    </button>
                  </div>
                </div>
              );
            }

            return filteredChats.map(chat => {
              const otherUid = chat.participants.find(p => p !== user.uid);
              return (
                <ChatItem 
                  key={chat.id} 
                  chat={chat} 
                  active={activeChat?.id === chat.id} 
                  onClick={() => setActiveChat(chat)}
                  currentUserId={user.uid}
                  cachedName={otherUid ? usersCache[otherUid]?.displayName : undefined}
                  cachedPhoto={otherUid ? usersCache[otherUid]?.photoURL : undefined}
                  onAcceptRequest={(cId) => handleAcceptChatRequest(cId)}
                  onDeclineRequest={(cId) => handleDeclineChatRequest(cId)}
                />
              );
            });
          })()}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={cn(
        "flex-1 w-full min-w-0 max-w-full flex flex-col bg-[#0b141a] relative overflow-hidden h-full",
        !activeChat ? "hidden md:flex items-center justify-center" : "flex"
      )}>
        {activeChat ? (
          <>
            {/* Active Group Call Banner */}
            {activeGroupCall && (
              <div className="bg-[#00a884] text-white px-4 py-2.5 flex items-center justify-between text-sm shadow-md animate-pulse z-20">
                <div className="flex items-center gap-2 font-medium">
                  <Phone className="w-4 h-4" />
                  <span>Group voice call in progress ({activeGroupCall.participants?.length || 1} connected)</span>
                </div>
                <button 
                  onClick={() => joinGroupCall(activeGroupCall)}
                  className="bg-[#111b21] hover:bg-black text-white px-4 py-1 rounded-full text-xs font-bold transition shadow"
                >
                  Join Voice Call
                </button>
              </div>
            )}

            {/* Selection Mode Header or Standard Chat Header */}
            {isSelectMode ? (
              <div className="bg-[#202c33] p-3 flex items-center justify-between shadow-md z-10 border-b border-[#00a884]/30">
                <div className="flex items-center gap-3 text-[#e9edef]">
                  <button 
                    onClick={() => { setIsSelectMode(false); setSelectedMessageIds([]); }} 
                    className="p-1.5 hover:bg-[#3b4a54]/50 rounded-full text-[#8696a0] hover:text-white transition"
                    title="Cancel selection"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <span className="font-semibold text-sm">{selectedMessageIds.length} selected</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedMessageIds.length === visibleMessages.length) {
                        setSelectedMessageIds([]);
                      } else {
                        setSelectedMessageIds(visibleMessages.map(m => m.id));
                      }
                    }}
                    className="text-xs text-[#00a884] hover:underline font-medium px-2 py-1"
                  >
                    {selectedMessageIds.length === visibleMessages.length ? 'Deselect all' : 'Select all'}
                  </button>
                  <button
                    type="button"
                    disabled={selectedMessageIds.length === 0}
                    onClick={() => setShowBatchDeleteModal(true)}
                    className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 disabled:opacity-40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-red-500/30"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete ({selectedMessageIds.length})</span>
                  </button>
                </div>
              </div>
            ) : (() => {
              const otherUid = activeChat.type === 'dm' ? activeChat.participants.find(p => p !== user.uid) : undefined;
              const isBlockedByMe = otherUid ? (user.blockedUsers?.includes(otherUid) || false) : false;
              const isChatPending = activeChat.type === 'dm' && activeChat.requestStatus === 'pending';
              const isRequestReceiver = isChatPending && activeChat.requestReceiverId === user.uid;
              const isRequestSender = isChatPending && activeChat.requestSenderId === user.uid;

              const headerDisplayName = getChatDisplayName(activeChat, user.uid, otherUid ? usersCache[otherUid]?.displayName : undefined);
              const headerAvatarUrl = getChatAvatar(activeChat, user.uid, otherUid ? usersCache[otherUid]?.photoURL : undefined);

              return (
                <div className="bg-[#202c33] p-2.5 sm:p-3 flex items-center justify-between shadow-md z-20 sticky top-0 w-full min-w-0 max-w-full shrink-0 border-b border-[#2e3b43]/40">
                  <div 
                    onClick={() => {
                      if (activeChat.type === 'dm' && otherUid) {
                        setContactProfileModalUser({ 
                          uid: otherUid, 
                          displayName: headerDisplayName, 
                          photoURL: headerAvatarUrl 
                        });
                      } else {
                        setShowGroupInfo(true);
                      }
                    }}
                    className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:opacity-90 transition group min-w-0 flex-1 mr-2"
                    title={activeChat.type === 'dm' ? "Click to view profile & options" : "Click to view group info"}
                  >
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveChat(null); }} 
                      className="md:hidden p-1.5 -ml-1 text-[#8696a0] hover:text-[#e9edef] rounded-full min-w-[36px] min-h-[36px] flex items-center justify-center shrink-0 transition"
                      title="Back to chats"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="relative shrink-0">
                      <img 
                        src={headerAvatarUrl} 
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover bg-[#3b4a54] border border-white/10 group-hover:ring-2 group-hover:ring-[#00a884] transition" 
                        alt={headerDisplayName}
                        onError={(e) => {
                          if (activeChat.type === 'group') {
                            (e.currentTarget as HTMLImageElement).src = createGroupSvgDataUri(activeChat.id, activeChat.name);
                          } else {
                            (e.currentTarget as HTMLImageElement).src = getAvatarUrl(otherUid || user.uid);
                          }
                        }}
                      />
                      {isBlockedByMe && (
                        <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-0.5" title="You blocked this contact">
                          <Ban className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h3 className="text-[#e9edef] font-medium leading-tight group-hover:text-[#00a884] transition truncate text-sm sm:text-base">{headerDisplayName}</h3>
                        {isBlockedByMe && <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.2 rounded font-medium shrink-0">Blocked</span>}
                        {isRequestReceiver && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-medium shrink-0">Incoming Request</span>}
                        {isRequestSender && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.2 rounded font-medium shrink-0">Request Pending</span>}
                      </div>
                      <p className="text-[#8696a0] text-[11px] sm:text-xs truncate flex items-center gap-1">
                        <span className="text-[#00a884] text-[10px]">🔒</span>
                        <span>
                          {activeChat.type === 'group' 
                            ? `${activeChat.participants.length} members • E2EE` 
                            : isBlockedByMe 
                            ? 'Blocked contact • Tap to unblock' 
                            : isRequestReceiver 
                            ? 'Pending request • Tap to accept' 
                            : isRequestSender 
                            ? 'Request sent • Waiting for approval' 
                            : 'online • encrypted'}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 text-[#8696a0] shrink-0">
                    {/* Voice-only calling button */}
                    <button 
                      onClick={startVoiceCall} 
                      title={isBlockedByMe ? "Cannot call a blocked contact" : isChatPending ? "Voice calls available once request is accepted" : "Start voice call"} 
                      disabled={isBlockedByMe || isChatPending}
                      className={cn(
                        "p-2 sm:p-2.5 rounded-full min-w-[36px] min-h-[36px] flex items-center justify-center transition",
                        (isBlockedByMe || isChatPending) ? "opacity-30 cursor-not-allowed" : "hover:text-[#00a884] hover:bg-[#3b4a54]/50 text-[#8696a0]"
                      )}
                    >
                      <Phone className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setShowQR(activeChat.groupCode || activeChat.id)} 
                      title="Chat QR" 
                      className="hover:text-[#e9edef] p-2 sm:p-2.5 hover:bg-[#3b4a54]/50 rounded-full min-w-[36px] min-h-[36px] flex items-center justify-center transition"
                    >
                      <QrCode className="w-5 h-5" />
                    </button>
                    
                    {/* Three Dots Menu */}
                    <div className="relative">
                      <button 
                        onClick={() => setShowChatMenu(!showChatMenu)} 
                        title="More options" 
                        className="p-2 sm:p-2.5 hover:bg-[#3b4a54]/50 rounded-full hover:text-[#e9edef] min-w-[36px] min-h-[36px] flex items-center justify-center transition"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>

                      {showChatMenu && (
                        <div className="absolute right-0 top-10 w-52 bg-[#202c33] rounded-xl shadow-2xl border border-[#3b4a54] py-1.5 z-50 text-sm">
                          <button 
                            onClick={() => { 
                              if (activeChat.type === 'dm' && otherUid) {
                                setContactProfileModalUser({ 
                                  uid: otherUid, 
                                  displayName: headerDisplayName, 
                                  photoURL: headerAvatarUrl 
                                });
                              } else {
                                setShowGroupInfo(true); 
                              }
                              setShowChatMenu(false); 
                            }}
                            className="w-full px-4 py-2.5 text-left text-[#e9edef] hover:bg-[#111b21] flex items-center gap-2.5 transition"
                          >
                            <Info className="w-4 h-4 text-[#00a884]" />
                            <span>{activeChat.type === 'group' ? 'Group info' : 'Contact profile'}</span>
                          </button>

                          <button 
                            onClick={() => { setIsSelectMode(true); setShowChatMenu(false); }}
                            className="w-full px-4 py-2.5 text-left text-[#e9edef] hover:bg-[#111b21] flex items-center gap-2.5 transition"
                          >
                            <CheckSquare className="w-4 h-4 text-[#00a884]" />
                            <span>Select messages...</span>
                          </button>

                          {activeChat.type === 'group' && (
                            <button 
                              onClick={() => { handleCopyGroupInvite(); setShowChatMenu(false); }}
                              className="w-full px-4 py-2.5 text-left text-[#e9edef] hover:bg-[#111b21] flex items-center gap-2.5 transition"
                            >
                              <Share2 className="w-4 h-4 text-[#00a884]" />
                              <span>Copy invite link</span>
                            </button>
                          )}

                          <button 
                            onClick={() => { setShowQR(activeChat.groupCode || activeChat.id); setShowChatMenu(false); }}
                            className="w-full px-4 py-2.5 text-left text-[#e9edef] hover:bg-[#111b21] flex items-center gap-2.5 transition"
                          >
                            <QrCode className="w-4 h-4 text-[#00a884]" />
                            <span>Show QR Code</span>
                          </button>

                          <button 
                            onClick={() => { setShowClearChatModal(true); setShowChatMenu(false); }}
                            className="w-full px-4 py-2.5 text-left text-[#e9edef] hover:bg-[#111b21] flex items-center gap-2.5 transition"
                          >
                            <Trash2 className="w-4 h-4 text-[#8696a0]" />
                            <span>Clear chat...</span>
                          </button>

                          {activeChat.type === 'dm' && otherUid && (
                            <button 
                              onClick={() => { handleToggleBlock(otherUid); setShowChatMenu(false); }}
                              className="w-full px-4 py-2.5 text-left text-red-400 hover:bg-red-500/10 flex items-center gap-2.5 transition border-t border-[#3b4a54]/50"
                            >
                              <Ban className="w-4 h-4 text-red-400" />
                              <span>{isBlockedByMe ? 'Unblock contact' : 'Block contact'}</span>
                            </button>
                          )}

                          {activeChat.type === 'group' && (
                            <button 
                              onClick={() => { handleLeaveGroup(); setShowChatMenu(false); }}
                              className="w-full px-4 py-2.5 text-left text-red-400 hover:bg-red-500/10 flex items-center gap-2.5 transition border-t border-[#3b4a54]/50"
                            >
                              <LogOut className="w-4 h-4 text-red-400" />
                              <span>Exit group</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Messages Area - WhatsApp style fluid scrolling */}
            <div 
              ref={chatContainerRef}
              onScroll={handleChatScroll}
              className="flex-1 w-full min-w-0 min-h-0 max-w-full overflow-y-auto overflow-x-hidden p-2.5 sm:p-4 chat-wallpaper custom-scrollbar relative"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <div className="flex flex-col min-h-full w-full min-w-0 max-w-full justify-end">
                {/* 1-Hour Disappearing Message Notice */}
                <div className="flex justify-center mb-3">
                  <div className="bg-[#182229]/90 border border-[#00a884]/30 rounded-xl px-3.5 py-1.5 text-center text-xs text-[#8696a0] max-w-md shadow-sm backdrop-blur-sm select-none">
                    <span className="text-[#00a884] font-semibold">⏱️ Disappearing Messages:</span> Chats & code automatically delete after 1 hour.
                  </div>
                </div>

                {visibleMessages.length === 0 && (() => {
                  const otherUid = activeChat.type === 'dm' ? activeChat.participants.find(p => p !== user.uid) : undefined;
                  const isChatPending = activeChat.type === 'dm' && activeChat.requestStatus === 'pending';
                  const isRequestReceiver = isChatPending && activeChat.requestReceiverId === user.uid;
                  const isRequestSender = isChatPending && activeChat.requestSenderId === user.uid;
                  const headerDisplayName = getChatDisplayName(activeChat, user.uid, otherUid ? usersCache[otherUid]?.displayName : undefined);
                  const headerAvatarUrl = getChatAvatar(activeChat, user.uid, otherUid ? usersCache[otherUid]?.photoURL : undefined);

                  if (isRequestReceiver) {
                    return (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center my-auto py-8 text-center select-none max-w-sm mx-auto px-4"
                      >
                        <div className="relative mb-3">
                          <img 
                            src={headerAvatarUrl} 
                            className="w-20 h-20 rounded-full object-cover border-2 border-emerald-500 shadow-xl" 
                            alt={headerDisplayName} 
                          />
                          <span className="absolute bottom-0 right-0 p-1.5 bg-emerald-500 text-white rounded-full shadow-md">
                            <Sparkles className="w-4 h-4" />
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-[#e9edef] mb-1">{headerDisplayName} wants to chat!</h3>
                        <p className="text-xs text-[#8696a0] leading-relaxed mb-5">
                          Accept this chat request to exchange end-to-end encrypted messages, voice notes, code snippets, and voice calls.
                        </p>
                        <div className="flex items-center gap-2.5 w-full justify-center">
                          <button
                            type="button"
                            onClick={() => handleAcceptChatRequest(activeChat.id)}
                            className="flex-1 py-2.5 px-4 bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-md"
                          >
                            <Check className="w-4 h-4" />
                            <span>Accept Request</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeclineChatRequest(activeChat.id)}
                            className="py-2.5 px-4 bg-[#202c33] hover:bg-red-500/20 text-[#8696a0] hover:text-red-400 text-xs font-semibold rounded-xl border border-[#3b4a54] transition flex items-center justify-center gap-1.5"
                          >
                            <X className="w-4 h-4" />
                            <span>Decline</span>
                          </button>
                        </div>
                      </motion.div>
                    );
                  }

                  if (isRequestSender) {
                    return (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center my-auto py-8 text-center select-none max-w-sm mx-auto px-4"
                      >
                        <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mb-3 shadow-inner">
                          <Clock className="w-8 h-8 animate-pulse" />
                        </div>
                        <h3 className="text-lg font-bold text-[#e9edef] mb-1">Chat Request Sent</h3>
                        <p className="text-xs text-[#8696a0] leading-relaxed mb-5">
                          Waiting for <span className="text-[#e9edef] font-semibold">{headerDisplayName}</span> to accept your chat request. Once accepted, you can chat freely.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleCancelChatRequest(activeChat.id)}
                          className="px-4 py-2 bg-[#202c33] hover:bg-red-500/20 text-[#8696a0] hover:text-red-400 text-xs font-semibold rounded-xl border border-[#3b4a54] transition shadow-sm"
                        >
                          Cancel Request
                        </button>
                      </motion.div>
                    );
                  }

                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center justify-center my-auto py-12 text-center select-none"
                    >
                      <div className="w-16 h-16 rounded-3xl bg-[#202c33]/80 border border-[#3b4a54]/50 text-[#00a884] flex items-center justify-center mb-3 shadow-inner">
                        <MessageCircle className="w-8 h-8" />
                      </div>
                      <p className="text-[#e9edef] font-semibold text-sm mb-1">No messages here yet</p>
                      <p className="text-[#8696a0] text-xs max-w-xs leading-relaxed">
                        Say hello, share a voice note, or drop code snippets. All messages disappear automatically in 1 hour.
                      </p>
                    </motion.div>
                  );
                })()}

                {visibleMessages.map((msg, idx) => {
                  const prevMsg = idx > 0 ? visibleMessages[idx - 1] : null;
                  const currentDatePill = formatDatePill(msg.createdAt);
                  const prevDatePill = prevMsg ? formatDatePill(prevMsg.createdAt) : null;
                  const showDateHeader = idx === 0 || currentDatePill !== prevDatePill;

                  return (
                    <React.Fragment key={msg.id}>
                      {showDateHeader && (
                        <div className="flex justify-center my-2.5 sticky top-1 z-10 pointer-events-none">
                          <span className="bg-[#182229]/95 text-[#8696a0] text-[11px] font-semibold px-3 py-1 rounded-lg shadow-sm border border-[#222e35]/80 backdrop-blur-md pointer-events-auto select-none uppercase tracking-wider">
                            {currentDatePill}
                          </span>
                        </div>
                      )}
                      <MessageBubble 
                        message={msg} 
                        isOwn={msg.senderId === user.uid} 
                        onImageClick={(url) => setLightboxImage(url)}
                        onOpenFullscreenCode={(codeData) => setFullscreenCodeData(codeData)}
                        onReact={(msgId, emoji) => handleToggleReaction(msgId, emoji)}
                        onTogglePin={(msgId, currentPin) => handleTogglePin(msgId, currentPin)}
                        onDeleteMessage={(msg) => setDeleteConfirmMessage(msg)}
                        currentUserId={user.uid}
                        isSelectMode={isSelectMode}
                        isSelected={selectedMessageIds.includes(msg.id)}
                        onToggleSelect={(msgId) => {
                          setSelectedMessageIds(prev => 
                            prev.includes(msgId) ? prev.filter(id => id !== msgId) : [...prev, msgId]
                          );
                        }}
                      />
                    </React.Fragment>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Floating WhatsApp-Style Scroll To Bottom Button */}
              <AnimatePresence>
                {showScrollToBottom && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 10 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => scrollToBottom(true)}
                    className="fixed sm:absolute bottom-20 right-4 sm:right-6 z-30 w-10 h-10 rounded-full bg-[#202c33]/95 hover:bg-[#2a3942] active:scale-95 text-[#8696a0] hover:text-[#00a884] border border-[#3b4a54] shadow-2xl flex items-center justify-center transition-all cursor-pointer group backdrop-blur-sm"
                    title="Scroll to latest messages"
                  >
                    <ChevronDown className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
                    {unreadWhileScrolled > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-[#00a884] text-[#111b21] font-bold text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-lg border border-[#202c33] animate-pulse">
                        {unreadWhileScrolled}
                      </span>
                    )}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Input Area (or Request Actions or Blocked Banner) */}
            {(() => {
              const otherUid = activeChat.type === 'dm' ? activeChat.participants.find(p => p !== user.uid) : undefined;
              const isBlockedByMe = otherUid ? (user.blockedUsers?.includes(otherUid) || false) : false;
              const isChatPending = activeChat.type === 'dm' && activeChat.requestStatus === 'pending';
              const isRequestReceiver = isChatPending && activeChat.requestReceiverId === user.uid;
              const isRequestSender = isChatPending && activeChat.requestSenderId === user.uid;
              const headerDisplayName = getChatDisplayName(activeChat, user.uid, otherUid ? usersCache[otherUid]?.displayName : undefined);

              if (isBlockedByMe && otherUid) {
                return (
                  <div className="bg-[#202c33] p-3 sm:p-4 flex items-center justify-between border-t border-red-500/30 gap-2 shrink-0 sticky bottom-0 z-30 pb-[max(0.75rem,env(safe-area-inset-bottom))] w-full min-w-0">
                    <div className="flex items-center gap-2 text-red-400 text-xs sm:text-sm min-w-0">
                      <Ban className="w-5 h-5 shrink-0" />
                      <span className="truncate sm:whitespace-normal">You have blocked this contact. Unblock to send messages or make calls.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleBlock(otherUid)}
                      className="px-3.5 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-semibold rounded-xl border border-red-500/30 text-xs transition shrink-0"
                    >
                      Unblock
                    </button>
                  </div>
                );
              }

              if (isRequestReceiver && otherUid) {
                return (
                  <div className="bg-[#202c33] p-3 sm:p-4 flex items-center justify-between border-t border-emerald-500/30 gap-3 shrink-0 sticky bottom-0 z-30 pb-[max(0.75rem,env(safe-area-inset-bottom))] w-full min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span className="text-xs sm:text-sm text-[#e9edef] truncate">
                        <strong className="text-white">{headerDisplayName}</strong> sent you a chat request
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleAcceptChatRequest(activeChat.id)}
                        className="px-3.5 py-1.5 bg-[#00a884] hover:bg-[#008f6f] text-white font-semibold rounded-xl text-xs transition shadow-sm flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeclineChatRequest(activeChat.id)}
                        className="px-3.5 py-1.5 bg-[#111b21] hover:bg-red-500/20 text-[#8696a0] hover:text-red-400 font-semibold rounded-xl text-xs border border-[#3b4a54] transition"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                );
              }

              if (isRequestSender && otherUid) {
                return (
                  <div className="bg-[#202c33] p-3 sm:p-4 flex items-center justify-between border-t border-amber-500/30 gap-3 shrink-0 sticky bottom-0 z-30 pb-[max(0.75rem,env(safe-area-inset-bottom))] w-full min-w-0">
                    <div className="flex items-center gap-2 text-amber-300 text-xs sm:text-sm min-w-0">
                      <Clock className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
                      <span className="truncate">Waiting for {headerDisplayName} to accept your request before messaging...</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCancelChatRequest(activeChat.id)}
                      className="px-3 py-1.5 bg-[#111b21] hover:bg-red-500/20 text-[#8696a0] hover:text-red-400 font-semibold rounded-xl text-xs border border-[#3b4a54] transition shrink-0"
                    >
                      Cancel
                    </button>
                  </div>
                );
              }

              if (isRecordingVoiceNote) {
                return (
                  <div className="bg-[#202c33] p-2.5 flex items-center border-t border-[#2e3b43]/50 shrink-0 sticky bottom-0 z-30 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
                    <VoiceNoteRecorder 
                      onSend={handleSendVoiceNote}
                      onCancel={() => setIsRecordingVoiceNote(false)}
                      showNotification={showNotification}
                    />
                  </div>
                );
              }

              return (
                <div className="bg-[#202c33] p-2.5 sm:p-3 flex flex-col gap-2 relative border-t border-[#2e3b43]/50 shrink-0 sticky bottom-0 z-30 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
                  {/* Quick Emoji Tray */}
                  <AnimatePresence>
                    {showEmojiTray && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="bg-[#182229]/95 backdrop-blur-md border border-[#3b4a54] rounded-2xl p-2 flex items-center gap-1.5 overflow-x-auto custom-scrollbar shadow-xl select-none"
                      >
                        {['😀', '😂', '🔥', '❤️', '👍', '🎉', '✨', '🚀', '👋', '💯', '🙌', '😍', '💡', '😎', '👏', '🙏'].map(emoji => (
                          <motion.button
                            key={emoji}
                            whileHover={{ scale: 1.25 }}
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={() => {
                              setNewMessage(prev => prev + emoji);
                            }}
                            className="p-1.5 text-lg hover:bg-[#202c33] rounded-lg transition"
                          >
                            {emoji}
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-center gap-2">
                    {/* Emoji toggle button */}
                    <motion.button
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      type="button"
                      onClick={() => setShowEmojiTray(!showEmojiTray)}
                      className={cn(
                        "p-2 rounded-full transition-colors",
                        showEmojiTray ? "text-[#00a884] bg-[#2a3942]" : "text-[#8696a0] hover:text-[#e9edef]"
                      )}
                      title="Quick emojis"
                    >
                      <Smile className="w-5 h-5" />
                    </motion.button>

                    {/* Attachment options dropdown */}
                    <div className="relative">
                      <motion.button 
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        type="button"
                        onClick={() => setShowAttachMenu(!showAttachMenu)}
                        className={cn(
                          "p-2 rounded-full transition-colors",
                          showAttachMenu ? "bg-[#3b4a54] text-[#00a884]" : "text-[#8696a0] hover:text-[#e9edef]"
                        )}
                        title="Attach media or document"
                        disabled={isUploading}
                      >
                        <Paperclip className="w-5 h-5" />
                      </motion.button>

                      <AnimatePresence>
                        {showAttachMenu && (
                          <motion.div 
                            initial={{ opacity: 0, y: 15, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 15, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute bottom-14 left-0 bg-[#202c33] rounded-2xl shadow-2xl border border-[#3b4a54] p-2 flex flex-col gap-1 z-50 w-56 text-sm backdrop-blur-md"
                          >
                            <label className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#111b21] cursor-pointer text-[#e9edef] transition">
                              <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">
                                <ImageIcon className="w-4 h-4" />
                              </div>
                              <span className="font-medium">Photos & Videos</span>
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*,video/*" 
                                onChange={(e) => handleFileUpload(e, 'media')}
                                disabled={isUploading}
                              />
                            </label>

                            <label className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#111b21] cursor-pointer text-[#e9edef] transition">
                              <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                                <FileText className="w-4 h-4" />
                              </div>
                              <span className="font-medium">Document / File</span>
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="*/*" 
                                onChange={(e) => handleFileUpload(e, 'doc')}
                                disabled={isUploading}
                              />
                            </label>

                            <label className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#111b21] cursor-pointer text-[#e9edef] transition">
                              <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
                                <Camera className="w-4 h-4" />
                              </div>
                              <span className="font-medium">Camera</span>
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*" 
                                capture="environment" 
                                onChange={(e) => handleFileUpload(e, 'camera')}
                                disabled={isUploading}
                              />
                            </label>

                            <button
                              type="button"
                              onClick={() => {
                                setShowAttachMenu(false);
                                setShowCodeModal(true);
                              }}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#111b21] cursor-pointer text-[#e9edef] transition text-left"
                            >
                              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                <Code className="w-4 h-4" />
                              </div>
                              <span className="font-medium">Code Snippet (10k+ lines)</span>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Quick Code Share Button */}
                    <motion.button
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      type="button"
                      onClick={() => setShowCodeModal(true)}
                      className="p-2 text-[#8696a0] hover:text-[#00a884] rounded-full transition-colors hidden sm:flex"
                      title="Share code snippet (10,000+ lines)"
                    >
                      <Code className="w-5 h-5" />
                    </motion.button>

                    <form onSubmit={handleSendMessage} className="flex-1 flex items-center gap-2">
                      <div className="flex-1 bg-[#2a3942] rounded-xl px-4 py-2 border border-transparent focus-within:border-[#00a884]/60 transition-all flex items-center">
                        <input 
                          type="text" 
                          placeholder={isUploading ? "Uploading file..." : "Type a message"} 
                          className="w-full bg-transparent border-none outline-none text-[#e9edef] text-sm placeholder:text-[#8696a0]"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          disabled={isUploading}
                        />
                      </div>

                      <AnimatePresence mode="wait">
                        {newMessage.trim() ? (
                          <motion.button 
                            key="send-btn"
                            initial={{ scale: 0.7, rotate: -20 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0.7, rotate: 20 }}
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.92 }}
                            type="submit" 
                            className="p-2.5 bg-[#00a884] hover:bg-[#008f6f] text-white rounded-full shadow-md shadow-[#00a884]/25 transition flex items-center justify-center shrink-0"
                            disabled={isUploading}
                            title="Send message"
                          >
                            <Send className="w-5 h-5" />
                          </motion.button>
                        ) : (
                          <motion.button
                            key="mic-btn"
                            initial={{ scale: 0.7 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.7 }}
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.92 }}
                            type="button"
                            onClick={() => setIsRecordingVoiceNote(true)}
                            className="p-2.5 bg-[#00a884] hover:bg-[#008f6f] text-white rounded-full shadow-md shadow-[#00a884]/25 transition flex items-center justify-center shrink-0"
                            title="Record voice note"
                          >
                            <Mic className="w-5 h-5" />
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </form>
                  </div>
                </div>
              );
            })()}
          </>
        ) : (
          <div className="text-center p-6 max-w-lg mx-auto flex flex-col items-center justify-center select-none my-auto">
            <motion.div 
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="relative mb-4"
            >
              <div className="w-20 h-20 rounded-3xl bg-[#00a884]/20 animate-pulse absolute inset-0 blur-xl"></div>
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#00a884] to-[#008f6f] flex items-center justify-center shadow-2xl shadow-[#00a884]/30 relative z-10 border border-emerald-400/30">
                <MessageCircle className="w-10 h-10 text-white" />
              </div>
            </motion.div>

            <h2 className="text-xl sm:text-2xl font-bold text-[#e9edef] tracking-tight mb-1.5">
              Chat 120 Secure Messaging
            </h2>
            <p className="text-[#8696a0] text-xs sm:text-sm leading-relaxed mb-5 max-w-md">
              Encrypted messaging with peer-to-peer WebRTC voice calling, automatic 120-minute self-destructing messages, 100MB file uploads, and full developer code sharing.
            </p>

            {/* Feature Highlight Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full mb-5">
              <div className="bg-[#202c33]/70 border border-[#3b4a54]/40 rounded-2xl p-3 text-left transition hover:border-[#00a884]/50">
                <div className="w-7 h-7 rounded-xl bg-[#00a884]/15 text-[#00a884] flex items-center justify-center mb-1.5 font-bold text-xs">
                  ⏱️
                </div>
                <h4 className="text-xs font-semibold text-[#e9edef] mb-0.5">120-Min Destruct</h4>
                <p className="text-[10px] text-[#8696a0] leading-snug">All messages auto-delete after 120 minutes.</p>
              </div>

              <div className="bg-[#202c33]/70 border border-[#3b4a54]/40 rounded-2xl p-3 text-left transition hover:border-[#00a884]/50">
                <div className="w-7 h-7 rounded-xl bg-[#00a884]/15 text-[#00a884] flex items-center justify-center mb-1.5 font-bold text-xs">
                  📞
                </div>
                <h4 className="text-xs font-semibold text-[#e9edef] mb-0.5">Voice Calling</h4>
                <p className="text-[10px] text-[#8696a0] leading-snug">High-fidelity encrypted WebRTC audio calls.</p>
              </div>

              <div className="bg-[#202c33]/70 border border-[#3b4a54]/40 rounded-2xl p-3 text-left transition hover:border-[#00a884]/50">
                <div className="w-7 h-7 rounded-xl bg-[#00a884]/15 text-[#00a884] flex items-center justify-center mb-1.5 font-bold text-xs">
                  💻
                </div>
                <h4 className="text-xs font-semibold text-[#e9edef] mb-0.5">Code Snippets</h4>
                <p className="text-[10px] text-[#8696a0] leading-snug">Share 10,000+ lines with syntax themes.</p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleOpenSelfChat}
                className="px-4 py-2.5 bg-[#00a884] hover:bg-[#008f6f] text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-xl shadow-[#00a884]/30 flex items-center gap-2 cursor-pointer"
                title="Open your personal chat box to test sending messages, code & audio"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>Open Chat Box (Notes to Self & Testing)</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { loadActiveUsers(); setShowFindPeopleModal(true); }}
                className="px-4 py-2.5 bg-[#202c33] hover:bg-[#2a3942] text-[#e9edef] font-medium text-xs sm:text-sm rounded-xl transition border border-[#3b4a54] flex items-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-[#00a884]" />
                <span>Find People</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowScanner(true)}
                className="px-4 py-2.5 bg-[#202c33] hover:bg-[#2a3942] text-[#e9edef] font-medium text-xs sm:text-sm rounded-xl transition border border-[#3b4a54] flex items-center gap-2 cursor-pointer"
              >
                <Scan className="w-4 h-4 text-[#8696a0]" />
                <span>Scan QR</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { loadActiveUsers(); setIsCreatingGroup(true); setShowGroupModal(true); }}
                className="px-4 py-2.5 bg-[#202c33] hover:bg-[#2a3942] text-[#e9edef] font-medium text-xs sm:text-sm rounded-xl transition border border-[#3b4a54] flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#8696a0]" />
                <span>Create Group</span>
              </motion.button>
            </div>

            <div className="mt-5 flex items-center gap-1.5 text-[11px] text-[#8696a0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00a884]"></span>
              <span>🔒 End-to-end encrypted & ephemeral</span>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showProfileModal && (
          <ProfileModal 
            user={user} 
            onClose={() => setShowProfileModal(false)} 
            onUpdate={(data) => setUser(prev => prev ? { ...prev, ...data } : null)} 
            showNotification={showNotification}
            onToggleBlock={handleToggleBlock}
            usersCache={usersCache}
            remainingSeconds={sessionRemainingSeconds}
            onDeleteSession={handleDeleteSession}
            onClearData={handleClearAllData}
            onDeleteAccount={handleDeleteAccount}
            onUpdateExpiry={handleUpdateExpiry}
          />
        )}
      </AnimatePresence>

      {/* Direct Delete Account Confirmation Modal for header logout */}
      <AnimatePresence>
        {showDeleteAccountConfirm && (
          <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.92, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.92, opacity: 0 }} 
              className="bg-[#202c33] p-6 rounded-2xl w-full max-w-sm border border-red-500/40 text-center shadow-2xl space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#e9edef]">Delete Account &amp; Exit?</h3>
              <p className="text-xs text-[#8696a0] leading-relaxed">
                Your short user ID <strong className="text-white font-mono">{user.uid}</strong> and profile will be permanently deleted from the database.
              </p>
              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition shadow"
                >
                  Yes, Delete My Account
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteAccountConfirm(false)}
                  className="w-full py-2 bg-[#2a3942] hover:bg-[#3b4a54] text-[#e9edef] text-xs font-medium rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFindPeopleModal && (
          <FindPeopleModal 
            user={user}
            chats={chats}
            onClose={() => setShowFindPeopleModal(false)}
            onStartChat={handleStartDirectChat}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGroupInfo && activeChat && (
          <GroupInfoModal 
            chat={activeChat} 
            user={user} 
            onClose={() => setShowGroupInfo(false)} 
            onLeave={handleLeaveGroup} 
            onCopyInvite={handleCopyGroupInvite} 
            showNotification={showNotification} 
            onAddMember={handleAddMemberToGroup}
            activeUsers={activeUsersList}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showScanner && (
          <QRScannerModal 
            onClose={() => setShowScanner(false)} 
            onScan={handleScanQR} 
            showNotification={showNotification}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGroupModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#202c33] p-6 rounded-2xl w-full max-w-md border border-[#3b4a54] max-h-[90vh] flex flex-col shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-bold text-[#e9edef]">{isCreatingGroup ? 'Create New Group' : 'Join Group by Code'}</h2>
                  <p className="text-xs text-[#8696a0]">{isCreatingGroup ? 'Add anyone on Chat 120 by their name' : 'Enter a 6-digit group invite code'}</p>
                </div>
                <button onClick={() => { setShowGroupModal(false); setSelectedGroupMemberUids([]); setGroupMemberSearch(''); }} className="text-[#8696a0] hover:text-[#e9edef] p-1"><X className="w-5 h-5" /></button>
              </div>

              {isCreatingGroup ? (
                <div className="space-y-4 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                  <div>
                    <label className="text-xs font-semibold text-[#00a884] block mb-1.5 uppercase tracking-wider">Group Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Project Wave, Gaming Squad..." 
                      className="w-full bg-[#2a3942] border border-[#3b4a54] outline-none text-[#e9edef] rounded-xl px-4 py-2.5 text-sm focus:border-[#00a884] transition" 
                      value={newGroupName} 
                      onChange={(e) => setNewGroupName(e.target.value)} 
                      autoFocus
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-semibold text-[#8696a0] uppercase tracking-wider">
                        Add Members by Name ({selectedGroupMemberUids.length} selected)
                      </label>
                    </div>

                    <div className="relative mb-2">
                      <Search className="w-3.5 h-3.5 text-[#8696a0] absolute left-3 top-2.5" />
                      <input 
                        type="text" 
                        placeholder="Search people to add..." 
                        value={groupMemberSearch}
                        onChange={(e) => setGroupMemberSearch(e.target.value)}
                        className="w-full bg-[#111b21] border border-[#3b4a54] text-xs text-[#e9edef] rounded-lg pl-8 pr-3 py-1.5 outline-none focus:border-[#00a884]"
                      />
                    </div>

                    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 custom-scrollbar">
                      {activeUsersList
                        .filter(cand => cand.uid !== user.uid && (!cand.expiresAt || Date.now() <= cand.expiresAt))
                        .filter(cand => !groupMemberSearch.trim() || (cand.displayName || '').toLowerCase().includes(groupMemberSearch.toLowerCase().trim()))
                        .length === 0 ? (
                        <div className="text-center py-4 text-[#8696a0] text-xs">
                          {activeUsersList.filter(cand => cand.uid !== user.uid).length === 0 
                            ? 'No other users online right now. You can create the group now and share the group code!' 
                            : `No active user matches "${groupMemberSearch}"`}
                        </div>
                      ) : (
                        activeUsersList
                          .filter(cand => cand.uid !== user.uid && (!cand.expiresAt || Date.now() <= cand.expiresAt))
                          .filter(cand => !groupMemberSearch.trim() || (cand.displayName || '').toLowerCase().includes(groupMemberSearch.toLowerCase().trim()))
                          .map(cand => {
                            const isSelected = selectedGroupMemberUids.includes(cand.uid);
                            return (
                              <div 
                                key={cand.uid} 
                                onClick={() => {
                                  setSelectedGroupMemberUids(prev => 
                                    isSelected ? prev.filter(id => id !== cand.uid) : [...prev, cand.uid]
                                  );
                                }}
                                className={cn(
                                  "flex items-center justify-between p-2 rounded-xl cursor-pointer transition text-xs select-none",
                                  isSelected 
                                    ? "bg-[#00a884]/20 border border-[#00a884]/50" 
                                    : "bg-[#111b21] hover:bg-[#182229] border border-[#2e3b43]"
                                )}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <img 
                                    src={getAvatarUrl(cand.uid, cand.photoURL)} 
                                    className="w-7 h-7 rounded-full object-cover shrink-0" 
                                    alt={cand.displayName} 
                                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = getAvatarUrl(cand.uid); }} 
                                  />
                                  <span className="text-[#e9edef] font-medium truncate">{cand.displayName}</span>
                                </div>
                                <div className={cn(
                                  "w-4 h-4 rounded flex items-center justify-center border transition-all",
                                  isSelected ? "bg-[#00a884] border-[#00a884]" : "border-[#8696a0]"
                                )}>
                                  {isSelected && <Check className="w-3 h-3 text-white" />}
                                </div>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={handleCreateGroup} 
                    disabled={!newGroupName.trim()}
                    className="w-full bg-[#00a884] text-white font-bold py-3 rounded-xl hover:bg-[#008f6f] disabled:opacity-50 transition shadow-lg shadow-[#00a884]/20 text-sm flex items-center justify-center gap-2"
                  >
                    <span>Create Group ({selectedGroupMemberUids.length + 1} members)</span>
                  </button>

                  <button 
                    onClick={() => setIsCreatingGroup(false)} 
                    className="w-full text-[#00a884] text-xs font-medium hover:underline text-center"
                  >
                    Have a 6-digit code? Join an existing group instead
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <input 
                    type="text" 
                    placeholder="6-digit code" 
                    maxLength={6} 
                    className="w-full bg-[#2a3942] border border-[#3b4a54] outline-none text-[#e9edef] rounded-xl px-4 py-3 text-center text-2xl tracking-widest font-mono focus:border-[#00a884]" 
                    value={groupCode} 
                    onChange={(e) => setGroupCode(e.target.value)} 
                    autoFocus
                  />
                  <button 
                    onClick={handleJoinGroup} 
                    disabled={groupCode.trim().length !== 6}
                    className="w-full bg-[#00a884] text-white font-bold py-3 rounded-xl hover:bg-[#008f6f] disabled:opacity-50 transition shadow-lg shadow-[#00a884]/20 text-sm"
                  >
                    Join Group
                  </button>
                  <button 
                    onClick={() => { loadActiveUsers(); setIsCreatingGroup(true); }} 
                    className="w-full text-[#00a884] text-xs font-medium hover:underline text-center"
                  >
                    Create a new group instead
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showQR && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white p-8 rounded-3xl flex flex-col items-center">
              <h2 className="text-2xl font-bold text-[#111b21] mb-2">Group Invite</h2>
              <p className="text-gray-500 mb-6 font-mono text-lg">Code: {showQR}</p>
              <div className="p-4 bg-white rounded-xl border-4 border-[#00a884]"><QRCodeSVG value={showQR} size={200} /></div>
              <button onClick={() => setShowQR(null)} className="mt-8 bg-[#111b21] text-white px-8 py-2 rounded-full font-medium">Close</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lightbox Preview */}
      <AnimatePresence>
        {lightboxImage && (
          <div 
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-[200] backdrop-blur-md cursor-zoom-out"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
            >
              <button 
                onClick={() => setLightboxImage(null)} 
                className="absolute -top-12 right-0 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10"
              >
                <X className="w-7 h-7" />
              </button>
              <img 
                src={lightboxImage} 
                className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl" 
                alt="Enlarged preview" 
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Voice-Only Incoming Call Overlay */}
      <AnimatePresence>
        {incomingCall && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[100] backdrop-blur-xl">
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col items-center text-center max-w-sm w-full bg-[#1f2c34] p-8 rounded-3xl border border-[#3b4a54] shadow-2xl">
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-full bg-[#00a884]/20 animate-ping absolute inset-0"></div>
                <img 
                  src={getAvatarUrl(incomingCall.callerId, incomingCall.callerPhoto)} 
                  alt={incomingCall.callerName}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = getAvatarUrl(incomingCall.callerId); }}
                  className="w-24 h-24 rounded-full object-cover border-4 border-[#00a884] shadow-lg relative z-10"
                />
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">
                {incomingCall.callerName || 'Unknown Caller'}
              </h2>
              <div className="flex items-center gap-2 text-[#00a884] font-medium text-sm mb-8 animate-pulse">
                <Phone className="w-4 h-4" />
                <span>Incoming Voice Call...</span>
              </div>
              
              <div className="flex items-center justify-center gap-12 w-full">
                <div className="flex flex-col items-center gap-2">
                  <button 
                    onClick={endCall} 
                    className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition active:scale-95 shadow-lg shadow-red-500/30"
                    title="Decline call"
                  >
                    <Phone className="w-8 h-8 rotate-[135deg]" />
                  </button>
                  <span className="text-xs text-[#8696a0]">Decline</span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <button 
                    onClick={acceptCall} 
                    className="w-16 h-16 bg-[#00a884] hover:bg-[#008f6f] rounded-full flex items-center justify-center text-white transition active:scale-95 shadow-lg shadow-[#00a884]/30"
                    title="Accept voice call"
                  >
                    <Phone className="w-8 h-8 animate-bounce" />
                  </button>
                  <span className="text-xs text-[#8696a0]">Accept</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Voice-Only Active Call Screen */}
      <AnimatePresence>
        {activeCall && (
          <div className="fixed inset-0 bg-[#0b141a] z-[100] flex flex-col justify-between">
            {/* Hidden audio element receiving remote voice audio stream */}
            <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

            {/* Top Bar */}
            <div className="bg-[#1f2c34] p-4 flex items-center justify-between border-b border-[#3b4a54] shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                <div>
                  <h3 className="text-white font-medium text-base">
                    {activeCall.chatName || (activeCall.isGroup ? 'Group Voice Call' : 'Direct Voice Call')}
                  </h3>
                  <p className="text-xs text-[#00a884] font-medium flex items-center gap-1.5">
                    <Phone className="w-3 h-3" />
                    <span>Connected • {Math.floor(activeCallSeconds / 60)}:{String(activeCallSeconds % 60).padStart(2, '0')}</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={endCall} 
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-xl text-xs font-semibold transition"
              >
                End Call
              </button>
            </div>

            {/* Middle Voice Pulse Animation */}
            <div className="flex-1 relative flex flex-col items-center justify-center p-6 text-center">
              <div className="relative mb-8 flex items-center justify-center">
                <div className="w-44 h-44 rounded-full bg-[#00a884]/10 animate-ping absolute"></div>
                <div className="w-36 h-36 rounded-full bg-[#00a884]/20 animate-pulse absolute"></div>
                <div className="w-28 h-28 rounded-full bg-[#1f2c34] border-4 border-[#00a884] shadow-2xl flex items-center justify-center relative z-10">
                  <Phone className="w-12 h-12 text-[#00a884]" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-[#e9edef] mb-2">
                {activeCall.chatName || 'In Voice Call'}
              </h2>
              <p className="text-[#8696a0] text-sm max-w-xs mb-4">
                Voice audio is encrypted and connected via WebRTC.
              </p>

              {/* Soundwave bars animation */}
              <div className="flex items-center gap-1.5 h-12">
                {[12, 28, 16, 36, 20, 44, 28, 48, 22, 38, 18, 40, 24, 32, 14, 20].map((maxH, i) => (
                  <motion.div
                    key={i}
                    animate={isMuted ? { height: 4 } : { height: [6, maxH, 10, maxH * 0.8, 6] }}
                    transition={{ repeat: Infinity, duration: 0.65, delay: i * 0.05, ease: "easeInOut" }}
                    className={cn(
                      "w-1.5 rounded-full transition-all",
                      isMuted ? "bg-red-500/40" : "bg-[#00a884] shadow-sm shadow-[#00a884]/50"
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Bottom Controls Bar */}
            <div className="bg-[#1f2c34] p-6 flex justify-center items-center gap-8 border-t border-[#3b4a54]">
              <button 
                onClick={toggleMute}
                className={cn(
                  "w-14 h-14 rounded-full flex flex-col items-center justify-center transition-all shadow-lg active:scale-95",
                  isMuted ? "bg-red-500/20 text-red-400 border border-red-500/40" : "bg-[#2a3942] text-[#e9edef] hover:bg-[#3b4a54]"
                )}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>

              <button 
                onClick={endCall} 
                className="w-16 h-16 bg-red-600 hover:bg-red-700 active:scale-95 rounded-full flex items-center justify-center text-white transition-all shadow-xl shadow-red-600/30"
                title="End voice call"
              >
                <Phone className="w-8 h-8 rotate-[135deg]" />
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* User Blocking & Contact Profile Modal */}
      <AnimatePresence>
        {contactProfileModalUser && (
          <ContactProfileModal
            user={contactProfileModalUser}
            currentUserId={user.uid}
            isBlocked={user.blockedUsers?.includes(contactProfileModalUser.uid) || false}
            onToggleBlock={(uid) => handleToggleBlock(uid)}
            onStartCall={() => {
              setContactProfileModalUser(null);
              startVoiceCall();
            }}
            onClose={() => setContactProfileModalUser(null)}
          />
        )}
      </AnimatePresence>

      {/* Batch Message Deletion Modal */}
      <AnimatePresence>
        {showBatchDeleteModal && (
          <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.92, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.92, opacity: 0 }} 
              className="bg-[#202c33] p-6 rounded-2xl w-full max-w-sm border border-[#3b4a54] text-center shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#e9edef] mb-1">
                Delete {selectedMessageIds.length} message{selectedMessageIds.length > 1 ? 's' : ''}?
              </h3>
              <p className="text-xs text-[#8696a0] mb-5 leading-relaxed">
                Choose whether to delete these messages for everyone or delete them only from your chat history.
              </p>

              <div className="flex flex-col gap-2">
                <button
                  onClick={handleBatchDeleteForEveryone}
                  className="w-full py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-xl transition shadow"
                >
                  Delete for everyone
                </button>
                <button
                  onClick={handleBatchDeleteForMe}
                  className="w-full py-2.5 px-4 bg-[#2a3942] hover:bg-[#3b4a54] text-[#e9edef] text-xs font-semibold rounded-xl transition"
                >
                  Delete for me
                </button>
                <button
                  onClick={() => setShowBatchDeleteModal(false)}
                  className="w-full py-2 text-[#8696a0] hover:text-[#e9edef] text-xs font-medium transition"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WhatsApp-Style Delete Message Modal (Delete for everyone / Delete for me) */}
      <AnimatePresence>
        {deleteConfirmMessage && (
          <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.92, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.92, opacity: 0 }} 
              className="bg-[#202c33] p-6 rounded-2xl w-full max-w-sm border border-[#3b4a54] text-center shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#e9edef] mb-1">Delete message?</h3>
              <p className="text-xs text-[#8696a0] mb-5 leading-relaxed">
                {deleteConfirmMessage.senderId === user.uid 
                  ? "Choose whether to delete this message for everyone or delete it only from your chat view."
                  : "Remove this message from your chat history."}
              </p>

              <div className="flex flex-col gap-2">
                {deleteConfirmMessage.senderId === user.uid && (
                  <button
                    onClick={() => handleDeleteForEveryone(deleteConfirmMessage)}
                    className="w-full py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-xl transition shadow"
                  >
                    Delete for everyone
                  </button>
                )}
                <button
                  onClick={() => handleDeleteForMe(deleteConfirmMessage)}
                  className="w-full py-2.5 px-4 bg-[#2a3942] hover:bg-[#3b4a54] text-[#e9edef] text-xs font-semibold rounded-xl transition"
                >
                  Delete for me
                </button>
                <button
                  onClick={() => setDeleteConfirmMessage(null)}
                  className="w-full py-2 text-[#8696a0] hover:text-[#e9edef] text-xs font-medium transition"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Clear Chat Confirmation Modal */}
      <AnimatePresence>
        {showClearChatModal && activeChat && (
          <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.92, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.92, opacity: 0 }} 
              className="bg-[#202c33] p-6 rounded-2xl w-full max-w-sm border border-[#3b4a54] text-center shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-[#00a884]/20 text-[#00a884] flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#e9edef] mb-1">Clear messages?</h3>
              <p className="text-xs text-[#8696a0] mb-5 leading-relaxed">
                Clear all chat messages and code history.
              </p>

              <div className="flex flex-col gap-2">
                <button
                  onClick={handleClearChatForEveryone}
                  className="w-full py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-xl transition shadow"
                >
                  Clear for everyone
                </button>
                <button
                  onClick={handleClearChatForMe}
                  className="w-full py-2.5 px-4 bg-[#2a3942] hover:bg-[#3b4a54] text-[#e9edef] text-xs font-semibold rounded-xl transition"
                >
                  Clear for me
                </button>
                <button
                  onClick={() => setShowClearChatModal(false)}
                  className="w-full py-2 text-[#8696a0] hover:text-[#e9edef] text-xs font-medium transition"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* In-app Toast Banner */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -25, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-[250] bg-[#202c33]/95 backdrop-blur-md text-[#e9edef] px-5 py-2.5 rounded-2xl border border-[#00a884]/60 shadow-2xl flex items-center gap-3 text-xs sm:text-sm font-medium shadow-[#00a884]/10"
          >
            <span className="w-2 h-2 rounded-full bg-[#00a884] animate-ping shrink-0"></span>
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen IDE Code & HTML File Viewer (never overflows) */}
      <AnimatePresence>
        {fullscreenCodeData && (
          <FullscreenCodeModal 
            data={fullscreenCodeData} 
            onClose={() => setFullscreenCodeData(null)} 
          />
        )}
      </AnimatePresence>

      {/* Code Snippet Share Modal */}
      <AnimatePresence>
        {showCodeModal && (
          <CodeSnippetModal 
            isOpen={showCodeModal} 
            onClose={() => setShowCodeModal(false)} 
            onSend={(data) => handleSendCode(data)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
