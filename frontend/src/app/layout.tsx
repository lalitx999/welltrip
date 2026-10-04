import { Kanit } from "next/font/google";
import type { Metadata, Viewport } from "next";

import { Providers } from "@/components/providers";
import { SisaketJsonLd } from "@/components/seo/JsonLd";
import "./globals.css";
import "@/components/travel/experience.css";

const kanit = Kanit({
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-kanit",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#193E30",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "WellTrip Sisaket · แพลตฟอร์มท่องเที่ยวสุขภาพและวิถีชุมชนยั่งยืน จังหวัดศรีสะเกษ",
  description:
    "ค้นพบโฮมสเตย์เรือนไม้ สวนทุเรียนภูเขาไฟ GI กาแฟขุนหาญดินภูเขาไฟ อาหารสุขภาพพื้นถิ่น สปาสมุนไพร ปราสาทขอมโบราณ 31 แห่ง และปฏิทินกิจกรรม Sound of Sisaket 2026",
  keywords: [
    "ศรีสะเกษ",
    "เที่ยวศรีสะเกษ",
    "ศรีสะเกษเมืองแห่งโอกาส",
    "Sound of Sisaket 2026",
    "ทุเรียนภูเขาไฟ",
    "กาแฟขุนหาญดินภูเขาไฟ",
    "ผามออีแดง",
    "ปราสาทสระกำแพงใหญ่",
    "วัดล้านขวด",
    "วัดไพรพัฒนา",
    "โฮมสเตย์ศรีสะเกษ",
    "OTOP ศรีสะเกษ",
    "4 ชนเผ่าศรีสะเกษ",
  ],
  authors: [{ name: "WellTrip Sisaket Team" }],
  creator: "WellTrip Thailand",
  publisher: "WellTrip Sisaket Tourism Network",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: "https://www.welltripthailand.com",
    title: "WellTrip Sisaket · เที่ยวศรีสะเกษ สุขภาพและวิถีชุมชนยั่งยืน",
    description:
      "สัมผัสวิถีชีวิตสโลว์ไลฟ์ พักโฮมสเตย์สวนผลไม้ ชิมอาหารอินทรีย์ เที่ยวโบราณสถานขอม และ Sound of Sisaket 2026",
    siteName: "WellTrip Sisaket",
    images: [
      {
        url: "https://www.welltripthailand.com/images/attractions/suan-somdet-srinagarindra.jpeg",
        width: 1200,
        height: 630,
        alt: "เที่ยวศรีสะเกษ สวนสมเด็จพระศรีนครินทร์ ดงต้นลำดวนธรรมชาติ",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WellTrip Sisaket · เที่ยวศรีสะเกษ สุขภาพและวิถีชุมชนยั่งยืน",
    description:
      "สัมผัสวิถีชีวิตสโลว์ไลฟ์ พักโฮมสเตย์สวนผลไม้ ชิมอาหารอินทรีย์ เที่ยวโบราณสถานขอม และ Sound of Sisaket 2026",
    images: ["https://www.welltripthailand.com/images/attractions/suan-somdet-srinagarindra.jpeg"],
  },
  alternates: {
    canonical: "https://www.welltripthailand.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={kanit.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <SisaketJsonLd />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
