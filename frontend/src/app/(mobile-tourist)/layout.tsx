import { TravelShell } from "@/components/travel/travel-shell";
import { TouristAuthGuard } from "@/components/auth/tourist-guard";

/** Tourist routes share the travel header, navigation, and authentication guard. */
export default function MobileTouristLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <TouristAuthGuard>
      <TravelShell>{children}</TravelShell>
    </TouristAuthGuard>
  );
}
