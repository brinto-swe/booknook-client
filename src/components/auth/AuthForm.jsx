"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { loginSchema, registerSchema } from "@/lib/auth-ui/schemas";
import { authPageURL, safeCallbackURL } from "@/lib/auth-ui/redirects";
import { submitAuth } from "@/lib/auth-ui/actions";

export default function AuthForm({ mode, googleEnabled }) {
  const registering = mode === "register";
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackURL = safeCallbackURL(searchParams.getAll("callbackURL").length === 1 ? searchParams.get("callbackURL") : null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [socialPending, setSocialPending] = useState(false);
  const [formError, setFormError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(registering ? registerSchema : loginSchema),
    defaultValues: registering ? { name: "", email: "", password: "", confirmPassword: "" } : { email: "", password: "", rememberMe: true },
  });
  const busy = isSubmitting || socialPending;

  async function onSubmit(values) {
    setFormError("");
    try {
      await submitAuth(authClient, mode, values);
      toast.success(registering ? "Welcome to BookNook! Your account is ready." : "Welcome back to BookNook!");
      router.replace(callbackURL);
      router.refresh();
    } catch (error) {
      const message = error instanceof TypeError ? "We couldn’t reach BookNook. Please try again." : error.message;
      setFormError(message);
      toast.error(message);
    }
  }

  async function signInWithGoogle() {
    if (!googleEnabled || busy) return;
    setSocialPending(true);
    setFormError("");
    try {
      const result = await authClient.signIn.social({ provider: "google", callbackURL });
      if (result.error) throw new Error("Google sign-in couldn’t be started. Please try again.");
    } catch {
      const message = "Google sign-in couldn’t be started. Please try again.";
      setFormError(message);
      toast.error(message);
      setSocialPending(false);
    }
  }

  function field(name, label, { type = "text", autoComplete, Icon, passwordToggle = false } = {}) {
    const visible = name === "confirmPassword" ? showConfirmation : showPassword;
    const toggle = name === "confirmPassword" ? setShowConfirmation : setShowPassword;
    return <div className="auth-field" key={name}>
      <label htmlFor={`auth-${name}`}>{label}</label>
      <div className="auth-input-wrap">
        {Icon && <Icon className="auth-input-icon" aria-hidden="true" />}
        <input id={`auth-${name}`} type={passwordToggle ? (visible ? "text" : "password") : type} autoComplete={autoComplete}
          aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `${name}-error` : (name === "password" && registering ? "password-hint" : undefined)}
          disabled={busy} {...register(name)} />
        {passwordToggle && <button type="button" className="password-toggle" aria-label={`${visible ? "Hide" : "Show"} ${name === "confirmPassword" ? "confirm password" : "password"}`} aria-pressed={visible} onClick={() => toggle(value => !value)} disabled={busy}>{visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</button>}
      </div>
      {errors[name] && <p className="field-error" id={`${name}-error`}>{errors[name].message}</p>}
    </div>;
  }

  return <>
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="auth-form">
      {registering && field("name", "Full name", { autoComplete: "name", Icon: UserRound })}
      {field("email", "Email address", { type: "email", autoComplete: "email", Icon: Mail })}
      {field("password", "Password", { autoComplete: registering ? "new-password" : "current-password", Icon: LockKeyhole, passwordToggle: true })}
      {registering && <p className="password-hint" id="password-hint">At least 6 characters, with an uppercase and a lowercase letter.</p>}
      {registering && field("confirmPassword", "Confirm password", { autoComplete: "new-password", Icon: LockKeyhole, passwordToggle: true })}
      {!registering && <label className="remember-me"><input type="checkbox" disabled={busy} {...register("rememberMe")} />Remember me</label>}
      {formError && <p className="auth-form-error" role="alert">{formError}</p>}
      <Button type="submit" className="button auth-submit" disabled={busy}>
        {isSubmitting ? <><LoaderCircle className="animate-spin" aria-hidden="true" />{registering ? "Creating account…" : "Signing in…"}</> : <>{registering ? "Create account" : "Login"}<ArrowRight aria-hidden="true" /></>}
      </Button>
    </form>
    <div className="auth-or"><span>or continue with</span></div>
    <Button type="button" variant="outline" className="google-button" disabled={!googleEnabled || busy} onClick={signInWithGoogle} aria-describedby={!googleEnabled ? "google-unavailable" : undefined}>
      {socialPending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <span className="google-mark" aria-hidden="true">G</span>}Continue with Google
    </Button>
    {!googleEnabled && <p id="google-unavailable" className="auth-provider-note">Google sign-in hasn’t been configured yet. You can use email and password.</p>}
    <p className="auth-switch">{registering ? "Already have an account?" : "New to BookNook?"} <Link href={authPageURL(registering ? "/login" : "/register", callbackURL)}>{registering ? "Login" : "Create an account"}</Link></p>
  </>;
}
