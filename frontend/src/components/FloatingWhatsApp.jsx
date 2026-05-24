import { MessageCircle } from "lucide-react";
import { BRAND } from "../lib/data";

export default function FloatingWhatsApp() {
  return (
    <a
      href={BRAND.whatsapp}
      target="_blank"
      rel="noopener noreferrer"
      className="float-wa"
      data-testid="floating-whatsapp"
      aria-label="Chat with us on WhatsApp"
    >
      <MessageCircle size={24} />
    </a>
  );
}
