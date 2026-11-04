import { requireSession } from "@/lib/session";
import UserAvatar from "@/components/auth/UserAvatar";
import { destinationWithQuery } from "@/lib/auth-ui/redirects";

export const metadata = { title: "My Profile" };
export default async function ProfilePage({ searchParams }) {
  const { user } = await requireSession(destinationWithQuery("/profile", await searchParams));
  const memberSince = user.createdAt && Number.isFinite(new Date(user.createdAt).getTime())
    ? new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "Asia/Shanghai" }).format(new Date(user.createdAt)) : "Not available";
  return <section className="member-page"><div className="member-card">
    <div className="profile-header"><UserAvatar user={{ name: user.name, image: user.image }} /><div><h1>{user.name || "BookNook reader"}</h1><p>{user.email}</p></div></div>
    <dl className="profile-details">
      <div><dt>Full name</dt><dd>{user.name || "Not provided"}</dd></div>
      <div><dt>Email address</dt><dd>{user.email}</dd></div>
      <div><dt>Member since</dt><dd>{memberSince}</dd></div>
      <div><dt>Account</dt><dd>BookNook member</dd></div>
    </dl>
  </div></section>;
}
