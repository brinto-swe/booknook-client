import Link from "next/link";

export default function Brand({ footer = false }) {
  return <Link href="/" className={`brand${footer ? " brand-footer" : ""}`} aria-label="BookNook home"><span className="brand-mark"><svg viewBox="0 0 56 48" fill="none" aria-hidden="true"><path d="M3 9h23v35H3zM30 9h23v35H30z" fill="#344bd1" /><path d="M7 4c8-3 15 0 21 5v32c-7-5-13-7-21-4V4Z" fill="#94a7ff" stroke="white" strokeWidth="2" /><path d="M49 4c-8-3-15 0-21 5v32c7-5 13-7 21-4V4Z" fill="#788df0" stroke="white" strokeWidth="2" /><path d="M28 10v30" stroke="white" strokeWidth="2" /></svg></span><span>BookNook</span></Link>;
}
