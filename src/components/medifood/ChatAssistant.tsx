import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { useAuth } from "@/store/auth";
import { useData } from "@/store/data";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const QUICK_CHIPS = [
  "📦 État des stocks actuels",
  "🏭 Commandes en cours",
  "📋 Aide sur les bons de livraison",
];

function buildSystemPrompt(user: { name: string; role: string }, stockSummary: string, orderSummary: string) {
  return `Tu es un assistant intelligent intégré dans MediProd, un système de gestion de production alimentaire (fruits secs et enrobés).

Utilisateur connecté : ${user.name}
Rôle : ${user.role}

Contexte actuel de l'application :
${stockSummary}
${orderSummary}

Tu réponds toujours en français, de manière concise et professionnelle. Tu aides l'utilisateur à comprendre les données de l'application, interpréter les indicateurs, et prendre des décisions. Tu ne peux pas modifier les données directement.`;
}

export function ChatAssistant() {
  const user = useAuth((s) => s.user);
  const { products, orders } = useData();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const firstName = user?.name?.split(" ")[0] ?? "là";

  useEffect(() => {
    if (open && !initialized) {
      setMessages([
        {
          role: "assistant",
          content: `Bonjour ${firstName} ! Je suis votre assistant MediProd. Je peux vous aider à suivre vos stocks, commandes et bons de livraison. Comment puis-je vous aider ?`,
        },
      ]);
      setInitialized(true);
    }
  }, [open, initialized, firstName]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function buildContextSummary() {
    const lowStock = products.filter((p) => p.currentStock < p.minStock);
    const stockSummary =
      lowStock.length > 0
        ? `Stocks en alerte : ${lowStock.map((p) => `${p.name} (${p.currentStock}/${p.minStock} kg)`).join(", ")}.`
        : "Tous les stocks sont au-dessus du seuil minimum.";

    const pending = orders.filter((o) => o.status === "En attente").length;
    const inProgress = orders.filter((o) => ["En cuisson", "Cuit", "En emballage"].includes(o.status)).length;
    const orderSummary = `Commandes : ${pending} en attente, ${inProgress} en cours de production, ${orders.filter((o) => o.status === "Terminé").length} terminées.`;

    return { stockSummary, orderSummary };
  }

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    const { stockSummary, orderSummary } = buildContextSummary();
    const systemPrompt = buildSystemPrompt(
      { name: user?.name ?? "Utilisateur", role: user?.role ?? "" },
      stockSummary,
      orderSummary,
    );

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-opus-4-5",
          max_tokens: 1024,
          system: systemPrompt,
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        throw new Error(`API error ${response.status}`);
      }

      const data = await response.json();
      const reply = data.content?.[0]?.text ?? "Je n'ai pas pu générer de réponse.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Une erreur s'est produite. Vérifiez votre connexion et réessayez." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  if (!user) return null;

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-[96px] right-6 z-50 flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          style={{ width: 380, height: 520 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-[#1D6A4A] px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-sm">🤖</div>
              <div>
                <p className="text-sm font-semibold text-white">Assistant MediProd</p>
                <p className="text-[10px] text-white/70">Propulsé par Claude AI</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-full p-1 text-white/80 transition hover:bg-white/20 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-[#1D6A4A] text-white"
                      : "bg-muted text-foreground"
                  }`}
                  style={{ borderBottomRightRadius: m.role === "user" ? 4 : undefined, borderBottomLeftRadius: m.role === "assistant" ? 4 : undefined }}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl bg-muted px-4 py-3" style={{ borderBottomLeftRadius: 4 }}>
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick chips — only show before any user message */}
          {messages.filter((m) => m.role === "user").length === 0 && (
            <div className="flex flex-wrap gap-1.5 border-t border-border px-3 py-2">
              {QUICK_CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => sendMessage(chip)}
                  className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-foreground transition hover:bg-muted"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex items-center gap-2 border-t border-border bg-background px-3 py-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Posez votre question…"
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              disabled={loading}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1D6A4A] text-white transition hover:bg-[#165a3e] disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#1D6A4A] text-white shadow-lg transition hover:bg-[#165a3e] active:scale-95"
        aria-label="Ouvrir l'assistant"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </>
  );
}
