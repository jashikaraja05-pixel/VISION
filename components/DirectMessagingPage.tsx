import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  MessageSquare, 
  Send, 
  User as UserIcon, 
  Search, 
  CheckCheck, 
  Volume2, 
  VolumeX, 
  Paperclip, 
  Scan, 
  Building2, 
  RefreshCw,
  Trash2,
  Copy,
  Pin,
  Star,
  Check,
  Sparkles,
  X,
  Mic,
  Play,
  Pause
} from 'lucide-react';
import { User, DirectMessage, InspectionRecord } from '../types';

interface DirectMessagingPageProps {
  currentUser: User | null;
  users: User[];
  inspections: InspectionRecord[];
  onSelectInspection?: (insp: InspectionRecord) => void;
  setActiveTab?: (tab: any) => void;
  initialRecipientId?: string | null;
}

// Voice Note Audio Player with dynamic waveform & scrubber
const VoiceMessagePlayer: React.FC<{
  audioUrl: string;
  duration?: number;
  isMine: boolean;
}> = ({ audioUrl, duration = 0, isMine }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const handleTimeUpdate = () => {
      setCurrentTime(Math.floor(audio.currentTime));
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      audio.pause();
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audioRef.current = null;
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn('Audio playback error:', err);
      });
    }
  };

  const formatSecs = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className={`flex items-center gap-3 p-2.5 rounded-xl ${isMine ? 'bg-indigo-700/60' : 'bg-slate-900/90'} border border-white/10 mt-1.5 min-w-[210px] max-w-xs`}>
      <button
        type="button"
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition shadow-md shrink-0 ${
          isMine 
            ? 'bg-white text-indigo-600 hover:bg-slate-100' 
            : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
        }`}
        title={isPlaying ? 'Pause Voice Note' : 'Play Voice Note'}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>

      <div className="flex-1 flex flex-col justify-center min-w-0">
        <div className="flex items-center gap-1 h-5 overflow-hidden">
          {[35, 65, 90, 50, 80, 40, 95, 70, 30, 85, 45, 75, 55, 90].map((h, i) => (
            <span
              key={i}
              className={`w-1 rounded-full transition-all duration-150 ${
                isPlaying 
                  ? (isMine ? 'bg-white' : 'bg-cyan-400') 
                  : (isMine ? 'bg-indigo-300/40' : 'bg-slate-600')
              }`}
              style={{
                height: isPlaying ? `${Math.max(20, (h * (Math.sin(currentTime * 3 + i) + 1.2)) / 2.2)}%` : `${h * 0.45}%`,
              }}
            />
          ))}
        </div>
        <div className="flex justify-between items-center text-[10px] text-slate-300 font-mono mt-1">
          <span>{isPlaying ? formatSecs(currentTime) : 'Voice note'}</span>
          <span>{duration ? formatSecs(duration) : '0:00'}</span>
        </div>
      </div>
    </div>
  );
};

export const DirectMessagingPage: React.FC<DirectMessagingPageProps> = ({
  currentUser,
  users,
  inspections,
  onSelectInspection,
  setActiveTab,
  initialRecipientId,
}) => {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<User | null>(null);
  const [messageText, setMessageText] = useState('');
  const [attachedInspection, setAttachedInspection] = useState<InspectionRecord | null>(null);
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [pinnedMsgIds, setPinnedMsgIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`pinned_msgs_${currentUser?.id || 'guest'}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [starredMsgIds, setStarredMsgIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`starred_msgs_${currentUser?.id || 'guest'}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<any>(null);

  // Format seconds helper
  const formatSecs = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Normalize company name for comparison
  const normalize = (str?: string) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const userCompanyClean = normalize(currentUser?.factoryName);

  // Multi-tenancy: Only list users belonging to the same company
  const companyUsers = users.filter(u => {
    if (u.id === currentUser?.id) return false;
    if (!userCompanyClean) return true;
    const targetCompClean = normalize(u.factoryName);
    return targetCompClean === userCompanyClean || 
           (userCompanyClean.length >= 3 && targetCompClean.includes(userCompanyClean)) ||
           (targetCompClean.length >= 3 && userCompanyClean.includes(targetCompClean));
  });

  // Filter contacts by search query
  const filteredContacts = companyUsers.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.employeeId && u.employeeId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Auto-select contact when initialRecipientId provided or on load
  useEffect(() => {
    if (initialRecipientId) {
      const match = companyUsers.find(u => u.id === initialRecipientId);
      if (match) {
        setSelectedRecipient(match);
        return;
      }
    }

    if (!selectedRecipient && filteredContacts.length > 0) {
      // Prefer opposite role (Admin <-> Inspector)
      const oppositeRoleUser = filteredContacts.find(u => u.role !== currentUser?.role);
      setSelectedRecipient(oppositeRoleUser || filteredContacts[0]);
    }
  }, [filteredContacts, selectedRecipient, currentUser?.role, initialRecipientId]);

  // Fetch messages from backend
  const fetchMessages = async () => {
    if (!currentUser) return;
    try {
      const url = currentUser.factoryName 
        ? `/api/messages?factoryName=${encodeURIComponent(currentUser.factoryName)}`
        : '/api/messages';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      }
    } catch (err) {
      console.warn('Error fetching messages:', err);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // 3s real-time poll
    return () => clearInterval(interval);
  }, [currentUser?.factoryName]);

  // Chronological ascending order: Oldest at TOP, newest at BOTTOM
  const conversationMessages = useMemo(() => {
    if (!selectedRecipient || !currentUser) return [];
    
    return messages
      .filter(m => {
        return (
          (m.senderId === currentUser.id && m.recipientId === selectedRecipient.id) ||
          (m.senderId === selectedRecipient.id && m.recipientId === currentUser.id)
        );
      })
      .sort((a, b) => {
        const getMsgTime = (m: DirectMessage): number => {
          if (m.createdAt) {
            const t = new Date(m.createdAt).getTime();
            if (!isNaN(t) && t > 0) return t;
          }
          const match = m.id.match(/^msg-(\d+)/);
          if (match) {
            return parseInt(match[1], 10);
          }
          return 0;
        };
        return getMsgTime(a) - getMsgTime(b);
      });
  }, [messages, selectedRecipient, currentUser]);

  const pinnedMessagesInConvo = useMemo(() => {
    return conversationMessages.filter(m => pinnedMsgIds.includes(m.id));
  }, [conversationMessages, pinnedMsgIds]);

  const starredCountInConvo = useMemo(() => {
    return conversationMessages.filter(m => starredMsgIds.includes(m.id)).length;
  }, [conversationMessages, starredMsgIds]);

  // Smoothly scroll to bottom when thread updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages.length, selectedRecipient]);

  // Mark unread messages as read
  useEffect(() => {
    if (!selectedRecipient || !currentUser) return;
    const unread = messages.filter(m => m.senderId === selectedRecipient.id && m.recipientId === currentUser.id && !m.read);
    unread.forEach(m => {
      fetch(`/api/messages/${m.id}/read`, { method: 'PUT' }).catch(() => {});
    });
  }, [selectedRecipient, messages, currentUser?.id]);

  // Start recording voice note
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Audio recording is not supported in this browser environment.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(150);
      setIsRecording(true);
      setRecordingDuration(0);

      recordTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.warn('Microphone error:', err);
      alert('Could not access microphone. Please allow microphone permissions in your browser to record voice messages.');
    }
  };

  // Cancel voice note recording
  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      try {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      } catch {}
    }
    clearInterval(recordTimerRef.current);
    setIsRecording(false);
    setRecordingDuration(0);
    audioChunksRef.current = [];
  };

  // Stop recording and send voice note
  const stopAndSendRecording = async () => {
    if (!mediaRecorderRef.current || !currentUser || !selectedRecipient) return;

    clearInterval(recordTimerRef.current);
    const duration = recordingDuration;

    mediaRecorderRef.current.onstop = async () => {
      try {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());

        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;

          const payload = {
            senderId: currentUser.id,
            senderName: currentUser.name,
            senderRole: currentUser.role,
            senderAvatar: currentUser.avatar,
            recipientId: selectedRecipient.id,
            recipientName: selectedRecipient.name,
            recipientRole: selectedRecipient.role,
            factoryName: currentUser.factoryName || selectedRecipient.factoryName || 'Plant',
            content: `🎤 Voice Note (${formatSecs(duration)})`,
            audioUrl: base64Audio,
            audioDuration: duration,
          };

          try {
            const res = await fetch('/api/messages', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            if (res.ok) {
              const data = await res.json();
              if (data.message) {
                setMessages(prev => [...prev, data.message]);
              }
            }
          } catch (err) {
            console.error('Failed to send voice message:', err);
          }
        };
        reader.readAsDataURL(audioBlob);
      } catch (err) {
        console.error('Error packaging voice message:', err);
      }
    };

    try {
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    } catch {}

    setIsRecording(false);
    setRecordingDuration(0);
  };

  // Send text message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageText.trim() && !attachedInspection) return;
    if (!currentUser || !selectedRecipient) return;

    setLoading(true);
    const payload = {
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      senderAvatar: currentUser.avatar,
      recipientId: selectedRecipient.id,
      recipientName: selectedRecipient.name,
      recipientRole: selectedRecipient.role,
      factoryName: currentUser.factoryName || selectedRecipient.factoryName || 'Plant',
      content: messageText.trim(),
      inspectionId: attachedInspection?.id,
      componentName: attachedInspection?.componentName,
      defectType: attachedInspection?.defects?.[0]?.type,
      imageUrl: attachedInspection?.imageOriginal,
    };

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          setMessages(prev => [...prev, data.message]);
        }
        setMessageText('');
        setAttachedInspection(null);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setLoading(false);
    }
  };

  // Copy message text to clipboard
  const handleCopyMessage = async (msgId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMsgId(msgId);
      setTimeout(() => setCopiedMsgId(null), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedMsgId(msgId);
      setTimeout(() => setCopiedMsgId(null), 2000);
    }
  };

  // Toggle Pin message
  const handleTogglePin = (msgId: string) => {
    setPinnedMsgIds(prev => {
      const updated = prev.includes(msgId) ? prev.filter(id => id !== msgId) : [...prev, msgId];
      try {
        localStorage.setItem(`pinned_msgs_${currentUser?.id || 'guest'}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Toggle Star message
  const handleToggleStar = (msgId: string) => {
    setStarredMsgIds(prev => {
      const updated = prev.includes(msgId) ? prev.filter(id => id !== msgId) : [...prev, msgId];
      try {
        localStorage.setItem(`starred_msgs_${currentUser?.id || 'guest'}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Delete message
  const handleDeleteMessage = async (msgId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    try {
      const res = await fetch(`/api/messages/${msgId}`, { method: 'DELETE' });
      if (res.ok) {
        setMessages(prev => prev.filter(m => m.id !== msgId));
      }
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  // Text-to-speech
  const handleSpeak = (msgId: string, text: string) => {
    if (!window.speechSynthesis) return;
    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);
    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // Quick message templates
  const quickTemplates = currentUser?.role === 'Admin'
    ? [
        '✅ Rework approved, proceed to line assembly.',
        '⚠️ Line halt requested: please re-verify solder pads on current unit.',
        '🔍 Please perform a high-resolution 4K macro scan.',
        '📦 Batch quality score verified, released for packaging.',
      ]
    : [
        '🔴 Critical fracture flagged on component pin. Requesting engineering review.',
        '🟢 Defect reworked and cleaned with IPA. Ready for secondary sign-off.',
        '❓ Please advise on solder tolerance parameters for this batch.',
        '✨ Line 1 scan completed without anomalies.',
      ];

  // Calculate unread per contact
  const getUnreadCount = (contactId: string) => {
    return messages.filter(m => m.senderId === contactId && m.recipientId === currentUser?.id && !m.read).length;
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4.5rem)] bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Banner */}
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/60 backdrop-blur flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              Direct Production & Quality Communications
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-medium">
                Real-Time
              </span>
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              Isolated Workspace: <span className="text-cyan-400 font-semibold">{currentUser?.factoryName || 'apex'}</span>
              <span className="text-slate-600">•</span>
              Role: <span className="text-indigo-400 font-semibold">{currentUser?.role}</span> ({currentUser?.name})
            </p>
          </div>
        </div>

        <button
          onClick={fetchMessages}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition border border-slate-700"
          title="Refresh Messages"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Main Chat Layout: Left Contact List, Right Active Conversation */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Contact List */}
        <div className="w-80 sm:w-88 border-r border-slate-800 bg-slate-900/40 flex flex-col">
          {/* Search Contacts */}
          <div className="p-3 border-b border-slate-800/80">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search team member..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>
          </div>

          {/* Contact List Scroll */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
            {filteredContacts.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                <UserIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No other colleagues registered in <span className="text-cyan-400 font-medium">{currentUser?.factoryName || 'this company'}</span>.</p>
                <p className="mt-1 text-[11px] text-slate-600">Colleagues must have the same company name to connect.</p>
              </div>
            ) : (
              filteredContacts.map(contact => {
                const isSelected = selectedRecipient?.id === contact.id;
                const unread = getUnreadCount(contact.id);
                return (
                  <button
                    key={contact.id}
                    onClick={() => setSelectedRecipient(contact)}
                    className={`w-full text-left p-3.5 flex items-center gap-3 transition-colors ${
                      isSelected 
                        ? 'bg-indigo-600/15 border-l-4 border-indigo-500' 
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      {contact.avatar ? (
                        <img 
                          src={contact.avatar} 
                          alt={contact.name} 
                          className="w-10 h-10 rounded-xl object-cover border border-slate-700 shadow-sm" 
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-sm">
                          {contact.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white truncate">
                          {contact.name}
                        </span>
                        {unread > 0 && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-cyan-500 text-slate-950">
                            {unread}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                          contact.role === 'Admin'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {contact.role}
                        </span>
                        <span className="text-[11px] text-slate-400 truncate">
                          {contact.employeeId || contact.email}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Active Chat Conversation */}
        {selectedRecipient ? (
          <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
            {/* Thread Header */}
            <div className="px-6 py-3.5 border-b border-slate-800/80 bg-slate-900/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {selectedRecipient.avatar ? (
                    <img 
                      src={selectedRecipient.avatar} 
                      alt={selectedRecipient.name} 
                      className="w-10 h-10 rounded-xl object-cover border border-slate-700" 
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold">
                      {selectedRecipient.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-white">{selectedRecipient.name}</h2>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      selectedRecipient.role === 'Admin' 
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {selectedRecipient.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {selectedRecipient.factoryName} • Active on factory floor
                  </p>
                </div>
              </div>

              {/* Thread Info / Indicators */}
              <div className="flex items-center gap-2">
                {pinnedMessagesInConvo.length > 0 && (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    <Pin className="w-3.5 h-3.5 text-amber-400 rotate-45" />
                    <span>{pinnedMessagesInConvo.length} Pinned</span>
                  </span>
                )}
                {starredCountInConvo > 0 && (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 bg-yellow-500/10 text-yellow-300 border border-yellow-500/30">
                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    <span>{starredCountInConvo} Starred</span>
                  </span>
                )}
              </div>
            </div>

            {/* Pinned Messages Bar */}
            {pinnedMessagesInConvo.length > 0 && (
              <div className="px-6 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-amber-300 overflow-hidden pr-2">
                  <Pin className="w-4 h-4 text-amber-400 rotate-45 flex-shrink-0" />
                  <span className="font-semibold whitespace-nowrap">Pinned Note:</span>
                  <span className="text-slate-200 truncate">
                    "{pinnedMessagesInConvo[pinnedMessagesInConvo.length - 1].content}"
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleTogglePin(pinnedMessagesInConvo[pinnedMessagesInConvo.length - 1].id)}
                    className="text-[11px] text-amber-400 hover:text-amber-200 underline cursor-pointer"
                  >
                    Unpin
                  </button>
                </div>
              </div>
            )}

            {/* Conversation Messages Thread */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {conversationMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 max-w-md mx-auto">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mb-3">
                    <MessageSquare className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-300">No messages yet with {selectedRecipient.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Send a direct note, link an active component scan, or select a quick factory action below to collaborate.
                  </p>
                </div>
              ) : (
                conversationMessages.map((msg) => {
                  const isMine = msg.senderId === currentUser?.id;
                  const isSpeaking = speakingMsgId === msg.id;
                  const isPinned = pinnedMsgIds.includes(msg.id);
                  const isStarred = starredMsgIds.includes(msg.id);
                  const isCopied = copiedMsgId === msg.id;

                  return (
                    <div 
                      key={msg.id} 
                      className={`flex gap-3 group ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      {/* Avatar */}
                      <div className="flex-shrink-0 mt-1">
                        {isMine ? (
                          currentUser?.avatar ? (
                            <img src={currentUser.avatar} alt="Me" className="w-8 h-8 rounded-lg object-cover border border-indigo-500/30" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                              {currentUser?.name.charAt(0).toUpperCase()}
                            </div>
                          )
                        ) : (
                          selectedRecipient.avatar ? (
                            <img src={selectedRecipient.avatar} alt={selectedRecipient.name} className="w-8 h-8 rounded-lg object-cover border border-slate-700" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 text-xs font-bold">
                              {selectedRecipient.name.charAt(0).toUpperCase()}
                            </div>
                          )
                        )}
                      </div>

                      {/* Message Body */}
                      <div className={`max-w-xl flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-slate-300">
                            {isMine ? 'You' : msg.senderName}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {msg.timestamp}
                          </span>

                          {/* Message Actions Toolbar: Copy, Pin, Star, Speak, Delete */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* Copy button */}
                            <button
                              onClick={() => handleCopyMessage(msg.id, msg.content)}
                              className="text-slate-400 hover:text-cyan-300 p-1 rounded hover:bg-slate-800 transition cursor-pointer"
                              title={isCopied ? 'Copied to clipboard!' : 'Copy text'}
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>

                            {/* Pin button */}
                            <button
                              onClick={() => handleTogglePin(msg.id)}
                              className={`p-1 rounded hover:bg-slate-800 transition cursor-pointer ${
                                isPinned ? 'text-amber-400' : 'text-slate-400 hover:text-amber-300'
                              }`}
                              title={isPinned ? 'Unpin message' : 'Pin message to top'}
                            >
                              <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-amber-400 rotate-45' : ''}`} />
                            </button>

                            {/* Star button */}
                            <button
                              onClick={() => handleToggleStar(msg.id)}
                              className={`p-1 rounded hover:bg-slate-800 transition cursor-pointer ${
                                isStarred ? 'text-yellow-400' : 'text-slate-400 hover:text-yellow-300'
                              }`}
                              title={isStarred ? 'Unstar message' : 'Star message'}
                            >
                              <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-yellow-400' : ''}`} />
                            </button>

                            {/* Speak Button */}
                            <button
                              onClick={() => handleSpeak(msg.id, msg.content)}
                              className="text-slate-400 hover:text-cyan-400 p-1 rounded hover:bg-slate-800 transition cursor-pointer"
                              title={isSpeaking ? 'Stop speech' : 'Read message out loud'}
                            >
                              {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> : <Volume2 className="w-3.5 h-3.5" />}
                            </button>

                            {/* Delete option for Inspector and Admin (own messages or Admin) */}
                            {(isMine || currentUser?.role === 'Admin') && (
                              <button
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="text-slate-400 hover:text-red-400 p-1 rounded hover:bg-slate-800 transition cursor-pointer"
                                title="Delete message"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Speech Bubble */}
                        <div className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-md ${
                          isMine 
                            ? 'bg-indigo-600 text-white rounded-tr-none' 
                            : 'bg-slate-800/90 text-slate-100 border border-slate-700/60 rounded-tl-none'
                        }`}>
                          {/* Pinned & Starred Badges */}
                          {(isPinned || isStarred) && (
                            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                              {isPinned && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-500/30 text-amber-200 border border-amber-400/40 px-2 py-0.5 rounded-full">
                                  <Pin className="w-2.5 h-2.5 rotate-45 text-amber-300" />
                                  Pinned
                                </span>
                              )}
                              {isStarred && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-yellow-500/30 text-yellow-200 border border-yellow-400/40 px-2 py-0.5 rounded-full">
                                  <Star className="w-2.5 h-2.5 fill-yellow-300 text-yellow-300" />
                                  Starred
                                </span>
                              )}
                            </div>
                          )}
                          {/* Attached Inspection Card if present */}
                          {msg.inspectionId && (
                            <div className="mb-2.5 p-2.5 rounded-xl bg-slate-950/40 border border-white/10 flex items-center gap-3">
                              {msg.imageUrl && (
                                <img 
                                  src={msg.imageUrl} 
                                  alt="Component" 
                                  className="w-12 h-12 rounded-lg object-cover border border-white/20" 
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <Scan className="w-3 h-3 text-cyan-300" />
                                  <span className="font-semibold text-white truncate text-[11px]">
                                    {msg.componentName || 'Inspection Scan'}
                                  </span>
                                </div>
                                {msg.defectType && (
                                  <span className="inline-block mt-0.5 px-1.5 py-0.2 text-[10px] rounded bg-red-500/30 text-red-200 border border-red-500/40 font-semibold">
                                    Defect: {msg.defectType}
                                  </span>
                                )}
                              </div>
                              {onSelectInspection && (
                                <button
                                  onClick={() => {
                                    const match = inspections.find(i => i.id === msg.inspectionId);
                                    if (match) {
                                      onSelectInspection(match);
                                      if (setActiveTab) {
                                        if (currentUser?.role === 'Admin') {
                                          setActiveTab('reports');
                                        } else {
                                          setActiveTab('inspection');
                                        }
                                      }
                                    }
                                  }}
                                  className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-[10px] font-medium transition"
                                >
                                  View
                                </button>
                              )}
                            </div>
                          )}

                          {/* Voice Message Audio Player */}
                          {msg.audioUrl && (
                            <VoiceMessagePlayer 
                              audioUrl={msg.audioUrl} 
                              duration={msg.audioDuration} 
                              isMine={isMine} 
                            />
                          )}

                          {/* Text Content */}
                          {(!msg.audioUrl || (msg.content && !msg.content.startsWith('🎤 Voice Note'))) && (
                            <p className="whitespace-pre-wrap mt-0.5">{msg.content}</p>
                          )}

                          {/* Read status */}
                          {isMine && (
                            <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-indigo-200/80">
                              <CheckCheck className={`w-3.5 h-3.5 ${msg.read ? 'text-cyan-300' : 'text-indigo-300'}`} />
                              <span>{msg.read ? 'Read' : 'Delivered'}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Action Chips */}
            <div className="px-6 py-2 border-t border-slate-800/60 bg-slate-900/40 overflow-x-auto flex items-center gap-2">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider whitespace-nowrap flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                Quick Templates:
              </span>
              {quickTemplates.map((template, idx) => (
                <button
                  key={idx}
                  onClick={() => setMessageText(template)}
                  className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition whitespace-nowrap"
                >
                  {template}
                </button>
              ))}
            </div>

            {/* Attached Inspection Preview (before sending) */}
            {attachedInspection && (
              <div className="px-6 py-2 bg-indigo-950/40 border-t border-indigo-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Scan className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-indigo-200">
                    Attached: <strong className="text-white">{attachedInspection.componentName}</strong> ({attachedInspection.status} • Score: {attachedInspection.qualityScore}%)
                  </span>
                </div>
                <button
                  onClick={() => setAttachedInspection(null)}
                  className="text-slate-400 hover:text-white p-1 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Composer Input Bar or Active Voice Recorder */}
            {isRecording ? (
              <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3 shadow-inner">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                    <span className="text-xs font-semibold text-red-400 font-mono">
                      Recording Voice Note: {formatSecs(recordingDuration)}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    Speak into your microphone now...
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={cancelRecording}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-300 border border-slate-700 hover:border-red-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={stopAndSendRecording}
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Send Voice Note
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setShowAttachModal(true)}
                  className={`p-2.5 rounded-xl border transition ${
                    attachedInspection 
                      ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' 
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700'
                  }`}
                  title="Attach Inspection Scan to Message"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={`Message ${selectedRecipient.name} (${selectedRecipient.role})...`}
                  className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />

                {/* Voice Note Record Button */}
                <button
                  type="button"
                  onClick={startRecording}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 border border-slate-700 transition flex items-center gap-1.5"
                  title="Record Voice Note"
                >
                  <Mic className="w-4 h-4 text-cyan-400" />
                </button>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={loading || (!messageText.trim() && !attachedInspection)}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send
                </button>
              </form>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
            <MessageSquare className="w-12 h-12 opacity-30 mb-2" />
            <p className="text-sm">Select a colleague from the left to start direct communications.</p>
          </div>
        )}
      </div>

      {/* Attach Inspection Modal */}
      {showAttachModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Scan className="w-4 h-4 text-cyan-400" />
                Select Inspection Record to Reference
              </h3>
              <button 
                onClick={() => setShowAttachModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {inspections.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">
                  No inspection scans available in this company yet.
                </p>
              ) : (
                inspections.slice(0, 15).map(insp => (
                  <button
                    key={insp.id}
                    onClick={() => {
                      setAttachedInspection(insp);
                      setShowAttachModal(false);
                    }}
                    className="w-full text-left p-3 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 flex items-center gap-3 transition"
                  >
                    {insp.imageOriginal && (
                      <img src={insp.imageOriginal} alt={insp.componentName} className="w-12 h-12 rounded-lg object-cover border border-slate-700" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate">{insp.componentName}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          insp.status === 'PASS' 
                            ? 'bg-emerald-500/20 text-emerald-300' 
                            : 'bg-red-500/20 text-red-300'
                        }`}>
                          {insp.status} ({insp.qualityScore}%)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {insp.componentCode} • Line: {insp.lineName || insp.lineId}
                      </p>
                      {insp.defects && insp.defects.length > 0 && (
                        <p className="text-[10px] text-red-400 mt-0.5 truncate">
                          Defect: {insp.defects[0].type} ({insp.defects[0].severity})
                        </p>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
