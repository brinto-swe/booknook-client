import { Suspense } from "react";
import Link from "next/link";
import HeroSlider from "@/components/home/HeroSlider";
import NewArrivals from "@/components/home/NewArrivals";
import BorrowingSteps from "@/components/home/BorrowingSteps";
import Categories from "@/components/home/Categories";
import Testimonials from "@/components/home/Testimonials";
import Footer from "@/components/home/Footer";

export default function Home() {
  return (
    <>
      <main id="main-content" className="page-width home-main">
        <Suspense fallback={<section className="hero" aria-label="Discover BookNook"><div className="hero-slide"><div className="hero-copy"><h1>Discover Your<br />Next Great <span>Read</span></h1><p>Explore thousands of books, borrow your favorites, and enjoy the journey of reading.</p><Link className="button button-pill" href="/books">Browse Books →</Link></div></div></section>}><HeroSlider /></Suspense>
        <NewArrivals />
        <BorrowingSteps />
        <Categories />
        <Testimonials />
      </main>
      <Footer />
    </>
  );
}
