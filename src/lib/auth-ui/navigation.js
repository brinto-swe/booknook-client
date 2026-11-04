export const publicLinks = [["Home", "/"], ["All Books", "/books"]];
export const privateLinks = [["Add Book", "/add-book"], ["My Books", "/my-books"], ["My Borrows", "/my-borrows"]];
export const accountLinks = [["My Profile", "/profile"], ["My Books", "/my-books"], ["My Borrows", "/my-borrows"]];

export function navbarState(session, isPending) {
  const user = session?.user || null;
  return {
    user,
    loading: !user && isPending,
    links: user ? [...publicLinks, ...privateLinks] : publicLinks,
    showAuthLinks: !user && !isPending,
  };
}

export function userInitials(name) {
  return (typeof name === "string" ? name.trim().split(/\s+/).slice(0, 2).map(part => part[0] || "").join("") : "") || "R";
}
