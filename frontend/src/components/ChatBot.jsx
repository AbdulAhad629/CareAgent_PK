import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bot, Send, Sparkles, X, Minimize2 } from "lucide-react"
import { cn } from "../lib/utils"

const QUICK_PROMPTS = [
  "How does AI triage work?",
  "Where is the live queue?",
  "How do I register?",
]

const RESPONSES = {
  "how does ai triage work?":
    "Our Triage Agent analyzes your symptoms in Urdu or English, assigns a priority level (1–5), and routes you to the right specialist automatically.",
  "where is the live queue?":
    "Visit the Live Queue page to see all waiting patients in real time. It refreshes every 15 seconds with triage priorities and room assignments.",
  "how do i register?":
    "Click 'Register Patient' or go to /register. Enter your details and symptoms — our 4 AI agents handle triage, doctor matching, records, and scheduling instantly.",
  default:
    "I'm CareAgent AI, your hospital assistant. Ask about registration, triage, the live queue, or finding a doctor. How can I help you today?",
}

function getResponse(input) {
  const key = input.toLowerCase().trim()
  for (const [pattern, reply] of Object.entries(RESPONSES)) {
    if (pattern !== "default" && key.includes(pattern.replace("?", "").slice(0, 12))) {
      return reply
    }
  }
  if (key.includes("triage") || key.includes("symptom")) return RESPONSES["how does ai triage work?"]
  if (key.includes("queue") || key.includes("wait")) return RESPONSES["where is the live queue?"]
  if (key.includes("register") || key.includes("sign")) return RESPONSES["how do i register?"]
  if (key.includes("doctor")) return "Browse our Doctors section on the homepage or visit /doctors to see specialist dashboards and patient queues."
  if (key.includes("urdu") || key.includes("اردو")) return "Yes! CareAgent PK fully supports Urdu and English. Describe your symptoms in either language during registration."
  return RESPONSES.default
}

export default function ChatBot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hello! I'm your CareAgent AI assistant. Ask me anything about registration, triage, or finding a doctor.",
    },
  ])
  const [input, setInput] = useState("")
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, typing])

  const send = (text) => {
    const trimmed = text.trim()
    if (!trimmed) return

    setMessages((m) => [...m, { role: "user", text: trimmed }])
    setInput("")
    setTyping(true)

    setTimeout(() => {
      setMessages((m) => [...m, { role: "assistant", text: getResponse(trimmed) }])
      setTyping(false)
    }, 800 + Math.random() * 400)
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-24 right-4 z-[60] flex w-[calc(100vw-2rem)] max-w-[380px] flex-col overflow-hidden rounded-card border border-white/[0.1] bg-surface-card/95 shadow-glow backdrop-blur-2xl sm:right-6"
            style={{ height: "min(520px, calc(100vh - 120px))" }}
          >
            <div className="relative flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
              <div className="absolute inset-0 bg-gradient-to-r from-accent-purple/10 via-accent-indigo/5 to-transparent" />
              <div className="relative flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-accent shadow-glow-sm">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">CareAgent AI</p>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-status-success animate-pulse" />
                    <span className="text-[11px] text-slate-400">Online · Ready to assist</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="relative rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-gradient-accent text-white"
                        : "border border-white/[0.08] bg-white/[0.04] text-slate-300"
                    )}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {typing && (
                <div className="flex gap-1 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 w-fit">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-accent-purple"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="border-t border-white/[0.08] px-4 py-3">
              <div className="mb-2 flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => send(p)}
                    className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[11px] text-slate-400 transition-colors hover:border-accent-purple/30 hover:text-white"
                  >
                    {p}
                  </button>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  send(input)
                }}
                className="flex gap-2"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about triage, queue, doctors..."
                  className="input-dark flex-1 rounded-xl py-2.5"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="btn-gradient flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl disabled:opacity-40"
                >
                  <Send className="h-4 w-4 text-white" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "fixed bottom-6 right-4 z-[60] flex h-14 w-14 items-center justify-center rounded-2xl shadow-glow sm:right-6",
          open ? "bg-surface-elevated border border-white/[0.12]" : "bg-gradient-accent"
        )}
        aria-label={open ? "Close chat" : "Open AI assistant"}
      >
        {open ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <>
            <Bot className="h-6 w-6 text-white" />
            <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-cyan opacity-60" />
              <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-status-success" />
            </span>
          </>
        )}
      </motion.button>
    </>
  )
}
