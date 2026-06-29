import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Activity, Stethoscope, UserCheck, Bell, ArrowRight, AlertCircle, CheckCircle2, Clock, MapPin, Calendar, Zap, Mic, MicOff, Square } from "lucide-react"

const API = import.meta.env.VITE_API_URL || "http://localhost:8000"

const TRIAGE = {
  1: { color: "#EF4444", light: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.3)",   label: "IMMEDIATE",   emoji: "🔴", desc: "Life-threatening — See doctor NOW" },
  2: { color: "#F97316", light: "rgba(249,115,22,0.1)",  border: "rgba(249,115,22,0.3)",  label: "EMERGENCY",   emoji: "🟠", desc: "High risk — Very urgent" },
  3: { color: "#EAB308", light: "rgba(234,179,8,0.1)",   border: "rgba(234,179,8,0.3)",   label: "URGENT",      emoji: "🟡", desc: "Needs attention soon" },
  4: { color: "#22C55E", light: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.3)",   label: "SEMI-URGENT", emoji: "🟢", desc: "Moderate — Can wait briefly" },
  5: { color: "#94A3B8", light: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.3)", label: "NON-URGENT",  emoji: "⚪", desc: "Routine visit" },
}

const AGENTS = [
  { icon: <UserCheck size={20}/>, label: "Reception Agent",  desc: "Extracting patient info",    color: "#7C3AED" },
  { icon: <Activity size={20}/>,  label: "Triage Agent",     desc: "Analyzing symptoms via RAG", color: "#6366F1" },
  { icon: <Stethoscope size={20}/>,label:"Assignment Agent", desc: "Finding best doctor",        color: "#06B6D4" },
  { icon: <Bell size={20}/>,      label: "Follow-up Agent",  desc: "Scheduling reminder",        color: "#10B981" },
]

const STEPS = [
  { icon: <UserCheck size={18}/>, label: "Register",   sub: "Enter details" },
  { icon: <Activity size={18}/>,  label: "AI Triage",  sub: "Smart analysis" },
  { icon: <Stethoscope size={18}/>,label:"Assign",     sub: "Best doctor" },
  { icon: <Bell size={18}/>,      label: "Follow-up",  sub: "SMS reminder" },
]

export default function PatientRegister() {
  const [form, setForm]           = useState({ raw_input: "", symptoms: "" })
  const [result, setResult]       = useState(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState("")
  const [activeAgent, setActiveAgent] = useState(-1)

  // Voice states
  const [recording, setRecording]       = useState(false)
  const [recordingFor, setRecordingFor] = useState(null) // "raw_input" or "symptoms"
  const [audioBlob, setAudioBlob]       = useState(null)
  const [transcribing, setTranscribing] = useState(false)
  const [voiceError, setVoiceError]     = useState("")

  const mediaRecorderRef = useRef(null)
  const chunksRef        = useRef([])

  // ── Voice Recording ──────────────────────────────────────────
  const startRecording = async (field) => {
    setVoiceError("")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        stream.getTracks().forEach(t => t.stop())
        await transcribeAudio(blob, field)
      }

      mediaRecorder.start()
      setRecording(true)
      setRecordingFor(field)
    } catch (err) {
      setVoiceError("Microphone access denied. Please allow microphone permission.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop()
      setRecording(false)
      setRecordingFor(null)
    }
  }

  const transcribeAudio = async (blob, field) => {
    setTranscribing(true)
    setVoiceError("")
  
    try {
      const reader = new FileReader()
      reader.readAsDataURL(blob)
  
      reader.onloadend = async () => {
        try {
          const base64 = reader.result.split(",")[1]
  
          console.log("Sending audio, size:", base64.length)
  
          const res = await fetch(`${API}/api/v1/patients/voice-transcribe`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              audio_base64: base64,
              
            }),
          })
  
          const data = await res.json()
  
          console.log("Transcription result:", data)
  
          if (data.text && data.text.trim() !== "") {
            setForm((prev) => {
              const updated = {
                ...prev,
                [field]: data.text,
              }
  
              console.log("Form updated:", updated)
  
              return updated
            })
          } else {
            setVoiceError("No speech detected — please try again")
          }
        } catch (err) {
          console.error("Fetch error:", err)
          setVoiceError("Transcription failed — please try again")
        } finally {
          setTranscribing(false)
        }
      }
  
      reader.onerror = () => {
        setVoiceError("Audio read failed")
        setTranscribing(false)
      }
    } catch (err) {
      setVoiceError("Voice error: " + err.message)
      setTranscribing(false)
    }
  }

  // ── Form Submit ───────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError(""); setResult(null)

    for (let i = 0; i < 4; i++) {
      setActiveAgent(i)
      await new Promise(r => setTimeout(r, 800))
    }

    try {
      const res = await fetch(`${API}/api/v1/patients/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error("Server error — please try again")
      setResult(await res.json())
    } catch (err) { setError(err.message) }
    finally { setLoading(false); setActiveAgent(-1) }
  }

  const tc = result ? TRIAGE[result.triage_level] : null

  // ── Mic Button Component ──────────────────────────────────────
  const MicButton = ({ field, label }) => {
    const isRecordingThis = recording && recordingFor === field
    return (
      <div className="flex items-center gap-2 mt-2">
        {!isRecordingThis ? (
          <button type="button"
            onClick={() => startRecording(field)}
            disabled={recording || transcribing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
            style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", color: "#A78BFA" }}>
            <Mic size={14} />
            {transcribing && recordingFor === field ? "Transcribing..." : `Record ${label} in Urdu`}
          </button>
        ) : (
          <button type="button"
            onClick={stopRecording}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium animate-pulse"
            style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#F87171" }}>
            <Square size={14} />
            Stop Recording
          </button>
        )}
        {isRecordingThis && (
          <div className="flex items-center gap-1.5">
            {[0,1,2].map(i => (
              <div key={i} className="w-1 rounded-full bg-red-400"
                style={{ height: `${12 + i * 6}px`, animation: `pulse ${0.6 + i * 0.2}s ease-in-out infinite alternate` }} />
            ))}
            <span className="text-red-400 text-xs ml-1">Recording...</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen grid-bg noise" style={{ background: "#0B1120" }}>

      {/* Glow blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full animate-pulse-glow"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)" }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full animate-pulse-glow"
          style={{ background: "radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)", animationDelay: "1.5s" }} />
      </div>

      {/* NAV */}
      <nav className="relative z-50 flex items-center justify-between px-8 py-5 border-b border-white/5"
        style={{ background: "rgba(11,17,32,0.8)", backdropFilter: "blur(20px)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#7C3AED,#6366F1)" }}>
            <Activity size={20} className="text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-lg tracking-tight">CareAgent PK</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400 text-xs font-medium">4 AI Agents Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {[
            { href: "/queue",   icon: <Activity size={14}/>,    label: "Live Queue" },
            { href: "/doctors", icon: <Stethoscope size={14}/>, label: "Doctors" },
          ].map(l => (
            <a key={l.href} href={l.href}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white/60 hover:text-white text-sm font-medium transition-all glass glass-hover">
              {l.icon} {l.label}
            </a>
          ))}
          <a href="/queue"
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-white text-sm font-semibold"
            style={{ background: "linear-gradient(135deg,#7C3AED,#6366F1)" }}>
            <Zap size={14} /> Register Now
          </a>
        </div>
      </nav>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-12">

        {/* HERO */}
        <AnimatePresence>
          {!result && !loading && (
            <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }} className="text-center mb-12">
              <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} transition={{ delay:0.1 }}
                className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm mb-6">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-400 font-medium">AI-Powered Hospital Triage System</span>
              </motion.div>
              <h1 className="text-6xl font-black text-white mb-4 leading-tight tracking-tight">
                Smart Hospital<br /><span className="text-gradient">Triage System</span>
              </h1>
              <p className="text-white/50 text-xl mb-2">اردو یا انگریزی میں اپنی تکلیف بیان کریں</p>
              <p className="text-white/30 text-sm">4 AI Agents will instantly analyze and assign you the right doctor</p>

              {/* Steps */}
              <div className="grid grid-cols-4 gap-3 mt-10">
                {STEPS.map((s, i) => (
                  <motion.div key={i} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2+i*0.1 }}
                    className="glass glass-hover rounded-2xl p-4 text-center group transition-all">
                    <div className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center text-white/60 group-hover:text-white transition-colors"
                      style={{ background: "rgba(124,58,237,0.2)" }}>{s.icon}</div>
                    <p className="text-white text-xs font-semibold">{s.label}</p>
                    <p className="text-white/40 text-xs mt-0.5">{s.sub}</p>
                    <p className="text-purple-500 text-xs font-mono mt-2">0{i+1}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* LOADING */}
        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.95 }} className="mb-8">
              <div className="glass rounded-3xl p-8 text-center mb-6" style={{ border:"1px solid rgba(124,58,237,0.3)" }}>
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ background:"linear-gradient(135deg,#7C3AED,#6366F1)" }}>
                  <Activity size={28} className="text-white animate-pulse" />
                </div>
                <h3 className="text-white font-bold text-xl mb-1">AI Pipeline Running</h3>
                <p className="text-white/40 text-sm">4 agents processing your request...</p>
              </div>
              <div className="space-y-3">
                {AGENTS.map((agent, i) => (
                  <motion.div key={i} initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.2 }}
                    className="glass rounded-2xl p-4 flex items-center gap-4 transition-all"
                    style={{
                      border: activeAgent >= i ? `1px solid ${agent.color}40` : "1px solid rgba(255,255,255,0.06)",
                      background: activeAgent === i ? `${agent.color}10` : "rgba(255,255,255,0.02)"
                    }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: activeAgent >= i ? `${agent.color}20` : "rgba(255,255,255,0.05)", color: activeAgent >= i ? agent.color : "#ffffff40" }}>
                      {agent.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-semibold">{agent.label}</p>
                      <p className="text-white/40 text-xs">{agent.desc}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {activeAgent > i ? <CheckCircle2 size={18} className="text-green-400" />
                        : activeAgent === i ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: agent.color, borderTopColor:"transparent" }} />
                        : <div className="w-4 h-4 rounded-full border border-white/10" />}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FORM */}
        <AnimatePresence>
          {!result && !loading && (
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }} transition={{ delay:0.3 }}>
              <div className="rounded-3xl p-8" style={{ background:"#111827", border:"1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-3 mb-7">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background:"linear-gradient(135deg,#7C3AED,#6366F1)" }}>
                    <UserCheck size={18} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-lg">Patient Registration</h2>
                    <p className="text-white/40 text-sm">Type or use 🎤 microphone — Urdu supported</p>
                  </div>
                </div>

                {voiceError && (
                  <div className="flex items-center gap-3 rounded-2xl p-3 mb-5 text-sm"
                    style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", color:"#F87171" }}>
                    <AlertCircle size={14} />
                    {voiceError}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">

                  {/* Field 1 — Patient Info */}
                  <div>
                    <label className="block text-white/60 text-sm font-medium mb-2">
                      👤 Your Information
                      <span className="text-white/30 ml-2 font-normal">— name, age, gender</span>
                    </label>
                    <textarea rows={3}
                      placeholder='e.g. "Mera naam Ahmed hai, 45 saal, mujhe chest mein dard hai"'
                      className="w-full rounded-2xl p-4 text-sm text-white placeholder-white/20 focus:outline-none transition-all resize-none"
                      style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}
                      onFocus={e => e.target.style.borderColor="rgba(124,58,237,0.5)"}
                      onBlur={e => e.target.style.borderColor="rgba(255,255,255,0.08)"}
                      value={form.raw_input}
                      onChange={e => setForm({...form, raw_input: e.target.value})}
                      required />
                    <MicButton field="raw_input" label="Info" />
                  </div>

                  {/* Field 2 — Symptoms */}
                  <div>
                    <label className="block text-white/60 text-sm font-medium mb-2">
                      🤒 Symptoms / علامات
                      <span className="text-white/30 ml-2 font-normal">— describe your problem</span>
                    </label>
                    <textarea rows={3}
                      placeholder='e.g. "chest pain, shortness of breath" or "سینے میں درد، سانس لینے میں تکلیف"'
                      className="w-full rounded-2xl p-4 text-sm text-white placeholder-white/20 focus:outline-none transition-all resize-none"
                      style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}
                      onFocus={e => e.target.style.borderColor="rgba(124,58,237,0.5)"}
                      onBlur={e => e.target.style.borderColor="rgba(255,255,255,0.08)"}
                      value={form.symptoms}
                      onChange={e => setForm({...form, symptoms: e.target.value})}
                      required />
                    <MicButton field="symptoms" label="Symptoms" />
                  </div>

                  {error && (
                    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
                      className="flex items-center gap-3 rounded-2xl p-4 text-sm"
                      style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", color:"#EF4444" }}>
                      <AlertCircle size={16} className="flex-shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  <button type="submit" disabled={loading || transcribing}
                    className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all disabled:opacity-40 flex items-center justify-center gap-3 group"
                    style={{ background:"linear-gradient(135deg,#7C3AED,#6366F1,#06B6D4)" }}>
                    <Zap size={18} className="group-hover:scale-110 transition-transform" />
                    Register & Get AI Triage
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* RESULT */}
        <AnimatePresence>
          {result && tc && (
            <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }} className="space-y-4">
              {result.is_emergency && (
                <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
                  className="rounded-2xl p-4 flex items-center gap-4"
                  style={{ background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.4)" }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse"
                    style={{ background:"rgba(239,68,68,0.2)" }}>
                    <AlertCircle size={24} className="text-red-400" />
                  </div>
                  <div>
                    <p className="text-red-400 font-black text-lg">🚨 EMERGENCY PATIENT</p>
                    <p className="text-red-400/60 text-sm">Immediate medical attention required</p>
                  </div>
                </motion.div>
              )}

              <div className="rounded-3xl overflow-hidden" style={{ border:`1px solid ${tc.color}30` }}>
                <div className="p-7 relative overflow-hidden" style={{ background:`linear-gradient(135deg,${tc.color}20,${tc.color}08)` }}>
                  <div className="absolute inset-0" style={{ background:`radial-gradient(circle at 80% 50%,${tc.color}15,transparent 60%)` }} />
                  <div className="relative flex items-center justify-between">
                    <div>
                      <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-2">Token Number</p>
                      <p className="text-white text-6xl font-black tracking-tight">{result.token_number}</p>
                      <p className="text-white/50 text-sm mt-2">👤 {result.patient_name}</p>
                    </div>
                    <div className="text-right">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl mb-2"
                        style={{ background:`${tc.color}20`, border:`1px solid ${tc.color}40` }}>
                        <span className="text-xl">{tc.emoji}</span>
                        <span className="font-bold text-sm" style={{ color:tc.color }}>{tc.label}</span>
                      </div>
                      <p className="text-white/40 text-xs">{tc.desc}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-5" style={{ background:"#111827" }}>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { icon:<Stethoscope size={14}/>, label:"Specialty", value:result.required_specialty },
                      { icon:<UserCheck size={14}/>,   label:"Doctor",    value:result.assigned_doctor },
                      { icon:<MapPin size={14}/>,      label:"Room",      value:result.room },
                      { icon:<Clock size={14}/>,       label:"Wait Time", value:`~${result.wait_time_minutes} min` },
                      { icon:<Calendar size={14}/>,    label:"Follow-up", value:result.followup_date },
                      { icon:<Activity size={14}/>,    label:"Priority",  value:`Level ${result.triage_level}` },
                    ].map((item,i) => (
                      <div key={i} className="rounded-2xl p-3" style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)" }}>
                        <div className="flex items-center gap-1.5 text-white/30 mb-1.5">{item.icon}<span className="text-xs">{item.label}</span></div>
                        <p className="text-white font-bold text-sm">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl p-4" style={{ background:`${tc.color}08`, border:`1px solid ${tc.color}20` }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Activity size={14} style={{ color:tc.color }} />
                      <p className="text-xs font-bold uppercase tracking-wider" style={{ color:tc.color }}>AI Triage Assessment</p>
                    </div>
                    <p className="text-white/60 text-sm leading-relaxed">{result.triage_reason}</p>
                  </div>

                  <div className="rounded-2xl p-4" style={{ background:"rgba(124,58,237,0.08)", border:"1px solid rgba(124,58,237,0.2)" }}>
                    <p className="text-purple-400 text-xs font-bold uppercase tracking-wider mb-3">📨 اردو پیغام</p>
                    <p className="text-white/70 text-sm leading-loose text-right" dir="rtl">{result.message_urdu}</p>
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button onClick={() => setResult(null)}
                      className="flex-1 py-3 rounded-2xl text-white/50 font-semibold text-sm hover:text-white transition-all"
                      style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}>
                      ← New Patient
                    </button>
                    <a href="/queue"
                      className="flex-1 py-3 rounded-2xl text-white font-semibold text-sm text-center flex items-center justify-center gap-2"
                      style={{ background:"linear-gradient(135deg,#7C3AED,#6366F1)" }}>
                      <Activity size={14} /> View Live Queue
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}