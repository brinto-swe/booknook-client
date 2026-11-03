"use client";

import { BookOpen, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import Brand from "./Brand";

const socialPaths = {
  X: "M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 14.6 5.5 22H2.3l7.9-9L.8 2h6.5l4.5 6.8L18.9 2Zm-1.1 18h1.8L6.3 3.9H4.4L17.8 20Z",
  GitHub: "M12 .8a11.2 11.2 0 0 0-3.5 21.8c.6.1.8-.2.8-.5v-2c-3.3.7-4-1.4-4-1.4-.5-1.3-1.3-1.6-1.3-1.6-1.1-.8.1-.8.1-.8 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6a4.7 4.7 0 0 1 1.3-3.2 4.4 4.4 0 0 1 .1-3.2s1-.3 3.3 1.2a11.3 11.3 0 0 1 6 0C17.5 4.2 18.5 4.5 18.5 4.5a4.4 4.4 0 0 1 .1 3.2 4.7 4.7 0 0 1 1.3 3.3c0 4.7-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.2v3c0 .3.2.6.8.5A11.2 11.2 0 0 0 12 .8Z",
  YouTube: "M23 7s-.2-1.6-.9-2.3c-.9-.9-1.9-.9-2.4-1C16.4 3.5 12 3.5 12 3.5s-4.4 0-7.7.2c-.5.1-1.5.1-2.4 1C1.2 5.4 1 7 1 7S.8 8.8.8 10.7v1.6c0 1.9.2 3.7.2 3.7s.2 1.6.9 2.3c.9.9 2.1.9 2.6 1 1.9.2 7.5.2 7.5.2s4.4 0 7.7-.3c.5 0 1.5-.1 2.4-.9.7-.7.9-2.3.9-2.3s.2-1.8.2-3.7v-1.6C23.2 8.8 23 7 23 7ZM9.7 14.8V8.2l6.4 3.3-6.4 3.3Z",
  LinkedIn: "M20.5 2h-17A1.5 1.5 0 0 0 2 3.5v17A1.5 1.5 0 0 0 3.5 22h17a1.5 1.5 0 0 0 1.5-1.5v-17A1.5 1.5 0 0 0 20.5 2ZM8 19H5V9h3v10ZM6.5 7.7a1.7 1.7 0 1 1 0-3.4 1.7 1.7 0 0 1 0 3.4ZM19 19h-3v-5c0-1.2-.4-2-1.5-2-1 0-1.5.7-1.5 2v5h-3V9h3v1.4c.5-.9 1.4-1.6 2.8-1.6 2 0 3.2 1.3 3.2 4V19Z",
};

export default function Footer() {
  return <footer className="site-footer"><div className="footer-inner page-width"><div className="footer-brand"><Brand footer /><p>Read. Borrow. Grow.</p></div><div className="footer-contact"><h2>Contact Us</h2><a href="mailto:hello@booknook.com"><Mail aria-hidden="true" />hello@booknook.com</a><a href="tel:+8801234567890"><Phone aria-hidden="true" />+880 1234 567890</a></div><div className="footer-social"><h2>Follow Us</h2><div>{Object.entries(socialPaths).map(([name, path]) => <button key={name} aria-label={`BookNook on ${name}`} onClick={() => toast.info("Our community channels are coming soon.")}><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={path} /></svg></button>)}</div></div><div className="footer-copyright"><BookOpen aria-hidden="true" /><p>© 2026 BookNook. All rights reserved.</p></div></div></footer>;
}
