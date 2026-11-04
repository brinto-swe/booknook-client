import Navbar from "@/components/home/Navbar";
import Footer from "@/components/home/Footer";

export default function PageShell({ children, className = "" }) {
  return <><a href="#main-content" className="skip-link">Skip to content</a><Navbar /><main id="main-content" className={`account-main ${className}`}>{children}</main><Footer /></>;
}
