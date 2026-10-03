import { TravelShell } from "@/components/travel/travel-shell";

/** Public tourist routes share the travel header, complete navigation and footer.
 * Existing pages retain their own authentication, data and booking behaviour.
 */
export default function MobileTouristLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <TravelShell>{children}</TravelShell>;
}
