/**
 * admin/loading.tsx — quick feedback while the admin surface streams
 * in. Short, on-brand copy so the vault never feels like a hang.
 */
import RouteLoader from "@/components/ui/RouteLoader";

export default function AdminLoading() {
  return (
    <RouteLoader
      messages={[
        "checking the vault…",
        "unlocking the console…",
        "polishing the control room…",
        "loading your dashboards…",
      ]}
      detail="admin workspace"
    />
  );
}
