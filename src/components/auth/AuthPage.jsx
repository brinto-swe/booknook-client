import { Suspense } from "react";
import { BookOpen } from "lucide-react";
import { auth } from "@/lib/auth";
import PageShell from "./PageShell";
import AuthForm from "./AuthForm";

export default function AuthPage({ mode }) {
  const registering = mode === "register";
  return <PageShell className="auth-page">
    <section className="auth-card" aria-labelledby="auth-title">
      <div className="auth-book-icon"><BookOpen aria-hidden="true" /></div>
      <p className="auth-eyebrow">YOUR NEXT CHAPTER STARTS HERE</p>
      <h1 id="auth-title">{registering ? "Join the BookNook community" : "Welcome back to BookNook"}</h1>
      <p className="auth-description">{registering ? "A world of stories. A little space of your own." : "Your favorite stories are waiting for you."}</p>
      <Suspense fallback={<p role="status" className="auth-loading">Preparing your form…</p>}>
        <AuthForm mode={mode} googleEnabled={Boolean(auth.options.socialProviders?.google)} />
      </Suspense>
    </section>
  </PageShell>;
}
