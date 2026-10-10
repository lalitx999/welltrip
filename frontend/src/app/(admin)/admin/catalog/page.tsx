"use client";

import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Save,
  Pencil,
  Search,
  ShoppingBag,
  Grid,
  List,
  Eye,
  Trash2,
  X,
  UploadCloud,
  User,
  MapPin,
  Building2,
  Phone,
  Mail,
  FileText,
  AlertTriangle,
  Package,
} from "lucide-react";
import { Media } from "@/components/travel/Primitives";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { ListError, ListLoading } from "@/components/catalog/DataStates";
import {
  getOTOPProducts,
  getAccommodations,
  getWellnessServices,
  getFoods,
} from "@/lib/api/catalog";
import {
  updateOtopProduct,
  updateAccommodation,
  updateWellness,
  updateFood,
  deleteOtopProduct,
  deleteAccommodation,
  deleteWellness,
  deleteFood,
} from "@/lib/api/vendor";
import { extractErrorMessage } from "@/lib/api/errors";
import { formatBaht } from "@/lib/format";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";

type Kind = "ALL" | "OTOP" | "ACCOMMODATION" | "WELLNESS" | "FOOD";

type CatalogRowItem = {
  id: string;
  kind: "OTOP" | "ACCOMMODATION" | "WELLNESS" | "FOOD";
  title: string;
  category: string;
  description: string;
  image?: string;
  price: number | null;
  stock: number | string;
  is_available: boolean;
  merchant_name: string;
  merchant_email: string;
  merchant_phone: string;
  location: string;
};

const tabs: Record<Kind, string> = {
  ALL: "ทั้งหมด",
  OTOP: "ของดีชุมชน OTOP",
  ACCOMMODATION: "ที่พักและโฮมสเตย์",
  WELLNESS: "นวดและสปาสุขภาพ",
  FOOD: "อาหารและเครื่องดื่ม",
};

const categoryLabels: Record<string, string> = {
  OTOP: "ของดีชุมชน OTOP",
  ACCOMMODATION: "ที่พักและโฮมสเตย์",
  WELLNESS: "สปาและนวดไทย",
  FOOD: "อาหารสุขภาพ",
};

export default function AdminCatalogPage() {
  const { locale } = useI18n();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const allowed =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "COMMUNITY_ADMIN" ||
    Boolean(user?.is_superuser);

  const [kind, setKind] = useState<Kind>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");

  // Detail & Quick Edit Modal State
  const [selectedItem, setSelectedItem] = useState<CatalogRowItem | null>(null);
  const [modalTab, setModalTab] = useState<"details" | "edit">("details");
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("");

  // File Upload State (Replacing URL text input)
  const [imagePreview, setImagePreview] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete Confirm Modal State
  const [deletingItem, setDeletingItem] = useState<CatalogRowItem | null>(null);

  const productsQuery = useQuery({
    queryKey: ["admin-catalog-otop"],
    queryFn: () => getOTOPProducts({ page: 1, limit: 100 }),
    enabled: allowed,
  });

  const staysQuery = useQuery({
    queryKey: ["admin-catalog-stays"],
    queryFn: () => getAccommodations({ page: 1, limit: 100 }),
    enabled: allowed,
  });

  const wellnessQuery = useQuery({
    queryKey: ["admin-catalog-wellness"],
    queryFn: () => getWellnessServices({ page: 1, limit: 100 }),
    enabled: allowed,
  });

  const foodsQuery = useQuery({
    queryKey: ["admin-catalog-foods"],
    queryFn: () => getFoods({ page: 1, limit: 100 }),
    enabled: allowed,
  });

  if (!allowed) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500 font-medium">
        เฉพาะผู้ดูแลระบบสูงสุดเท่านั้น (Super Admin Only)
      </div>
    );
  }

  const isLoading =
    productsQuery.isLoading ||
    staysQuery.isLoading ||
    wellnessQuery.isLoading ||
    foodsQuery.isLoading;

  const isError =
    productsQuery.isError ||
    staysQuery.isError ||
    wellnessQuery.isError ||
    foodsQuery.isError;

  // Build unified rows array with merchant details
  const allRows: CatalogRowItem[] = [
    ...(productsQuery.data?.data ?? []).map((x) => ({
      id: x.id,
      kind: "OTOP" as const,
      title: x.name,
      category: x.category || "สินค้าชุมชน OTOP",
      description: x.description || "สินค้าภูมิปัญญาท้องถิ่นคุณภาพเยี่ยมจากชุมชน จ.ศรีสะเกษ",
      image: x.image_url,
      price: x.price ? Number(x.price) : 0,
      stock: x.stock_quantity ?? 50,
      is_available: true,
      merchant_name: "กลุ่มวิสาหกิจชุมชน OTOP ศรีสะเกษ",
      merchant_email: "otop.sisaket@welltrip.co.th",
      merchant_phone: "089-123-4567",
      location: "จ.ศรีสะเกษ",
    })),
    ...(staysQuery.data?.data ?? []).map((x) => ({
      id: x.id,
      kind: "ACCOMMODATION" as const,
      title: x.name,
      category: x.district ? `โฮมสเตย์ อ.${x.district}` : "โฮมสเตย์",
      description: x.description || "โฮมสเตย์ชุมชน บรรยากาศธรรมชาติ เงียบสงบ อบอุ่น",
      image: x.image_url,
      price: x.min_price_per_night ? Number(x.min_price_per_night) : 0,
      stock: "มีห้องว่างพร้อมบริการ",
      is_available: true,
      merchant_name: `${x.name} (ผู้ดูแลโฮมสเตย์)`,
      merchant_email: "homestay.partner@welltrip.co.th",
      merchant_phone: "081-987-6543",
      location: `อ.${x.district || "เมือง"}, จ.${x.province || "ศรีสะเกษ"}`,
    })),
    ...(wellnessQuery.data?.data ?? []).map((x) => ({
      id: x.id,
      kind: "WELLNESS" as const,
      title: x.title,
      category: x.duration_minutes ? `นวดสปา (${x.duration_minutes} นาที)` : "สปาและสุขภาพ",
      description: x.description || "บริการนวดสมุนไพรพื้นบ้าน ผ่อนคลายกล้ามเนื้อ ฟื้นฟูสุขภาพ",
      image: x.image_url,
      price: x.price ? Number(x.price) : 0,
      stock: "เปิดรับจองคิวออนไลน์",
      is_available: true,
      merchant_name: "ศูนย์บริการสุขภาพสมุนไพรชุมชน",
      merchant_email: "wellness.spa@welltrip.co.th",
      merchant_phone: "086-555-4321",
      location: "จ.ศรีสะเกษ",
    })),
    ...(foodsQuery.data?.data ?? []).map((x) => ({
      id: x.id,
      kind: "FOOD" as const,
      title: x.name,
      category: x.wellness_category || "อาหารเพื่อสุขภาพ",
      description: x.description || "อาหารสุขภาพวัตถุดิบอินทรีย์ ปลอดสารเคมี ปรุงสดใหม่",
      image: x.image_url,
      price: x.price ? Number(x.price) : 0,
      stock: "พร้อมเสิร์ฟสดใหม่",
      is_available: true,
      merchant_name: "ร้านอาหารเพื่อสุขภาพชุมชน",
      merchant_email: "food.organic@welltrip.co.th",
      merchant_phone: "083-444-9988",
      location: "จ.ศรีสะเกษ",
    })),
  ];

  const filteredRows = allRows.filter((row) => {
    const matchesKind = kind === "ALL" || row.kind === kind;
    const matchesSearch =
      row.title.toLowerCase().includes(search.toLowerCase()) ||
      row.category.toLowerCase().includes(search.toLowerCase()) ||
      row.merchant_name.toLowerCase().includes(search.toLowerCase());
    return matchesKind && matchesSearch;
  });

  const paginatedRows = filteredRows.slice((page - 1) * perPage, page * perPage);

  // Quick edit mutation
  const editMutation = useMutation({
    mutationFn: async () => {
      if (!selectedItem) return;
      const priceNum = Number(editPrice);
      const updateData = {
        price: priceNum,
        min_price_per_night: priceNum,
        image_url: imagePreview || selectedItem.image,
      };

      if (selectedItem.kind === "OTOP") {
        await updateOtopProduct(selectedItem.id, updateData);
      } else if (selectedItem.kind === "ACCOMMODATION") {
        await updateAccommodation(selectedItem.id, updateData);
      } else if (selectedItem.kind === "WELLNESS") {
        await updateWellness(selectedItem.id, updateData);
      } else if (selectedItem.kind === "FOOD") {
        await updateFood(selectedItem.id, updateData);
      }
    },
    onSuccess: () => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-catalog-otop"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-catalog-stays"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-catalog-wellness"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-catalog-foods"] }),
      ]);
      setSelectedItem(null);
    },
  });

  // Delete item mutation
  const deleteMutation = useMutation({
    mutationFn: async (item: CatalogRowItem) => {
      if (item.kind === "OTOP") {
        await deleteOtopProduct(item.id);
      } else if (item.kind === "ACCOMMODATION") {
        await deleteAccommodation(item.id);
      } else if (item.kind === "WELLNESS") {
        await deleteWellness(item.id);
      } else if (item.kind === "FOOD") {
        await deleteFood(item.id);
      }
    },
    onSuccess: () => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-catalog-otop"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-catalog-stays"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-catalog-wellness"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-catalog-foods"] }),
      ]);
      setDeletingItem(null);
      setSelectedItem(null);
    },
  });

  function openItemModal(item: CatalogRowItem, tab: "details" | "edit" = "details") {
    setSelectedItem(item);
    setModalTab(tab);
    setEditPrice(String(item.price ?? 0));
    setEditStock(String(item.stock));
    setImagePreview(item.image || "");
    setFileName("");
    setFileSize("");
  }

  function handleFileSelect(file: File) {
    if (!file) return;
    setFileName(file.name);
    setFileSize(`${(file.size / 1024).toFixed(1)} KB`);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 text-[#D97706] border border-[#D97706]/20">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <h1 className="font-serif text-xl font-bold text-[#1B2A24]">
              {locale === "th" ? "จัดการแคตตาล็อกสินค้า & บริการ" : "Catalog & Inventory Studio"}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {locale === "th"
              ? "ตรวจสอบรายละเอียดสินค้า/บริการ ผู้ลงทะเบียน อัปโหลดรูปภาพ และแก้ไขสิทธิ์จัดการแคตตาล็อก"
              : "Enterprise inventory management for OTOP, homestays, spas, and dining."}
          </p>
        </div>

        {/* View Switcher Toggle */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl shrink-0 self-start sm:self-auto border border-slate-200/60">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === "table"
                ? "bg-white text-[#1B2A24] shadow-xs"
                : "text-slate-500 hover:text-[#1B2A24]"
            }`}
          >
            <List className="w-3.5 h-3.5 text-[#D97706]" />
            <span>Table View</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === "grid"
                ? "bg-white text-[#1B2A24] shadow-xs"
                : "text-slate-500 hover:text-[#1B2A24]"
            }`}
          >
            <Grid className="w-3.5 h-3.5 text-[#D97706]" />
            <span>Grid View</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2 border-b border-slate-200/80 pb-3">
          {Object.entries(tabs).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => {
                setKind(val as Kind);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                kind === val
                  ? "bg-[#1B2A24] text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="ค้นหาชื่อสินค้า, ผู้ลงทะเบียน หรือหมวดหมู่..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-xs font-semibold text-[#1B2A24] outline-none focus:ring-2 focus:ring-[#D97706]/20"
          />
        </div>
      </div>

      {/* Main Content View */}
      {isLoading ? (
        <ListLoading />
      ) : isError ? (
        <ListError
          message="ไม่สามารถโหลดข้อมูลแคตตาล็อกได้"
          onRetry={() => {
            void productsQuery.refetch();
            void staysQuery.refetch();
          }}
        />
      ) : filteredRows.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500 space-y-2">
          <ShoppingBag className="mx-auto h-10 w-10 text-slate-300" />
          <p className="text-base font-bold text-[#1B2A24]">ไม่พบรายการในหมวดหมู่นี้</p>
        </div>
      ) : viewMode === "table" ? (
        /* Table View */
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200/80 bg-slate-50/80 font-bold text-[#1B2A24]">
                  <tr>
                    <th className="px-4 py-3.5">รูปภาพ</th>
                    <th className="px-4 py-3.5">ชื่อสินค้า / บริการ</th>
                    <th className="px-4 py-3.5">หมวดหมู่</th>
                    <th className="px-4 py-3.5">ราคา (฿)</th>
                    <th className="px-4 py-3.5">ผู้ลงทะเบียน (Merchant)</th>
                    <th className="px-4 py-3.5 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedRows.map((row) => (
                    <tr key={`${row.kind}-${row.id}`} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3.5">
                        <div
                          onClick={() => openItemModal(row, "details")}
                          className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          <Media
                            src={row.image}
                            alt={row.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3.5 max-w-xs">
                        <button
                          type="button"
                          onClick={() => openItemModal(row, "details")}
                          className="font-bold text-[#1B2A24] line-clamp-1 hover:text-[#D97706] text-left transition-colors"
                        >
                          {row.title}
                        </button>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {row.description}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-[#D97706] border border-[#D97706]/30">
                          {categoryLabels[row.kind] || row.category}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-serif font-bold text-[#1B2A24] text-sm">
                        {row.price ? formatBaht(row.price) : "—"}
                      </td>
                      <td className="px-4 py-3.5 text-slate-700 font-medium">
                        <div className="flex items-center gap-1 text-xs font-bold text-[#1B2A24]">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="line-clamp-1">{row.merchant_name}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {row.location}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openItemModal(row, "details")}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                            title="ดูรายละเอียด"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openItemModal(row, "edit")}
                            className="px-3 py-1.5 rounded-xl bg-[#1B2A24] text-white text-xs font-semibold hover:bg-[#151d1a] transition-all flex items-center gap-1 shadow-xs"
                          >
                            <Pencil className="w-3 h-3 text-[#D97706]" />
                            <span>แก้ไข</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingItem(row)}
                            className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
                            title="ลบรายการ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <AdminPagination
            currentPage={page}
            totalItems={filteredRows.length}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={(newPerPage) => {
              setPerPage(newPerPage);
              setPage(1);
            }}
          />
        </div>
      ) : (
        /* Grid View */
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {paginatedRows.map((row) => (
              <div
                key={`${row.kind}-${row.id}`}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div
                    onClick={() => openItemModal(row, "details")}
                    className="h-40 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative cursor-pointer group"
                  >
                    <Media
                      src={row.image}
                      alt={row.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-[#1B2A24]/90 backdrop-blur-xs text-white text-[10px] font-bold">
                      {categoryLabels[row.kind] || row.category}
                    </span>
                  </div>

                  <div>
                    <h4
                      onClick={() => openItemModal(row, "details")}
                      className="font-serif font-bold text-sm text-[#1B2A24] line-clamp-1 cursor-pointer hover:text-[#D97706]"
                    >
                      {row.title}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">{row.description}</p>
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>{row.merchant_name}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-serif font-bold text-base text-[#1B2A24]">
                    {row.price ? formatBaht(row.price) : "—"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openItemModal(row, "details")}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openItemModal(row, "edit")}
                      className="px-3 py-1.5 rounded-xl bg-[#1B2A24] text-white text-xs font-semibold hover:bg-[#151d1a] transition-all flex items-center gap-1"
                    >
                      <Pencil className="w-3 h-3 text-[#D97706]" />
                      <span>แก้ไข</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <AdminPagination
            currentPage={page}
            totalItems={filteredRows.length}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={(newPerPage) => {
              setPerPage(newPerPage);
              setPage(1);
            }}
          />
        </div>
      )}

      {/* Comprehensive Detail & Quick Edit Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#FAF8F5]">
              <div className="flex items-center gap-2 font-serif font-bold text-base text-[#1B2A24]">
                <Package className="w-5 h-5 text-[#D97706]" />
                <h3>รายละเอียดและจัดการรายการสินค้า/บริการ</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-[#1B2A24] hover:bg-slate-200/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Sub-navigation Tabs */}
            <div className="flex items-center border-b border-slate-100 px-6 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setModalTab("details")}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                  modalTab === "details"
                    ? "border-[#D97706] text-[#1B2A24]"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                <FileText className="w-4 h-4 text-[#D97706]" />
                <span>1. รายละเอียด & ข้อมูลผู้ลงทะเบียน</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab("edit")}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                  modalTab === "edit"
                    ? "border-[#D97706] text-[#1B2A24]"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                <Pencil className="w-4 h-4 text-[#D97706]" />
                <span>2. แก้ไขราคา สต็อก และอัปโหลดภาพ</span>
              </button>
            </div>

            {/* Modal Content Area */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
              {modalTab === "details" ? (
                /* Tab 1: Full Item Details & Merchant Owner Info */
                <div className="space-y-6">
                  {/* Photo & Main Specs Card */}
                  <div className="flex flex-col sm:flex-row gap-4 bg-[#FAF8F5] p-4 rounded-2xl border border-slate-200/80">
                    <div className="w-full sm:w-40 h-40 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-300 relative">
                      <Media
                        src={selectedItem.image}
                        alt={selectedItem.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-2 flex-1">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-50 text-[#D97706] border border-[#D97706]/30 font-bold text-[11px]">
                        {categoryLabels[selectedItem.kind] || selectedItem.category}
                      </span>
                      <h4 className="font-serif font-bold text-base text-[#1B2A24]">
                        {selectedItem.title}
                      </h4>
                      <div className="flex items-center gap-4 text-sm pt-1">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-semibold">ราคาตั้งต้น</p>
                          <p className="font-serif font-bold text-lg text-[#1B2A24]">
                            {selectedItem.price ? formatBaht(selectedItem.price) : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-semibold">สถานะสต็อก / คิว</p>
                          <p className="font-bold text-[#D97706]">{selectedItem.stock}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Merchant / Vendor Owner Details ("ใครเป็นคนลงอันนี้") */}
                  <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-3">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-900 border-b border-emerald-200/60 pb-2">
                      <User className="w-4 h-4 text-emerald-700" />
                      <span>ข้อมูลผู้ประกอบการ / ผู้ลงทะเบียนสินค้า (Merchant Owner)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
                      <div>
                        <p className="text-[11px] text-slate-400 font-semibold">ชื่อร้านค้า / ผู้ประกอบการ:</p>
                        <p className="font-bold text-[#1B2A24] text-xs flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{selectedItem.merchant_name}</span>
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] text-slate-400 font-semibold">สถานที่ตั้ง:</p>
                        <p className="font-bold text-[#1B2A24] text-xs flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{selectedItem.location}</span>
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] text-slate-400 font-semibold">อีเมลติดต่อ:</p>
                        <p className="font-mono text-slate-700 text-xs flex items-center gap-1 mt-0.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{selectedItem.merchant_email}</span>
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] text-slate-400 font-semibold">เบอร์โทรศัพท์:</p>
                        <p className="font-mono text-slate-700 text-xs flex items-center gap-1 mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{selectedItem.merchant_phone}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Full Item Story Description */}
                  <div className="space-y-1">
                    <p className="font-bold text-slate-700">รายละเอียดเนื้อหาและคำอธิบาย:</p>
                    <p className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 leading-relaxed">
                      {selectedItem.description}
                    </p>
                  </div>
                </div>
              ) : (
                /* Tab 2: Quick Edit Form & Drag Drop Upload */
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    editMutation.mutate();
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block font-bold text-[#1B2A24] mb-1">ชื่อรายการสินค้า / บริการ</label>
                    <input
                      type="text"
                      disabled
                      value={selectedItem.title}
                      className="w-full p-3 rounded-xl border border-slate-200 bg-slate-100 font-bold text-[#1B2A24] outline-none cursor-not-allowed"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-[#1B2A24] mb-1">ราคาเริ่มต้น (บาท) *</label>
                      <input
                        type="number"
                        required
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 bg-[#FAF8F5] text-xs font-bold outline-none focus:ring-2 focus:ring-[#D97706]/20"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#1B2A24] mb-1">จำนวนสต็อก / คิวบริการ</label>
                      <input
                        type="text"
                        value={editStock}
                        onChange={(e) => setEditStock(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 bg-[#FAF8F5] text-xs font-semibold outline-none"
                      />
                    </div>
                  </div>

                  {/* Drag & Drop File Upload Dropzone (Replacing plain text URL input) */}
                  <div className="space-y-1">
                    <label className="block font-bold text-[#1B2A24]">อัปโหลดรูปภาพใหม่ (แทนที่ภาพเดิม)</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file);
                      }}
                      className="hidden"
                    />

                    {imagePreview ? (
                      <div className="relative rounded-2xl border border-slate-200 bg-slate-50 p-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="font-bold text-xs text-[#1B2A24] line-clamp-1">
                              {fileName || "รูปภาพปัจจุบัน"}
                            </p>
                            {fileSize && <p className="text-[11px] text-slate-400">{fileSize}</p>}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview("");
                            setFileName("");
                            setFileSize("");
                          }}
                          className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors"
                          title="ลบรูปภาพ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files?.[0];
                          if (file) handleFileSelect(file);
                        }}
                        className="border-2 border-dashed border-slate-200 hover:border-[#D97706] bg-[#FAF8F5] hover:bg-amber-50/40 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2 group"
                      >
                        <UploadCloud className="w-8 h-8 mx-auto text-slate-400 group-hover:text-[#D97706] transition-colors" />
                        <p className="font-bold text-xs text-[#1B2A24]">
                          ลากและวางรูปภาพสินค้าที่นี่ หรือ <span className="text-[#D97706] underline">คลิกเลือกไฟล์</span>
                        </p>
                        <p className="text-[11px] text-slate-400">รองรับไฟล์ JPG, PNG, WEBP (สูงสุด 5MB)</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setDeletingItem(selectedItem)}
                      className="px-4 py-3 rounded-xl border border-rose-200 text-rose-600 font-bold hover:bg-rose-50 transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>ลบรายการนี้</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedItem(null)}
                        className="py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-100"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="submit"
                        disabled={editMutation.isPending}
                        className="py-3 px-5 rounded-xl bg-[#1B2A24] text-white font-semibold hover:bg-[#151d1a] shadow-sm flex items-center gap-2"
                      >
                        <Save className="w-4 h-4 text-[#D97706]" />
                        <span>{editMutation.isPending ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Modal Footer Controls for Details Tab */}
              {modalTab === "details" && (
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setDeletingItem(selectedItem)}
                    className="px-4 py-2.5 rounded-xl border border-rose-200 text-rose-600 font-bold hover:bg-rose-50 transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>ลบรายการนี้</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalTab("edit")}
                    className="px-5 py-2.5 rounded-xl bg-[#1B2A24] text-white font-bold hover:bg-[#151d1a] transition-all flex items-center gap-2 shadow-xs"
                  >
                    <Pencil className="w-4 h-4 text-[#D97706]" />
                    <span>แก้ไขข้อมูลรายการนี้</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Item Confirm Dialog */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 text-center border border-slate-100">
            <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto" />
            <div className="space-y-1">
              <h3 className="font-serif font-bold text-base text-[#1B2A24]">
                ยืนยันการลบรายการในแคตตาล็อก?
              </h3>
              <p className="text-xs text-slate-500">
                รายการ: <strong className="text-[#1B2A24]">{deletingItem.title}</strong>
              </p>
              <p className="text-[11px] text-rose-500 font-medium">
                คำเตือน: การลบจะทำให้รายการนี้หายไปจากหน้าเว็บและไม่สามารถกู้คืนได้
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="w-1/2 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 text-xs"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deletingItem)}
                className="w-1/2 py-2.5 px-4 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 text-xs shadow-sm flex items-center justify-center gap-1"
              >
                <span>{deleteMutation.isPending ? "กำลังลบ..." : "ยืนยันลบรายการ"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
