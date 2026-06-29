export const TRIAGE = {
  1: {
    color: "#EF4444",
    bg: "bg-red-500/20",
    border: "border-red-500/40",
    text: "text-red-400",
    label: "IMMEDIATE",
    emoji: "🔴",
    desc: "Life-threatening — See doctor NOW",
  },
  2: {
    color: "#F97316",
    bg: "bg-orange-500/20",
    border: "border-orange-500/40",
    text: "text-orange-400",
    label: "EMERGENCY",
    emoji: "🟠",
    desc: "High risk — Very urgent",
  },
  3: {
    color: "#F59E0B",
    bg: "bg-yellow-500/20",
    border: "border-yellow-500/40",
    text: "text-yellow-400",
    label: "URGENT",
    emoji: "🟡",
    desc: "Needs attention soon",
  },
  4: {
    color: "#10B981",
    bg: "bg-emerald-500/20",
    border: "border-emerald-500/40",
    text: "text-emerald-400",
    label: "SEMI-URGENT",
    emoji: "🟢",
    desc: "Moderate — Can wait briefly",
  },
  5: {
    color: "#94A3B8",
    bg: "bg-slate-500/20",
    border: "border-slate-500/40",
    text: "text-slate-400",
    label: "NON-URGENT",
    emoji: "⚪",
    desc: "Routine visit",
  },
}

export const SPECIALTY_META = {
  Cardiology: { years: "12+", rating: 4.9, avatar: "from-red-500/80 to-rose-600/80" },
  Neurology: { years: "10+", rating: 4.8, avatar: "from-violet-500/80 to-purple-600/80" },
  Orthopedics: { years: "14+", rating: 4.7, avatar: "from-blue-500/80 to-indigo-600/80" },
  Pediatrics: { years: "9+", rating: 4.9, avatar: "from-cyan-500/80 to-teal-600/80" },
  General: { years: "8+", rating: 4.6, avatar: "from-accent-purple/80 to-accent-indigo/80" },
  default: { years: "10+", rating: 4.8, avatar: "from-accent-purple/80 to-accent-cyan/80" },
}

export function getSpecialtyMeta(specialty) {
  return SPECIALTY_META[specialty] || SPECIALTY_META.default
}

export function getInitials(name) {
  return name
    .replace(/^Dr\.?\s*/i, "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}
