export function authErrorMessage(error, mode = "login") {
  if (["INVALID_EMAIL_OR_PASSWORD", "INVALID_PASSWORD"].includes(error?.code) && mode === "login") return "The email or password is incorrect.";
  if (["USER_ALREADY_EXISTS", "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"].includes(error?.code)) return "An account with this email already exists. Please sign in.";
  if (error?.status === 429 || error?.statusCode === 429) return "Too many attempts. Please try again shortly.";
  return mode === "register" ? "We couldn’t create your account. Please try again." : "We couldn’t sign you in. Please try again.";
}

export async function submitAuth(client, mode, values) {
  let result;
  try {
    result = mode === "register"
      ? await client.signUp.email({ name: values.name, email: values.email, password: values.password })
      : await client.signIn.email({ email: values.email, password: values.password, rememberMe: values.rememberMe });
  } catch { throw new Error(authErrorMessage(null, mode)); }
  if (result.error || !result.data?.user) throw new Error(authErrorMessage(result.error, mode));
  return result.data;
}

export async function logoutSession(client) {
  let result;
  try { result = await client.signOut(); } catch { throw new Error("We couldn’t sign you out. Please try again."); }
  if (result.error) throw new Error("We couldn’t sign you out. Please try again.");
}
