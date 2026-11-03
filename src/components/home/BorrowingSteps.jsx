import Link from "next/link";
import { ArrowRight, BookOpen, CalendarDays, CirclePlus, Lightbulb } from "lucide-react";

const steps = [
  { Icon: BookOpen, title: "1. Browse Books", text: <>Explore our vast<br /> collection</> },
  { Icon: CirclePlus, title: "2. Borrow a Book", text: <>Pick a book and<br /> confirm borrowing</> },
  { Icon: CalendarDays, title: "3. Return on Time", text: <>Return the book<br /> within the due date</> },
];

export default function BorrowingSteps() {
  return <section className="borrowing-panel" aria-labelledby="borrowing-title"><div className="borrowing-intro"><h2 id="borrowing-title"><Lightbulb aria-hidden="true" />How Borrowing Works?</h2><p>Get your favorite books in just a few simple steps.</p><Link href="/books" className="button button-pill">Start Now <ArrowRight size={18} aria-hidden="true" /></Link></div><ol className="borrowing-steps">{steps.map(({ Icon, title, text }, index) => <li key={title}><span className="step-icon"><Icon aria-hidden="true" /></span><h3>{title}</h3><p>{text}</p>{index < 2 && <span className="step-arrow"><ArrowRight size={19} aria-hidden="true" /></span>}</li>)}</ol></section>;
}
