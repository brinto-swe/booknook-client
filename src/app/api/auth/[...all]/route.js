import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import { connectAuthDatabase } from "@/lib/auth-database";

export const { GET, POST } = toNextJsHandler(async request => {
  try {
    await connectAuthDatabase();
    return await auth.handler(request);
  } catch {
    return Response.json({ code: "AUTH_UNAVAILABLE", message: "Authentication is temporarily unavailable." }, { status: 503 });
  }
});
