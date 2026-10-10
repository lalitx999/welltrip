"use client";

import { useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Eye,
  FileText,
  Filter,
  Newspaper,
  Pencil,
  Plus,
  Save,
  Search,
  Sparkles,
  UploadCloud,
  X,
  MapPin,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";
import Link from "next/link";

import { AdminPagination } from "@/components/admin/AdminPagination";
import { ListError, ListLoading } from "@/components/catalog/DataStates";
import { Media } from "@/components/travel/Primitives";
import { useAuth } from "@/hooks/use-auth";
import { extractErrorMessage } from "@/lib/api/errors";
import {
  getAdminContent,
  saveContent,
  type ContentDraft,
  type ContentEntry,
} from "@/lib/api/experience";
import { useI18n } from "@/lib/i18n";

const empty: ContentDraft = {
  kind: "STORY",
  title: "",
  title_en: "",
  summary: "",
  summary_en: "",
  body: "",
  body_en: "",
  image_url: "",
  image_alt: "",
  location: "",
  starts_at: null,
  ends_at: null,
  is_published: false,
};

const kinds: Record<string, string> = {
  STORY: "ข่าวและกิจกรรม",
  COMMUNITY: "ชุมชนและผู้ให้บริการ",
  ATTRACTION: "สถานที่แนะนำ",
};

const sisaketDistricts = [
  "เมืองศรีสะเกษ",
  "กันทรลักษ์",
  "ขุนหาญ",
  "ภูสิงห์",
  "อุทุมพรพิสัย",
  "ราษีไศล",
  "ปรางค์กู่",
  "ขุขันธ์",
  "ห้วยทับทัน",
  "บึงบูรพ์",
  "ยางชุมน้อย",
];

export default function ContentAdminPage() {
  const { locale } = useI18n();
  const { user } = useAuth();
  const client = useQueryClient();
  const allowed =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "COMMUNITY_ADMIN" ||
    Boolean(user?.is_superuser);

  const [draft, setDraft] = useState<ContentDraft>(empty);
  const [editing, setEditing] = useState<string>();
  const [message, setMessage] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  // Detailed location breakdown
  const [locationName, setLocationName] = useState("");
  const [district, setDistrict] = useState("เมืองศรีสะเกษ");
  const [province] = useState("ศรีสะเกษ");
  const [landmark, setLandmark] = useState("");

  // Drag and drop image state
  const [imagePreview, setImagePreview] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [kindFilter, setKindFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const query = useQuery({
    queryKey: ["admin-content"],
    queryFn: getAdminContent,
    enabled: allowed,
  });

  const mutation = useMutation({
    mutationFn: () => {
      // Compose full location string
      const fullLocation = locationName
        ? `${locationName}, อ.${district}, จ.${province}${landmark ? ` (${landmark})` : ""}`
        : draft.location;

      return saveContent(
        {
          ...draft,
          location: fullLocation,
          image_url: imagePreview || draft.image_url,
        },
        editing
      );
    },
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["admin-content"] }),
        client.invalidateQueries({ queryKey: ["editorial"] }),
        client.invalidateQueries({ queryKey: ["editorial-detail"] }),
      ]);
      setMessage(draft.is_published ? "บันทึกและเผยแพร่แล้ว" : "บันทึกฉบับร่างแล้ว");
      setDraft(empty);
      setEditing(undefined);
      setImagePreview("");
      setFileName("");
      setFileSize("");
      setLocationName("");
      setLandmark("");
      setModalOpen(false);
    },
  });

  function edit(entry: ContentEntry) {
    const { id, updated_at, ...values } = entry;
    setEditing(id);
    setDraft(values);
    setImagePreview(values.image_url || "");
    setFileName(values.image_url ? "current-image.jpg" : "");
    setFileSize("");

    // Parse location if formatted
    if (values.location) {
      setLocationName(values.location.split(",")[0] || values.location);
    } else {
      setLocationName("");
    }
    setLandmark("");

    setMessage("");
    mutation.reset();
    setModalOpen(true);
  }

  function openCreateModal() {
    setEditing(undefined);
    setDraft(empty);
    setImagePreview("");
    setFileName("");
    setFileSize("");
    setLocationName("");
    setLandmark("");
    mutation.reset();
    setMessage("");
    setModalOpen(true);
  }

  function handleFileSelect(file: File) {
    if (!file) return;
    setFileName(file.name);
    setFileSize(`${(file.size / 1024).toFixed(1)} KB`);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      setDraft((prev) => ({ ...prev, image_url: result }));
    };
    reader.readAsDataURL(file);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    mutation.mutate();
  }

  if (!allowed) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500 font-medium">
        เฉพาะผู้ดูแลระบบสูงสุดเท่านั้น (Super Admin Only)
      </div>
    );
  }

  const allEntries = query.data ?? [];

  const filteredEntries = allEntries.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.summary && item.summary.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesKind = kindFilter === "ALL" || item.kind === kindFilter;
    return matchesSearch && matchesKind;
  });

  const paginatedEntries = filteredEntries.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 text-[#D97706] border border-[#D97706]/20">
              <Newspaper className="h-5 w-5" />
            </div>
            <h1 className="font-serif text-xl font-bold text-[#1B2A24]">
              {locale === "th" ? "จัดการเรื่องราวและคอนเทนต์" : "Content & Editorial Studio"}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {locale === "th"
              ? "จัดการเรื่องราว ข่าว กิจกรรม ชุมชน และสถานที่แนะนำบนแพลตฟอร์ม WellTrip"
              : "Manage stories, news, community features, and recommended attractions."}
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-[#1B2A24] text-white font-semibold text-xs hover:bg-[#151d1a] transition-all flex items-center justify-center gap-2 shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4 text-[#D97706]" />
          <span>สร้างเรื่องใหม่</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder={locale === "th" ? "ค้นหาชื่อบทความ หรือคำโปรย..." : "Search title or summary..."}
            className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-slate-200/80 rounded-xl text-xs font-semibold text-[#1B2A24] outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={kindFilter}
            onChange={(e) => {
              setKindFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-auto py-2.5 px-3 rounded-xl border border-slate-200/80 bg-[#FAF8F5] text-xs font-semibold text-[#1B2A24] outline-none cursor-pointer"
          >
            <option value="ALL">{locale === "th" ? "หมวดหมู่ทั้งหมด" : "All Kinds"}</option>
            <option value="STORY">ข่าวและกิจกรรม</option>
            <option value="COMMUNITY">ชุมชนและผู้ให้บริการ</option>
            <option value="ATTRACTION">สถานที่แนะนำ</option>
          </select>
        </div>
      </div>

      {/* Data Table View */}
      {query.isLoading ? (
        <ListLoading />
      ) : query.isError ? (
        <ListError
          message={extractErrorMessage(query.error, "ไม่สามารถดึงข้อมูลคอนเทนต์ได้")}
          onRetry={() => void query.refetch()}
        />
      ) : filteredEntries.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500 space-y-2">
          <Newspaper className="mx-auto h-10 w-10 text-slate-300" />
          <p className="text-base font-bold text-[#1B2A24]">ยังไม่มีเรื่องราวในระบบ</p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1B2A24] text-white text-xs font-bold"
          >
            <Plus className="w-4 h-4 text-[#D97706]" />
            <span>เริ่มสร้างเรื่องราวแรก</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200/80 bg-slate-50/80 font-bold text-[#1B2A24]">
                  <tr>
                    <th className="px-4 py-3.5">รูปปก</th>
                    <th className="px-4 py-3.5">ชื่อบทความ / คอนเทนต์</th>
                    <th className="px-4 py-3.5">หมวดหมู่</th>
                    <th className="px-4 py-3.5">สถานที่</th>
                    <th className="px-4 py-3.5">สถานะ</th>
                    <th className="px-4 py-3.5 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 relative">
                          <Media
                            src={entry.image_url}
                            alt={entry.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3.5 max-w-xs">
                        <p className="font-bold text-[#1B2A24] line-clamp-1">{entry.title}</p>
                        {entry.summary && (
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {entry.summary}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-[#D97706] border border-[#D97706]/30">
                          {kinds[entry.kind] ?? entry.kind}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 font-medium">
                        {entry.location ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            <span>{entry.location}</span>
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {entry.is_published ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-[11px]">
                            <Check className="h-3.5 w-3.5" />
                            <span>เผยแพร่แล้ว</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full text-[11px]">
                            <span>ฉบับร่าง</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/stories/${entry.id}`}
                            target="_blank"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                            title="ดูตัวอย่าง"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => edit(entry)}
                            className="px-3 py-1.5 rounded-xl bg-[#1B2A24] text-white text-xs font-semibold hover:bg-[#151d1a] transition-all flex items-center gap-1"
                          >
                            <Pencil className="w-3 h-3 text-[#D97706]" />
                            <span>แก้ไข</span>
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
            totalItems={filteredEntries.length}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={(newPerPage) => {
              setPerPage(newPerPage);
              setPage(1);
            }}
          />
        </div>
      )}

      {/* Center-Aligned Modal for Create/Edit Story */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#FAF8F5]">
              <div className="flex items-center gap-2 font-serif font-bold text-base text-[#1B2A24]">
                <FileText className="w-5 h-5 text-[#D97706]" />
                <h3>{editing ? "แก้ไขบทความ / คอนเทนต์" : "สร้างเนื้อหาเรื่องใหม่"}</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-[#1B2A24] hover:bg-slate-200/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={submit} className="p-6 space-y-5 text-xs max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block font-bold text-[#1B2A24] mb-1">ประเภทเนื้อหา</label>
                <select
                  value={draft.kind}
                  onChange={(e) =>
                    setDraft({ ...draft, kind: e.target.value as ContentDraft["kind"] })
                  }
                  className="w-full p-3 rounded-xl border border-slate-200 bg-[#FAF8F5] text-xs font-semibold outline-none"
                >
                  {Object.entries(kinds).map(([val, lbl]) => (
                    <option key={val} value={val}>
                      {lbl}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1B2A24] mb-1">ชื่อเรื่องภาษาไทย *</label>
                  <input
                    name="title"
                    required
                    maxLength={200}
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    placeholder="เช่น เที่ยวผามออีแดง สัมผัสทะเลหมอกศรีสะเกษ"
                    className="w-full p-3 rounded-xl border border-slate-200 bg-[#FAF8F5] text-xs font-semibold outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1B2A24] mb-1">ชื่อเรื่องภาษาอังกฤษ</label>
                  <input
                    maxLength={200}
                    value={draft.title_en}
                    onChange={(e) => setDraft({ ...draft, title_en: e.target.value })}
                    placeholder="Title in English..."
                    className="w-full p-3 rounded-xl border border-slate-200 bg-[#FAF8F5] text-xs font-semibold outline-none"
                  />
                </div>
              </div>

              {/* Drag & Drop File Upload Dropzone */}
              <div className="space-y-1">
                <label className="block font-bold text-[#1B2A24]">อัปโหลดรูปภาพปกบทความ</label>
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
                          {fileName || "รูปภาพบทความ"}
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
                        setDraft((prev) => ({ ...prev, image_url: "" }));
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
                      ลากและวางรูปภาพที่นี่ หรือ <span className="text-[#D97706] underline">คลิกเพื่อเลือกไฟล์</span>
                    </p>
                    <p className="text-[11px] text-slate-400">รองรับไฟล์ JPG, PNG, WEBP (สูงสุด 5MB)</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-[#1B2A24] mb-1">คำโปรยบทความ (Summary)</label>
                <textarea
                  rows={2}
                  value={draft.summary}
                  onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
                  placeholder="สรุปสั้นๆ สำหรับแสดงบนการ์ดบทความ..."
                  className="w-full p-3 rounded-xl border border-slate-200 bg-[#FAF8F5] text-xs outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1B2A24] mb-1">เนื้อหาฉบับเต็ม *</label>
                <textarea
                  required
                  rows={5}
                  value={draft.body}
                  onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                  placeholder="เขียนเนื้อหาหรือรายละเอียด..."
                  className="w-full p-3 rounded-xl border border-slate-200 bg-[#FAF8F5] text-xs outline-none font-sans"
                />
              </div>

              {/* Comprehensive Location Inputs */}
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-3">
                <div className="flex items-center gap-1.5 font-bold text-xs text-[#1B2A24]">
                  <MapPin className="w-4 h-4 text-[#D97706]" />
                  <span>ข้อมูลสถานที่และที่ตั้งบทความ</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      1. ชื่อสถานที่ / แหล่งท่องเที่ยว
                    </label>
                    <input
                      type="text"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      placeholder="เช่น ผามออีแดง, วัดป่ามหาเจดีย์แก้ว"
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      2. อำเภอ (อำเภอใน จ.ศรีสะเกษ)
                    </label>
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold outline-none cursor-pointer"
                    >
                      {sisaketDistricts.map((dist) => (
                        <option key={dist} value={dist}>
                          อ.{dist}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">3. จังหวัด</label>
                    <input
                      type="text"
                      readOnly
                      value={`จ.${province}`}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-500 outline-none cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      4. คำอธิบายการเดินทาง / จุดสังเกต
                    </label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="เช่น ใกล้ชายแดนไทย-กัมพูชา"
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={draft.is_published}
                  onChange={(e) => setDraft({ ...draft, is_published: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-[#1B2A24] focus:ring-0"
                />
                <label htmlFor="is_published" className="font-bold text-[#1B2A24] cursor-pointer">
                  เผยแพร่เรื่องนี้บนหน้าเว็บทันที (Publish)
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="w-1/3 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="w-2/3 py-3 px-4 rounded-xl bg-[#1B2A24] text-white font-semibold hover:bg-[#151d1a] shadow-sm flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4 text-[#D97706]" />
                  <span>{mutation.isPending ? "กำลังบันทึก..." : "บันทึกเนื้อหา"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
