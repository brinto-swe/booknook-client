"use client";

export default function MemberError({ reset }) {
  return <section className="member-page"><div className="member-card" role="alert">
    <h1>We couldn’t load your account</h1><p>Please try again in a moment.</p>
    <button onClick={reset} className="button">Try again</button>
  </div></section>;
}
