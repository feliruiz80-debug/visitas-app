export type Visit = {
  id: string;
  visitorName: string;
  documentId: string;
  company: string;
  hostName: string;
  reason: string;
  enteredAt: string;
  leftAt: string | null;
};

export type NewVisit = {
  visitorName: string;
  documentId: string;
  company: string;
  hostName: string;
  reason: string;
};

const STORAGE_KEY = "visitas-app.v1";

const AVATAR_COLORS = ["#0f6e56", "#8a4b2f", "#3d4f7c", "#6b3f55", "#3f5c45", "#70552d"];

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function createSeed(): Visit[] {
  return [
    {
      id: "seed-ana",
      visitorName: "Ana Beltrán",
      documentId: "45.882.110",
      company: "Comercial Andina",
      hostName: "Laura Méndez",
      reason: "Propuesta de mantenimiento",
      enteredAt: minutesAgo(35),
      leftAt: null,
    },
    {
      id: "seed-hector",
      visitorName: "Héctor Salas",
      documentId: "18.220.441",
      company: "Taller Norte",
      hostName: "Diego Paredes",
      reason: "Revisión de equipos",
      enteredAt: minutesAgo(130),
      leftAt: null,
    },
    {
      id: "seed-sofia",
      visitorName: "Sofía Kim",
      documentId: "39.104.772",
      company: "Estudio Kim",
      hostName: "Martín Acosta",
      reason: "Entrevista",
      enteredAt: minutesAgo(180),
      leftAt: minutesAgo(90),
    },
    {
      id: "seed-pablo",
      visitorName: "Pablo Herrera",
      documentId: "27.551.903",
      company: "Logística Sur",
      hostName: "Camila Rivas",
      reason: "Entrega de repuestos",
      enteredAt: minutesAgo(240),
      leftAt: minutesAgo(20),
    },
    {
      id: "seed-elena",
      visitorName: "Elena Duarte",
      documentId: "12.908.336",
      company: "Clínica del Parque",
      hostName: "Inés Molina",
      reason: "Consulta de seguimiento",
      enteredAt: minutesAgo(60 * 26),
      leftAt: minutesAgo(60 * 24),
    },
  ];
}

function isVisit(value: unknown): value is Visit {
  if (!value || typeof value !== "object") return false;
  const visit = value as Partial<Visit>;
  return (
    typeof visit.id === "string" &&
    typeof visit.visitorName === "string" &&
    typeof visit.documentId === "string" &&
    typeof visit.company === "string" &&
    typeof visit.hostName === "string" &&
    typeof visit.reason === "string" &&
    typeof visit.enteredAt === "string" &&
    (visit.leftAt === null || typeof visit.leftAt === "string")
  );
}

export function loadVisits(): Visit[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) {
    const seeded = createSeed();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isVisit);
  } catch {
    return [];
  }
}

export function saveVisits(visits: Visit[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(visits));
}

export function createVisit(visits: Visit[], input: NewVisit, at = new Date().toISOString()): Visit[] {
  const visit: Visit = {
    id: crypto.randomUUID(),
    visitorName: input.visitorName.trim(),
    documentId: input.documentId.trim(),
    company: input.company.trim(),
    hostName: input.hostName.trim(),
    reason: input.reason.trim(),
    enteredAt: at,
    leftAt: null,
  };
  return [visit, ...visits];
}

export function checkoutVisit(visits: Visit[], id: string, at = new Date().toISOString()): Visit[] {
  return visits.map((visit) =>
    visit.id === id && visit.leftAt === null ? { ...visit, leftAt: at } : visit,
  );
}

export function deleteVisit(visits: Visit[], id: string): Visit[] {
  return visits.filter((visit) => visit.id !== id);
}

export function isSameLocalDay(iso: string, day: Date): boolean {
  const date = new Date(iso);
  return (
    date.getFullYear() === day.getFullYear() &&
    date.getMonth() === day.getMonth() &&
    date.getDate() === day.getDate()
  );
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function avatarColor(name: string): string {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function formatClock(iso: string): string {
  return new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

export function formatDay(date: Date): string {
  const label = new Intl.DateTimeFormat("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatDuration(fromIso: string, to: Date): string {
  const totalMinutes = Math.max(0, Math.floor((to.getTime() - new Date(fromIso).getTime()) / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  return `${hours} h ${minutes} min`;
}

export function matchesQuery(visit: Visit, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [visit.visitorName, visit.documentId, visit.company, visit.hostName, visit.reason]
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}
