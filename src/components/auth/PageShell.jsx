import Footer from "@/components/home/Footer";

export default function PageShell({ children, className = "" }) {
  return <><main id="main-content" className={`account-main ${className}`}>{children}</main><Footer /></>;
}
