"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Keyboard, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const slides = [
  { first: "Discover Your", second: "Next Great", accent: "Read", text: "Explore thousands of books, borrow your favorites, and enjoy the journey of reading." },
  { first: "A New Chapter", second: "Starts with a", accent: "Book", text: "From timeless stories to new discoveries, find a little inspiration on every page." },
  { first: "Find a Story.", second: "Discover a New", accent: "World", text: "Make time for your next adventure. A whole world of wonderful books is waiting." },
];

export default function HeroSlider() {
  return (
    <section className="hero" aria-label="Discover BookNook">
      <Swiper modules={[Navigation, Pagination, Keyboard, A11y]} slidesPerView={1} loop keyboard={{ enabled: true, onlyInViewport: true }} navigation={{ prevEl: ".hero-previous", nextEl: ".hero-next" }} pagination={{ clickable: true }} a11y={{ enabled: true }}>
        {slides.map((slide, index) => <SwiperSlide key={slide.first}><div className="hero-slide"><div className="hero-copy">{index === 0 ? <h1>{slide.first}<br />{slide.second} <span>{slide.accent}</span></h1> : <h2>{slide.first}<br />{slide.second} <span>{slide.accent}</span></h2>}<p>{slide.text}</p><Link href="/books" className="button button-pill">Browse Books <ArrowRight size={18} aria-hidden="true" /></Link></div><div className="hero-art"><Image src="/assets/home/hero-reading.png" alt="An open book on blue and orange books beside a plant and a Read More coffee mug" fill sizes="(max-width: 600px) 85vw, 50vw" priority={index === 0} /></div></div></SwiperSlide>)}
      </Swiper>
      <button className="hero-control hero-previous" aria-label="Previous slide"><ChevronLeft aria-hidden="true" /></button><button className="hero-control hero-next" aria-label="Next slide"><ChevronRight aria-hidden="true" /></button>
    </section>
  );
}
