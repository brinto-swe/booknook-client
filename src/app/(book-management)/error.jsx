"use client";
export default function ErrorPage({ reset }) { return <section className="book-page book-state" role="alert"><h1>Your library is unavailable</h1><p>Please try again in a moment.</p><button className="book-primary" onClick={reset}>Try again</button></section>; }
