import { useState } from "react";
import { Bot, Send, X, UserPlus } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function AIBotFloating() {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hi! I'm your ChickTrack assistant. Ask me anything about batches, logs, or setup. Type 'register' to create an account here. I'll ask for your name, email and password to set you up." },
  ]);
  // Conversational registration flow state
  const [regActive, setRegActive] = useState(false);
  const [regStep, setRegStep] = useState<"name" | "email" | "phone" | "password" | "confirm">("name");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [registering, setRegistering] = useState(false);

  function startRegisterFlow() {
    setRegActive(true);
    setRegStep("name");
    setRegName("");
    setRegEmail("");
    setRegPassword("");
    setRegPhone("");
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "Let's get you set up. What's your full name?" },
    ]);
  }

  async function send() {
    const content = text.trim();
    if (!content) return;
    setText("");
    // If registration flow is active, treat messages as answers to prompts
    if (regActive) {
      await handleRegisterStep(content);
      return;
    }

    const newMsgs = [...messages, { role: "user", content } as ChatMessage];
    setMessages(newMsgs);
    setSending(true);
    try {
      // If user types 'register', start the flow instead of calling AI
      if (/\bregister\b/i.test(content)) {
        startRegisterFlow();
      } else {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: newMsgs }),
        });
        const data = await res.json();
        const reply = data?.reply || "Sorry, I couldn't get a response.";
        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      }
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", content: "There was an error talking to AI. Please try again." }]);
    } finally {
      setSending(false);
    }
  }

  async function submitRegistration() {
    setRegistering(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: regName, email: regEmail, phone: regPhone || undefined, password: regPassword }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t);
      }
      const data = await res.json();
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("auth_user", JSON.stringify(data.user));
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `✅ Registered ${data.user.name} (${data.user.email}). You're now signed in. Type 'dashboard' to go to your dashboard or ask me what to do next.` }
      ]);
      setRegActive(false);
      setRegStep("name");
      setRegName("");
      setRegEmail("");
      setRegPassword("");
      setRegPhone("");
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: "❌ Registration failed. Please check details and try again." }]);
      setRegActive(false);
    } finally {
      setRegistering(false);
    }
  }

  async function handleRegisterStep(answer: string) {
    // Add the user's answer to the chat
    setMessages((prev) => [...prev, { role: "user", content: answer }]);

    if (registering) return;

    switch (regStep) {
      case "name": {
        const cleaned = answer.trim();
        if (cleaned.length < 2) {
          setMessages((prev) => [...prev, { role: "assistant", content: "Please provide your full name (at least 2 characters)." }]);
          return;
        }
        setRegName(cleaned);
        setRegStep("email");
        setMessages((prev) => [...prev, { role: "assistant", content: "Great. What's your email address?" }]);
        return;
      }
      case "email": {
        const email = answer.trim();
        const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        if (!ok) {
          setMessages((prev) => [...prev, { role: "assistant", content: "That doesn't look like a valid email. Please enter a valid email address." }]);
          return;
        }
        setRegEmail(email);
        setRegStep("phone");
        setMessages((prev) => [...prev, { role: "assistant", content: "Got it. What's your phone number? (optional) You can type 'skip' to continue." }]);
        return;
      }
      case "phone": {
        const raw = answer.trim();
        if (/^skip$/i.test(raw)) {
          setRegPhone("");
        } else {
          setRegPhone(raw);
        }
        setRegStep("password");
        setMessages((prev) => [...prev, { role: "assistant", content: "Thanks. Please create a password (min 8 characters)." }]);
        return;
      }
      case "password": {
        const pwd = answer;
        if (pwd.length < 8) {
          setMessages((prev) => [...prev, { role: "assistant", content: "Please choose a password with at least 8 characters." }]);
          return;
        }
        setRegPassword(pwd);
        setRegStep("confirm");
        setMessages((prev) => [...prev, { role: "assistant", content: "Please confirm your password." }]);
        return;
      }
      case "confirm": {
        const confirm = answer;
        if (confirm !== regPassword) {
          setMessages((prev) => [...prev, { role: "assistant", content: "Passwords do not match. Please enter your password again." }]);
          setRegStep("password");
          return;
        }
        // Submit
        setMessages((prev) => [...prev, { role: "assistant", content: "Registering your account..." }]);
        await submitRegistration();
        return;
      }
    }
  }

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow hover:brightness-110 transition-smooth"
        aria-label="Open AI Assistant"
      >
        <Bot className="h-6 w-6" />
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 rounded-xl border bg-card shadow-large overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/40">
            <div className="flex items-center gap-2 font-semibold">
              <Bot className="h-5 w-5 text-primary" /> ChickTrack AI
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (!regActive) {
                    startRegisterFlow();
                  }
                }}
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border hover:bg-muted/60"
                title="Register"
              >
                <UserPlus className="h-3.5 w-3.5" /> Register
              </button>
              <button onClick={() => setOpen(false)} className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-muted/60">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block px-3 py-2 rounded-lg text-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                  {m.content}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t flex items-center gap-2">
            <input
              value={text}
              onChange={(e)=>setText(e.target.value)}
              onKeyDown={(e)=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); send(); } }}
              placeholder="Ask something..."
              className="flex-1 px-3 py-2 rounded-md border bg-background"
            />
            <button onClick={send} disabled={sending || registering} className="inline-flex items-center justify-center h-9 w-9 rounded-md bg-accent text-accent-foreground disabled:opacity-60">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
