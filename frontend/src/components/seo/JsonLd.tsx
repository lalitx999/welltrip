/**
 * JsonLd.tsx
 * Reusable Schema.org JSON-LD Structured Data Component for SEO & AEO (AI Engine Optimization).
 * Generates Organization, TouristDestination, Event, and FAQPage schemas.
 */

export function SisaketJsonLd() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "WellTrip Sisaket Eco-Wellness Tourism",
    "url": "https://www.welltripthailand.com",
    "logo": "https://www.welltripthailand.com/images/attractions/suan-somdet-srinagarindra.jpeg",
    "sameAs": [
      "https://www.facebook.com/hashtag/ศรีสะเกษเมืองแห่งโอกาส",
      "https://www.facebook.com/hashtag/SoundOfSisaket2026"
    ],
    "description": "แพลตฟอร์มท่องเที่ยวสุขภาพและวิถีชุมชนยั่งยืน จังหวัดศรีสะเกษ เชื่อมโยงโฮมสเตย์ อาหารพื้นถิ่น GI สปาสมุนไพร และสินค้า OTOP",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "อำเภอเมืองศรีสะเกษ",
      "addressRegion": "จังหวัดศรีสะเกษ",
      "postalCode": "33000",
      "addressCountry": "TH"
    }
  };

  const destinationSchema = {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    "name": "จังหวัดศรีสะเกษ (Sisaket Province)",
    "description": "ดินแดน 4 ชนเผ่า (เขมร ลาว ส่วย เยอ) อุดมด้วยทุเรียนภูเขาไฟ GI กาแฟดินภูเขาไฟขุนหาญ ปราสาทขอมโบราณ 31 แห่ง และ 13 หมู่บ้าน OTOP นวัตวิถี",
    "url": "https://www.welltripthailand.com/recommended",
    "includesAttraction": [
      {
        "@type": "TouristAttraction",
        "name": "ผามออีแดง",
        "description": "จุดชมวิวชายแดนไทย-กัมพูชาบนยอดเขาพนมดงรัก ชมทะเลหมอกยามเช้าและภาพสลักนูนต่ำโบราณ 1,500 ปี"
      },
      {
        "@type": "TouristAttraction",
        "name": "ปราสาทสระกำแพงใหญ่",
        "description": "ปราสาทขอมโบราณขนาดใหญ่ที่สุดในจังหวัดศรีสะเกษ ศิลปะเกลียง-บาปวน"
      },
      {
        "@type": "TouristAttraction",
        "name": "วัดป่ามหาเจดีย์แก้ว (วัดล้านขวด)",
        "description": "พระอุโบสถสร้างด้วยขวดแก้วรีไซเคิลกว่า 1.5 ล้านขวด แห่งเดียวในโลก"
      }
    ]
  };

  const soundOfSisaketEventSchema = {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": "Sound of Sisaket 2026 & เทศกาลดนตรีส่งท้ายปี",
    "startDate": "2026-11-01",
    "endDate": "2026-12-31",
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "eventStatus": "https://schema.org/EventScheduled",
    "location": {
      "@type": "Place",
      "name": "เกาะกลางน้ำห้วยน้ำคำ & ลานกิจกรรมเมืองศรีสะเกษ",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "อำเภอเมืองศรีสะเกษ",
        "addressRegion": "ศรีสะเกษ",
        "addressCountry": "TH"
      }
    },
    "description": "มหกรรมดนตรี กาแฟ กีฬา การประกวด แคมป์ งานงิ้ว และ Sound of Sisaket 2026 จัดโดย หอการค้าจังหวัดศรีสะเกษ",
    "organizer": {
      "@type": "Organization",
      "name": "หอการค้าจังหวัดศรีสะเกษ & YEC Sisaket",
      "url": "https://www.welltripthailand.com/news"
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "จังหวัดศรีสะเกษมีสถานที่ท่องเที่ยวอะไรโดดเด่นบ้าง?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "ศรีสะเกษมีสถานที่ท่องเที่ยว 31 แห่ง ครอบคลุมจุดชมวิวผามออีแดง, น้ำตกสำโรงเกียรติ, ปราสาทสระกำแพงใหญ่, วัดล้านขวด (วัดป่ามหาเจดีย์แก้ว), วัดไพรพัฒนา (หลวงปู่สรวง), สวนสมเด็จพระศรีนครินทร์ (ดงต้นลำดวน 40,000 ต้น), และ Sisaket Aquarium"
        }
      },
      {
        "@type": "Question",
        "name": "สินค้า OTOP และของฝากยอดนิยมของศรีสะเกษมีอะไรบ้าง?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "สินค้า OTOP ยอดนิยม ได้แก่ เสื้อยืดอัตลักษณ์ศรีสะเกษ (Sound of Sisaket), กาแฟโรบัสต้าขุนหาญ ดินภูเขาไฟ GI (500g), ทุเรียนภูเขาไฟ GI, หอมแดงและกระเทียมโทน GI, ผ้าทอมือชนเผ่าเยอ, และงานจักสานหวายบ้านละทาย"
        }
      },
      {
        "@type": "Question",
        "name": "ศรีสะเกษมีชนเผ่าพื้นเมืองกี่ชนเผ่า?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "จังหวัดศรีสะเกษมี 4 ชนเผ่าพื้นเมืองดั้งเดิม ได้แก่ เขมร, ลาว, ส่วย (กูย), และเยอ ซึ่งมีภาษา ผ้าทอมือ และวิถีชีวิตเอกลักษณ์เฉพาะตัว"
        }
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(destinationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(soundOfSisaketEventSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}
