import { redirect } from "next/navigation";

/**
 * The root path always punts into the protected app shell. Middleware will
 * bounce unauthenticated users to /login.
 */
export default function RootPage() {
  redirect("/dashboard");
}
