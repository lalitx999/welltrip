"use client";

import { usePathname } from "next/navigation";
import { NaturePhoto, SisaketFooter, SisaketHeader, useSisaketCopy } from "@/components/sisaket/sisaket-shell";
import styles from "@/components/sisaket/sisaket.module.css";

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const copy = useSisaketCopy();
  const registration = pathname === "/register";
  const merchantRegistration = pathname === "/register/merchant";
  const callback = pathname === "/callback/google";

  if (merchantRegistration) {
    return (
      <div className={styles.shell}>
        <SisaketHeader />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[75vh]">
          {children}
        </main>
        <SisaketFooter />
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <SisaketHeader />
      <main className={styles.auth}>
        <NaturePhoto
          title={
            registration
              ? copy("ให้ทริปครั้งใหม่\nพาคุณใกล้ธรรมชาติ", "Let a new journey\nbring you closer to nature.")
              : copy("ทริปที่ดีต่อใจ\nเริ่มได้อีกครั้ง", "Your next slow journey\nstarts here.")
          }
          subtitle={registration ? "MAKE ROOM FOR A LITTLE JOY" : "YOUR NEXT SLOW JOURNEY"}
        />
        <section className={styles.formPanel}>
          {!callback && (
            <>
              <p className={styles.eyebrow}>
                {registration ? "BEGIN YOUR JOURNEY" : "WELCOME BACK"}
              </p>
              <h1>
                {registration
                  ? copy("เริ่มต้นทริปของคุณ", "Start your journey")
                  : copy("ยินดีต้อนรับกลับมา", "Welcome back")}
              </h1>
              <p className={styles.intro}>
                {registration
                  ? copy(
                      "สร้างบัญชีเพื่อจองและติดตามทริปได้สะดวก",
                      "Create an account to book and manage your trips."
                    )
                  : copy("เข้าสู่ระบบ แล้วไปต่อกับทริปของคุณ", "Sign in and continue your journey.")}
              </p>
            </>
          )}
          <div className={callback ? undefined : styles.formBody}>{children}</div>
        </section>
      </main>
      <SisaketFooter />
    </div>
  );
}
