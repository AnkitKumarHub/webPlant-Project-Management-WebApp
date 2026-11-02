import { redirect } from "next/navigation";

export default function HomePage() {
  // `/projects` is itself guarded, so signed-out visitors land on /login from there.
  redirect("/projects");
}
