"use client";

import { EditorialMagazinePortal } from "@/components/travel/EditorialMagazinePortal";

export default function NewsPage() {
  return (
    <EditorialMagazinePortal
      kind="STORY"
      headerBadge="STORIES & EVENTS"
      mainHeading="เรื่องราวและกิจกรรมระหว่างทาง"
      subtitle="ปฏิทินเทศกาลประเพณี ข่าวสาร และกิจกรรมการเดินทางในจังหวัดศรีสะเกษ"
    />
  );
}
