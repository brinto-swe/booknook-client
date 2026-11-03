import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Quote, Star } from "lucide-react";

export default function Testimonials() {
  return <section className="testimonials-panel" aria-labelledby="testimonials-title"><div className="testimonial-intro"><h2 id="testimonials-title"><Star aria-hidden="true" />What Our Readers Say</h2><p>Real stories from our amazing readers</p><Link href="/register" className="button button-pill community-button">Join Our Community <ArrowRight size={17} aria-hidden="true" /></Link></div><figure className="testimonial-quote"><Quote className="quote-mark" aria-hidden="true" /><blockquote>BookNook has completely changed the way I read. The interface is so simple and easy to use!</blockquote><figcaption><Image src="/assets/home/reader.jpg" alt="Portrait representing sample reader Sarah Ahmed" width={52} height={52} /><span><strong>Sarah Ahmed</strong><small>Book Lover</small></span></figcaption></figure><div className="testimonial-decoration"><div className="rating" aria-label="5 out of 5 stars">{Array.from({ length: 5 }, (_, index) => <Star key={index} aria-hidden="true" />)}</div><Image src="/assets/home/open-book.svg" className="decorative-book" alt="" width={200} height={125} /></div></section>;
}
