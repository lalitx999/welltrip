"use client";

/**
 * (mobile-tourist)/settings/page.tsx - User Application & Account Settings.
 */
import { useState } from "react";
import {
  Settings,
  Globe,
  Bell,
  ShieldCheck,
  Moon,
  HelpCircle,
  LogOut,
  ChevronRight,
  Check,
} from "lucide-react";

import { LanguageToggle } from "@/components/ui/language-toggle";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const { t } = useI18n();
  const { user, logout } = useAuth();

  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [ecoMode, setEcoMode] = useState(true);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 pb-16 pt-6 sm:px-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/60 pb-4">
        <Settings className="h-6 w-6 text-forest-800" aria-hidden="true" />
        <h1 className="font-serif text-2xl font-bold text-foreground">
          ตั้งค่าการใช้งาน (Settings)
        </h1>
      </div>

      <div className="space-y-6">
        {/* Language & Regional Section */}
        <section className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <Globe className="h-5 w-5 text-forest-800" />
            <h2 className="font-serif font-bold text-foreground">ภาษาและภูมิภาค (Language & Region)</h2>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">ภาษาของแอปพลิเคชัน (Application Language)</p>
              <p className="text-xs text-muted-foreground">สลับระหว่างภาษาไทยและภาษาอังกฤษ</p>
            </div>
            <LanguageToggle />
          </div>
        </section>

        {/* Notifications Section */}
        <section className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <Bell className="h-5 w-5 text-forest-800" />
            <h2 className="font-serif font-bold text-foreground">การแจ้งเตือน (Notifications)</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">การแจ้งเตือนสถานะการจอง & สลิป</p>
                <p className="text-xs text-muted-foreground">รับการแจ้งเตือนเมื่อการโอนเงินหรือการจองได้รับการยืนยัน</p>
              </div>
              <button
                type="button"
                onClick={() => setNotifications(!notifications)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  notifications ? "bg-forest-900" : "bg-muted"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    notifications ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-border/50 pt-3">
              <div>
                <p className="text-sm font-semibold text-foreground">จดหมายข่าวสารและโปรโมชันชุมชน</p>
                <p className="text-xs text-muted-foreground">รับข่าวสารงานเทศกาลและส่วนลดพิเศษจากวิสาหกิจชุมชน</p>
              </div>
              <button
                type="button"
                onClick={() => setEmailAlerts(!emailAlerts)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  emailAlerts ? "bg-forest-900" : "bg-muted"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    emailAlerts ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Display & Eco Theme */}
        <section className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <Moon className="h-5 w-5 text-forest-800" />
            <h2 className="font-serif font-bold text-foreground">ธีมและการแสดงผล (Eco Theme)</h2>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">โหมดประหยัดพลังงาน & Eco Mode</p>
              <p className="text-xs text-muted-foreground">ใช้โทนสีธรรมชาติเพื่อการถนอมสายตาและลดการใช้พลังงาน</p>
            </div>
            <button
              type="button"
              onClick={() => setEcoMode(!ecoMode)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                ecoMode ? "bg-forest-900" : "bg-muted"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  ecoMode ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </section>

        {/* Support & Legal */}
        <section className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <ShieldCheck className="h-5 w-5 text-forest-800" />
            <h2 className="font-serif font-bold text-foreground">ศูนย์ความช่วยเหลือ & ความเป็นส่วนตัว</h2>
          </div>

          <div className="space-y-1">
            <button
              type="button"
              className="flex w-full items-center justify-between py-2 text-sm text-foreground hover:text-forest-900 transition-colors"
            >
              <span>นโยบายความเป็นส่วนตัว (Privacy Policy)</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>

            <button
              type="button"
              className="flex w-full items-center justify-between py-2 text-sm text-foreground hover:text-forest-900 transition-colors border-t border-border/50"
            >
              <span>ข้อตกลงและเงื่อนไขการใช้งาน (Terms of Service)</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>

            <button
              type="button"
              className="flex w-full items-center justify-between py-2 text-sm text-foreground hover:text-forest-900 transition-colors border-t border-border/50"
            >
              <span>ติดต่อฝ่ายสนับสนุน WellTrip Support Center</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </section>

        {/* Account Logout */}
        {user && (
          <Button
            variant="outline"
            onClick={() => logout()}
            className="w-full justify-center rounded-xl py-3 font-semibold text-destructive hover:bg-destructive/10 border-destructive/30"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>ออกจากระบบ (Logout)</span>
          </Button>
        )}
      </div>
    </div>
  );
}
