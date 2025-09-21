import { MessageCircle } from "lucide-react";

interface WhatsAppFloatingProps {
  phone?: string; // in international format without + e.g. 1234567890
  message?: string;
}

export function WhatsAppFloating({ phone = "1234567890", message = "Hello! I have a question about ChickTrack." }: WhatsAppFloatingProps) {
  const href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-24 right-6 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-white shadow-glow hover:bg-green-600 transition-smooth"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
