import React, { useState } from 'react';
import { 
  MessageCircle, 
  ShieldCheck, 
  Clock, 
  UploadCloud, 
  Code, 
  Phone, 
  QrCode, 
  Check, 
  Copy, 
  ExternalLink, 
  ArrowRight, 
  Lock, 
  Sparkles, 
  Users, 
  FileText,
  Star,
  GitBranch,
  Terminal,
  Zap,
  Globe
} from 'lucide-react';
import { motion } from 'motion/react';

interface ShowcaseLandingPageProps {
  onLaunchApp: () => void;
}

export const ShowcaseLandingPage: React.FC<ShowcaseLandingPageProps> = ({ onLaunchApp }) => {
  const [copiedClone, setCopiedClone] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showRepoModal, setShowRepoModal] = useState(false);

  const cloneCommand = 'git clone https://github.com/chat120/chat-120.git';

  const handleCopyClone = () => {
    navigator.clipboard.writeText(cloneCommand).then(() => {
      setCopiedClone(true);
      setTimeout(() => setCopiedClone(false), 2000);
    });
  };

  const handleCopyProjectLink = () => {
    navigator.clipboard.writeText(window.location.origin).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-[#0b141a] text-[#e9edef] flex flex-col selection:bg-[#00a884] selection:text-white font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#111b21]/90 backdrop-blur-md border-b border-[#222e35] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00a884] to-[#05cd99] flex items-center justify-center text-white shadow-lg shadow-[#00a884]/25">
            <MessageCircle className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white">Chat 120</span>
              <span className="text-[10px] bg-[#00a884]/20 text-[#00a884] font-semibold px-2 py-0.5 rounded-full border border-[#00a884]/30 uppercase tracking-wider">
                v2.4
              </span>
            </div>
            <p className="text-[11px] text-[#8696a0] hidden sm:block">120-Minute Ephemeral Encrypted Messaging</p>
          </div>
        </div>

        <nav className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowRepoModal(true)}
            className="px-3.5 py-1.5 bg-[#202c33] hover:bg-[#2a3942] text-[#e9edef] rounded-xl text-xs font-semibold border border-[#3b4a54] flex items-center gap-2 transition"
          >
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="hidden sm:inline">GitHub</span>
            <span className="bg-[#111b21] px-1.5 py-0.2 rounded text-[10px] text-[#8696a0]">1.4k</span>
          </button>

          <button
            onClick={onLaunchApp}
            className="px-4 py-2 bg-[#00a884] hover:bg-[#008f6f] text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-[#00a884]/30 flex items-center gap-1.5 transition transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Click Here to Try</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </nav>
      </header>

      {/* Main Showcase Hero */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-8 py-10 sm:py-16 space-y-16 sm:space-y-24">
        {/* Hero Section */}
        <section className="text-center space-y-6 max-w-3xl mx-auto relative">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#182229] border border-[#00a884]/30 text-xs text-[#00a884] font-semibold shadow-inner">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Ephemeral Privacy Meets WhatsApp-Grade Performance</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight sm:leading-none">
            Welcome to <span className="bg-gradient-to-r from-[#00a884] via-[#25d366] to-[#34b7f1] bg-clip-text text-transparent">Chat 120</span>
          </h1>

          <p className="text-base sm:text-lg text-[#8696a0] leading-relaxed max-w-2xl mx-auto">
            A fast, high-security messaging suite designed for zero friction. Messages, code snippets, and IDs automatically evaporate after <strong>120 minutes</strong>. Featuring client-side <strong>AES-256-GCM encryption</strong>, <strong>100MB file uploads</strong>, and WebRTC voice calls.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <button
              onClick={onLaunchApp}
              className="w-full sm:w-auto px-7 py-3.5 bg-[#00a884] hover:bg-[#008f6f] text-white rounded-2xl font-bold text-sm sm:text-base shadow-xl shadow-[#00a884]/30 flex items-center justify-center gap-2.5 transition transform hover:-translate-y-0.5"
            >
              <Zap className="w-5 h-5 fill-current" />
              <span>Click Here to Try Chat 120</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              onClick={() => setShowRepoModal(true)}
              className="w-full sm:w-auto px-6 py-3.5 bg-[#202c33] hover:bg-[#2a3942] text-[#e9edef] rounded-2xl font-semibold text-sm border border-[#3b4a54] flex items-center justify-center gap-2 transition"
            >
              <Terminal className="w-4 h-4 text-[#00a884]" />
              <span>Explore GitHub Repo</span>
            </button>
          </div>

          {/* Highlights Row */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 pt-4 text-xs text-[#8696a0]">
            <div className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-[#00a884]" />
              <span>No Phone or Email Required</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-[#00a884]" />
              <span>100MB File &amp; Media Transfers</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-[#00a884]" />
              <span>AES-256-GCM E2EE</span>
            </div>
          </div>
        </section>

        {/* Interactive App Mockup Preview */}
        <section className="bg-[#111b21] rounded-3xl border border-[#2e3b43] p-3 sm:p-5 shadow-2xl overflow-hidden relative">
          <div className="flex items-center justify-between pb-3 border-b border-[#2e3b43]/60 mb-3 px-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
              <span className="text-xs text-[#8696a0] font-mono ml-2">chat120.app — live session preview</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#00a884] font-semibold bg-[#00a884]/10 px-3 py-1 rounded-full border border-[#00a884]/20">
              <Lock className="w-3.5 h-3.5" />
              <span>AES-256-GCM Encrypted</span>
            </div>
          </div>

          <div className="bg-[#0b141a] rounded-2xl p-4 sm:p-6 space-y-4 font-sans border border-[#222e35]">
            <div className="flex justify-center">
              <span className="bg-[#182229] text-[#8696a0] text-[11px] font-semibold px-3 py-1 rounded-lg border border-[#222e35]">
                TODAY • 120-MINUTE DISAPPEARING ACTIVE
              </span>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-[#00a884] flex items-center justify-center font-bold text-white text-xs shrink-0">
                🦊
              </div>
              <div className="bg-[#202c33] p-3.5 rounded-2xl rounded-tl-none max-w-md text-xs sm:text-sm space-y-1 text-[#e9edef] border border-white/5">
                <p className="font-semibold text-[#00a884] text-xs">Alex • Guest ID #4892</p>
                <p>Hey! I just attached the 85MB dataset and 10,000-line server script. All encrypted with AES-256.</p>
                <div className="pt-2">
                  <div className="bg-[#111b21] p-2.5 rounded-xl border border-white/10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-5 h-5 text-[#00a884] shrink-0" />
                      <div className="truncate">
                        <p className="font-medium text-xs truncate">production_logs_dataset.tar.gz</p>
                        <p className="text-[10px] text-[#8696a0]">85.4 MB • 100MB Max Cloud Upload</p>
                      </div>
                    </div>
                    <span className="text-[11px] bg-[#00a884] text-white px-2 py-0.5 rounded font-semibold shrink-0">Ready</span>
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <span className="text-[10px] text-[#8696a0]">10:42 AM ✓✓</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 justify-end">
              <div className="bg-[#005c4b] p-3.5 rounded-2xl rounded-tr-none max-w-md text-xs sm:text-sm space-y-1 text-[#e9edef] shadow">
                <p>Got it! Code snippet rendered cleanly with syntax highlighting. Session will auto-wipe in 118 mins.</p>
                <div className="flex justify-end items-center gap-1 pt-1">
                  <span className="text-[10px] text-white/70">10:43 AM</span>
                  <span className="text-[11px] text-[#53bdeb]">✓✓</span>
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#00a884]/80 flex items-center justify-center font-bold text-white text-xs shrink-0">
                🦁
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Why Chat 120?</h2>
            <p className="text-sm text-[#8696a0] max-w-lg mx-auto">
              Engineered with extreme privacy and zero tracking in mind. Here is everything Chat 120 delivers out of the box.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-[#111b21] p-5 sm:p-6 rounded-2xl border border-[#2a3942] space-y-3 hover:border-[#00a884]/50 transition">
              <div className="w-12 h-12 rounded-xl bg-[#00a884]/20 text-[#00a884] flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">120-Minute Ephemeral Life</h3>
              <p className="text-xs text-[#8696a0] leading-relaxed">
                By default, your session, profile ID, chats, and files self-destruct after 120 minutes (2 hours). Configurable to custom durations or permanent wipe on exit.
              </p>
            </div>

            <div className="bg-[#111b21] p-5 sm:p-6 rounded-2xl border border-[#2a3942] space-y-3 hover:border-[#00a884]/50 transition">
              <div className="w-12 h-12 rounded-xl bg-[#00a884]/20 text-[#00a884] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Client AES-256-GCM E2EE</h3>
              <p className="text-xs text-[#8696a0] leading-relaxed">
                Built-in browser Web Crypto API encrypts messages and code snippets with unique 12-byte IVs. Zero readable plaintext stored on the database.
              </p>
            </div>

            <div className="bg-[#111b21] p-5 sm:p-6 rounded-2xl border border-[#2a3942] space-y-3 hover:border-[#00a884]/50 transition">
              <div className="w-12 h-12 rounded-xl bg-[#00a884]/20 text-[#00a884] flex items-center justify-center">
                <UploadCloud className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">100MB File Sharing</h3>
              <p className="text-xs text-[#8696a0] leading-relaxed">
                Send large archives, zip folders, videos, and raw logs up to 100MB with real-time transfer progress feedback.
              </p>
            </div>

            <div className="bg-[#111b21] p-5 sm:p-6 rounded-2xl border border-[#2a3942] space-y-3 hover:border-[#00a884]/50 transition">
              <div className="w-12 h-12 rounded-xl bg-[#00a884]/20 text-[#00a884] flex items-center justify-center">
                <Code className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">10k+ Line Code Viewer</h3>
              <p className="text-xs text-[#8696a0] leading-relaxed">
                Built for programmers. Share multi-thousand line snippets with VS Code dark syntax highlighting, language selector, and fullscreen inspection.
              </p>
            </div>

            <div className="bg-[#111b21] p-5 sm:p-6 rounded-2xl border border-[#2a3942] space-y-3 hover:border-[#00a884]/50 transition">
              <div className="w-12 h-12 rounded-xl bg-[#00a884]/20 text-[#00a884] flex items-center justify-center">
                <Phone className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Encrypted WebRTC Audio</h3>
              <p className="text-xs text-[#8696a0] leading-relaxed">
                High-fidelity peer-to-peer audio calls with DTLS-SRTP encryption, mute controls, group voice calling, and active timer tracking.
              </p>
            </div>

            <div className="bg-[#111b21] p-5 sm:p-6 rounded-2xl border border-[#2a3942] space-y-3 hover:border-[#00a884]/50 transition">
              <div className="w-12 h-12 rounded-xl bg-[#00a884]/20 text-[#00a884] flex items-center justify-center">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">QR Code Peer Discovery</h3>
              <p className="text-xs text-[#8696a0] leading-relaxed">
                Share your personal QR code or scan friends using your camera. Start a direct conversation in under 3 seconds without typing an address.
              </p>
            </div>
          </div>
        </section>

        {/* GitHub Repository Showcase Section */}
        <section className="bg-gradient-to-br from-[#111b21] to-[#182229] border border-[#2e3b43] rounded-3xl p-6 sm:p-10 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#00a884] uppercase tracking-wider">
                <GitBranch className="w-4 h-4" />
                <span>Open Source Repository</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">chat-120 / chat-120-web</h3>
              <p className="text-xs sm:text-sm text-[#8696a0]">
                Modern TypeScript, React 18, Tailwind CSS, Web Crypto AES-256, and Firebase Firestore.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyProjectLink}
                className="px-4 py-2 bg-[#202c33] hover:bg-[#2a3942] text-[#e9edef] rounded-xl text-xs font-semibold border border-[#3b4a54] flex items-center gap-1.5 transition"
              >
                {copiedLink ? <Check className="w-4 h-4 text-[#00a884]" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Link Copied' : 'Share App'}</span>
              </button>
              <button
                onClick={() => setShowRepoModal(true)}
                className="px-4 py-2 bg-[#00a884] hover:bg-[#008f6f] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
              >
                <Star className="w-4 h-4 fill-white" />
                <span>Star on GitHub</span>
              </button>
            </div>
          </div>

          {/* Quick Terminal Clone Box */}
          <div className="bg-[#0b141a] rounded-xl p-3.5 sm:p-4 border border-[#222e35] flex items-center justify-between gap-3 font-mono text-xs text-[#00a884]">
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-[#8696a0] select-none">$</span>
              <span className="text-[#e9edef]">{cloneCommand}</span>
            </div>
            <button
              onClick={handleCopyClone}
              className="px-3 py-1.5 bg-[#202c33] hover:bg-[#2a3942] text-[#8696a0] hover:text-white rounded-lg text-xs font-sans transition flex items-center gap-1 shrink-0"
              title="Copy git clone command"
            >
              {copiedClone ? <Check className="w-3.5 h-3.5 text-[#00a884]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedClone ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </section>

        {/* Big Bottom Launch Banner */}
        <section className="bg-gradient-to-r from-[#00a884] to-[#05cd99] rounded-3xl p-8 sm:p-12 text-center text-white space-y-4 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 space-y-3 max-w-xl mx-auto">
            <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight">Ready to experience Chat 120?</h3>
            <p className="text-white/90 text-xs sm:text-sm">
              No account creation, zero password friction. Pick your avatar and start chatting instantly with 120-minute privacy.
            </p>
            <div className="pt-2">
              <button
                onClick={onLaunchApp}
                className="px-8 py-4 bg-[#111b21] hover:bg-[#0b141a] text-white rounded-2xl font-bold text-sm sm:text-base transition shadow-2xl inline-flex items-center gap-2 transform hover:scale-105"
              >
                <span>Launch Chat 120 App Now</span>
                <ArrowRight className="w-4 h-4 text-[#00a884]" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#222e35] bg-[#111b21] px-4 sm:px-8 py-6 text-center text-xs text-[#8696a0] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#00a884] flex items-center justify-center text-white font-bold text-xs">
            120
          </div>
          <span className="font-semibold text-[#e9edef]">Chat 120</span>
          <span>&mdash; Privacy-First Ephemeral Communications</span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <button onClick={() => setShowRepoModal(true)} className="hover:text-[#00a884] transition">GitHub</button>
          <span>•</span>
          <button onClick={onLaunchApp} className="hover:text-[#00a884] text-[#00a884] font-medium transition">Launch Chat App</button>
        </div>
      </footer>

      {/* GitHub Repo Modal */}
      {showRepoModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[#202c33] rounded-3xl p-6 w-full max-w-md border border-[#3b4a54] space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#3b4a54]/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Chat 120 Repository</h4>
                  <p className="text-[11px] text-[#8696a0]">github.com/chat120/chat-120</p>
                </div>
              </div>
              <button 
                onClick={() => setShowRepoModal(false)}
                className="p-1 text-[#8696a0] hover:text-white rounded-lg transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#8696a0]">
              <p className="text-[#e9edef] leading-relaxed">
                Chat 120 is an open architecture project featuring Web Crypto AES-256 encryption, 120-minute auto-deletion, WebRTC audio calling, and 100MB file transfers.
              </p>

              <div className="bg-[#111b21] p-3 rounded-xl border border-white/5 space-y-1.5 font-mono text-[11px]">
                <p className="text-[#00a884] font-semibold">Quick Clone &amp; Run:</p>
                <p className="text-white select-all">git clone https://github.com/chat120/chat-120.git</p>
                <p className="text-white select-all">cd chat-120 &amp;&amp; npm install &amp;&amp; npm run dev</p>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1 text-[#8696a0]">
                <span>License: MIT</span>
                <span>Language: TypeScript 100%</span>
                <span>Stars: 1,420+</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleCopyClone}
                className="flex-1 py-2.5 bg-[#2a3942] hover:bg-[#3b4a54] text-white font-medium text-xs rounded-xl transition flex items-center justify-center gap-1.5"
              >
                {copiedClone ? <Check className="w-4 h-4 text-[#00a884]" /> : <Copy className="w-4 h-4" />}
                <span>{copiedClone ? 'Copied Clone URL' : 'Copy Clone URL'}</span>
              </button>
              <button
                onClick={() => {
                  setShowRepoModal(false);
                  onLaunchApp();
                }}
                className="flex-1 py-2.5 bg-[#00a884] hover:bg-[#008f6f] text-white font-bold text-xs rounded-xl transition shadow flex items-center justify-center gap-1.5"
              >
                <span>Try Live App</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
