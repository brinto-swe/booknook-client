"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { userInitials } from "@/lib/auth-ui/navigation";

export default function UserAvatar({ user, className = "" }) {
  const image = typeof user?.image === "string" && /^https?:\/\//i.test(user.image) ? user.image : undefined;
  return <Avatar className={`account-avatar ${className}`}>
    {image && <AvatarImage src={image} alt={`${user.name || "Reader"} profile`} referrerPolicy="no-referrer" />}
    <AvatarFallback>{userInitials(user?.name)}</AvatarFallback>
  </Avatar>;
}
