/**
 * projects/page.tsx — redirect /projects → /#projects (the section on the home page).
 * The loading.tsx skeleton exists for this route.
 */
import { redirect } from "next/navigation";

export default function ProjectsIndex() {
  redirect("/#projects");
}
