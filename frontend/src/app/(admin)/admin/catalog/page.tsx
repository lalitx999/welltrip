"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Package,
  Plus,
  Edit3,
  Trash2,
  Building2,
  Sparkles,
  ShoppingBag,
  UtensilsCrossed,
  Search,
  Save,
  X,
} from "lucide-react";

import { ListError, ListLoading } from "@/components/catalog/DataStates";
import { Button } from "@/components/ui/button";
import { formatBaht } from "@/lib/format";
import { getOTOPProducts, getAccommodations, getWellnessServices, getFoods } from "@/lib/api/catalog";
import { extractErrorMessage } from "@/lib/api/errors";
import { SISAKET_FEATURED_PRODUCTS } from "@/lib/sisaket-tourism-data";

type CatalogTab = "OTOP" | "ACCOMMODATION" | "WELLNESS" | "FOOD";

export default function AdminCatalogManagementPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<CatalogTab>("OTOP");
  const [searchTerm, setSearchTerm] = useState("");

  // Add/Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // Form states for new/edit item
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCategory, setFormCategory] = useState("TEXTILE");
  const [formDescription, setFormDescription] = useState("");
  const [formStock, setFormStock] = useState("100");
  const [formLocation, setFormLocation] = useState("ศรีสะเกษ");

  // Queries for catalog items
  const otopQuery = useQuery({
    queryKey: ["admin-otop-catalog"],
    queryFn: () => getOTOPProducts({ page: 1, limit: 50 }),
  });

  const accommodationsQuery = useQuery({
    queryKey: ["admin-acc-catalog"],
    queryFn: () => getAccommodations({ page: 1, limit: 50 }),
  });

  const wellnessQuery = useQuery({
    queryKey: ["admin-wellness-catalog"],
    queryFn: () => getWellnessServices({ page: 1, limit: 50 }),
  });

  const foodQuery = useQuery({
    queryKey: ["admin-food-catalog"],
    queryFn: () => getFoods({ page: 1, limit: 50 }),
  });

  function openAddModal() {
    setEditingItem(null);
    setFormName("");
    setFormPrice("");
    setFormCategory(activeTab === "OTOP" ? "TEXTILE" : activeTab === "FOOD" ? "ORGANIC" : "STANDARD");
    setFormDescription("");
    setFormStock("100");
    setFormLocation("ศรีสะเกษ");
    setIsModalOpen(true);
  }

  function openEditModal(item: any) {
    setEditingItem(item);
    setFormName(item.name || item.title || "");
    setFormPrice(String(item.price || item.min_price_per_night || "0"));
    setFormCategory(item.category || item.wellness_category || "STANDARD");
    setFormDescription(item.description || "");
    setFormStock(String(item.stock_quantity || item.capacity || "100"));
    setFormLocation(item.province || item.district || "ศรีสะเกษ");
    setIsModalOpen(true);
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Invalidate queries to refresh data list
    void queryClient.invalidateQueries({ queryKey: ["admin-otop-catalog"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-acc-catalog"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-wellness-catalog"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-food-catalog"] });
    setIsModalOpen(false);
  }

  // Combine backend query items with Sisaket featured items for full visibility
  const otopRows: any[] = [
    ...SISAKET_FEATURED_PRODUCTS.map((fp) => ({
      id: fp.id,
      name: fp.name,
      description: fp.description,
      price: fp.price,
      category: fp.category,
      stock_quantity: 100,
      is_active: true,
      is_featured: true,
    })),
    ...(otopQuery.data?.data ?? []),
  ];

  const accommodationRows: any[] = accommodationsQuery.data?.data ?? [];
  const wellnessRows: any[] = wellnessQuery.data?.data ?? [];
  const foodRows: any[] = foodQuery.data?.data ?? [];

  return (
    <div className="space-y-8 pb-12">
      {/* Editorial Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-forest-900 p-6 text-cream-50 shadow-xl sm:p-8 border border-gold-500/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.25),transparent_60%)]" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1 text-xs font-semibold text-gold-300">
              <Package className="h-3.5 w-3.5" />
              <span>Master Catalog Control · สำหรับเจ้าของระบบ</span>
            </div>
            <h1 className="font-serif text-2xl font-bold tracking-wide text-cream-100 sm:text-3xl">
              จัดการสินค้า สถานที่ และบริการทั้งหมด (Master Catalog Manager)
            </h1>
            <p className="text-xs text-cream-200/80 sm:text-sm leading-relaxed">
              เพิ่ม แก้ไข ลบ ปรับราคา และเปิด-ปิดสถานะการขายสินค้า OTOP โฮมสเตย์ บริการสปา และอาหารสุขภาพในระบบ
            </p>
          </div>

          <Button
            onClick={openAddModal}
            className="rounded-xl font-bold bg-gold-500 text-forest-950 hover:bg-gold-400 shadow-md flex items-center gap-2 shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>เพิ่มรายการใหม่</span>
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("OTOP")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
              activeTab === "OTOP"
                ? "bg-forest-900 text-cream-100 shadow-sm"
                : "border border-border/80 bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            <ShoppingBag className="h-4 w-4 text-gold-400" />
            <span>สินค้า OTOP ({otopRows.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ACCOMMODATION")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
              activeTab === "ACCOMMODATION"
                ? "bg-forest-900 text-cream-100 shadow-sm"
                : "border border-border/80 bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            <Building2 className="h-4 w-4 text-gold-400" />
            <span>ที่พัก & โฮมสเตย์ ({accommodationRows.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("WELLNESS")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
              activeTab === "WELLNESS"
                ? "bg-forest-900 text-cream-100 shadow-sm"
                : "border border-border/80 bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            <Sparkles className="h-4 w-4 text-gold-400" />
            <span>บริการสุขภาพ & สปา ({wellnessRows.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("FOOD")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
              activeTab === "FOOD"
                ? "bg-forest-900 text-cream-100 shadow-sm"
                : "border border-border/80 bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            <UtensilsCrossed className="h-4 w-4 text-gold-400" />
            <span>อาหารสุขภาพ ({foodRows.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="ค้นหารายการ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-border bg-card pl-9 pr-4 py-2 text-xs transition-all focus:border-forest-900 focus:outline-none"
          />
        </div>
      </div>

      {/* Tab Content Display */}
      {activeTab === "OTOP" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {otopRows
              .filter((item: any) => (item.name || "").toLowerCase().includes(searchTerm.toLowerCase()))
              .map((item: any) => (
                <div
                  key={item.id}
                  className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:border-gold-500/40 hover:shadow-md space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-forest-900/10 px-2.5 py-0.5 text-[10px] font-bold text-forest-900">
                        {item.category}
                      </span>
                      {item.is_featured && (
                        <span className="rounded-full bg-gold-500/20 px-2 py-0.5 text-[10px] font-bold text-gold-700">
                          FEATURED
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif text-base font-bold text-foreground">
                      {item.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-border/60">
                      <span className="font-serif text-base font-bold text-forest-900">
                        {formatBaht(item.price)}
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground">
                        สต็อก: {item.stock_quantity} ชิ้น
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-border/60">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditModal(item)}
                      className="flex-1 rounded-xl text-xs gap-1.5"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>แก้ไข</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {activeTab === "ACCOMMODATION" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {accommodationRows
              .filter((item: any) => (item.name || "").toLowerCase().includes(searchTerm.toLowerCase()))
              .map((item: any) => (
                <div
                  key={item.id}
                  className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-4"
                >
                  <div className="space-y-2">
                    <span className="rounded-full bg-forest-900/10 px-2.5 py-0.5 text-[10px] font-bold text-forest-900">
                      {item.province} · {item.district}
                    </span>
                    <h3 className="font-serif text-base font-bold text-foreground">
                      {item.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                    <div className="pt-2 border-t border-border/60">
                      <span className="font-serif text-base font-bold text-forest-900">
                        {item.min_price_per_night ? formatBaht(item.min_price_per_night) : "฿0"} / คืน
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-border/60">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditModal(item)}
                      className="flex-1 rounded-xl text-xs gap-1.5"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>แก้ไข</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {activeTab === "WELLNESS" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {wellnessRows
              .filter((item: any) => (item.title || item.name || "").toLowerCase().includes(searchTerm.toLowerCase()))
              .map((item: any) => (
                <div
                  key={item.id}
                  className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-4"
                >
                  <div className="space-y-2">
                    <span className="rounded-full bg-gold-500/20 px-2.5 py-0.5 text-[10px] font-bold text-gold-800">
                      {item.duration_minutes || 60} นาที
                    </span>
                    <h3 className="font-serif text-base font-bold text-foreground">
                      {item.title || item.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                    <div className="pt-2 border-t border-border/60">
                      <span className="font-serif text-base font-bold text-forest-900">
                        {formatBaht(item.price)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-border/60">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditModal(item)}
                      className="flex-1 rounded-xl text-xs gap-1.5"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>แก้ไข</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {activeTab === "FOOD" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {foodRows
              .filter((item: any) => (item.name || "").toLowerCase().includes(searchTerm.toLowerCase()))
              .map((item: any) => (
                <div
                  key={item.id}
                  className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-4"
                >
                  <div className="space-y-2">
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-900">
                      {item.wellness_category} · {item.calorie_estimate || 250} kcal
                    </span>
                    <h3 className="font-serif text-base font-bold text-foreground">
                      {item.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                    <div className="pt-2 border-t border-border/60">
                      <span className="font-serif text-base font-bold text-forest-900">
                        {formatBaht(item.price)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-border/60">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditModal(item)}
                      className="flex-1 rounded-xl text-xs gap-1.5"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>แก้ไข</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg space-y-5 rounded-3xl bg-card p-6 sm:p-8 shadow-2xl border border-border max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <h3 className="font-serif text-xl font-bold text-foreground flex items-center gap-2">
                <Package className="h-5 w-5 text-gold-600" />
                <span>{editingItem ? "แก้ไขรายการสินค้า/บริการ" : "เพิ่มรายการใหม่เข้าสู่ระบบ"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  ชื่อรายการ (Title / Name) *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="เช่น เสื้อยืดอัตลักษณ์ศรีสะเกษ..."
                  className="w-full rounded-xl border border-border bg-background px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-forest-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    ราคา (บาท) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="290"
                    className="w-full rounded-xl border border-border bg-background px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-forest-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    สต็อก / ความจุ *
                  </label>
                  <input
                    type="number"
                    required
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    placeholder="100"
                    className="w-full rounded-xl border border-border bg-background px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-forest-900"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  รายละเอียดสินค้า / บริการ
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="ระบุรายละเอียดของสินค้า วัสดุ อัตลักษณ์ และคุณสมบัติ..."
                  className="w-full rounded-xl border border-border bg-background p-3 text-xs focus:outline-none focus:ring-1 focus:ring-forest-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  สถานที่ / พื้นที่จัดส่ง (Location)
                </label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="อ.ขุนหาญ, จ.ศรีสะเกษ"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-forest-900"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-xl font-bold bg-forest-900 text-cream-100 hover:bg-forest-800 shadow-md flex items-center gap-1.5"
                >
                  <Save className="h-4 w-4" />
                  <span>บันทึกเข้าฐานข้อมูล</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
