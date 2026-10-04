"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import { UploadCloud, Trash2, Star, ArrowLeft, ArrowRight, Image as ImageIcon, Link as LinkIcon, Loader2 } from "lucide-react";
import { Media } from "./Primitives";
import { apiClient } from "@/lib/api-client";
import type { ApiSuccess } from "@/types/api";

interface CatalogMultiImageUploaderProps {
  images: string[];
  onChange: (newImages: string[]) => void;
  maxImages?: number;
  label?: string;
  description?: string;
}

export function CatalogMultiImageUploader({
  images,
  onChange,
  maxImages = 8,
  label = "การจัดการรูปภาพสินค้า/บริการ (อัปโหลดหลายภาพ)",
  description = "ลากและวางไฟล์รูปภาพ หรือกดเลือกไฟล์เพื่ออัปโหลด สามารถจัดลำดับและตั้งภาพหลักได้",
}: CatalogMultiImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [showUrlField, setShowUrlField] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileList = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (fileList.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      fileList.forEach((file) => {
        formData.append("files", file);
      });

      const res = await apiClient.postForm<ApiSuccess<{
        url: string;
        relative_url: string;
        items: Array<{ relative_url: string; url: string }>;
      }>>("/api/v1/media/upload/", formData);

      const items = res.data.data?.items ?? [];
      const uploadedUrls = items.map((it) => it.url || it.relative_url);

      if (uploadedUrls.length > 0) {
        onChange([...images, ...uploadedUrls].slice(0, maxImages));
      } else {
        // Fallback to Data URL if backend returned empty array
        fileList.forEach((file) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              const b64 = e.target.result as string;
              onChange([...images, b64].slice(0, maxImages));
            }
          };
          reader.readAsDataURL(file);
        });
      }
    } catch (err: unknown) {
      console.warn("Direct upload failed, using FileReader fallback:", err);
      // Fallback: If upload endpoint fails, convert to base64 as fallback
      fileList.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            const b64 = e.target.result as string;
            onChange([...images, b64].slice(0, maxImages));
          }
        };
        reader.readAsDataURL(file);
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleAddUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (images.length >= maxImages) return;
    onChange([...images, trimmed]);
    setUrlInput("");
    setShowUrlField(false);
  };

  const handleRemoveImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleSetPrimary = (index: number) => {
    if (index === 0) return;
    const target = images[index];
    const remaining = images.filter((_, i) => i !== index);
    onChange([target, ...remaining]);
  };

  const handleMove = (index: number, direction: "left" | "right") => {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    const nextImages = [...images];
    const temp = nextImages[index];
    nextImages[index] = nextImages[targetIndex];
    nextImages[targetIndex] = temp;
    onChange(nextImages);
  };

  return (
    <div className="space-y-4 rounded-xl border border-[#193E30]/20 bg-[#FAF8F1] p-4 text-[#193E30] shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#193E30]/10 pb-3">
        <div>
          <h4 className="font-semibold text-base flex items-center gap-2 text-[#193E30]">
            <ImageIcon size={18} className="text-[#C5A059]" />
            {label}
          </h4>
          <p className="text-xs text-[#193E30]/70 mt-0.5">{description}</p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-[#193E30]/10 text-[#193E30] font-medium self-start sm:self-auto">
          {images.length} / {maxImages} ภาพ
        </span>
      </div>

      {/* Drag and Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-all cursor-pointer ${
          isUploading
            ? "border-[#193E30]/50 bg-[#193E30]/5 pointer-events-none"
            : isDragging
            ? "border-[#193E30] bg-[#193E30]/10 scale-[0.99]"
            : "border-[#193E30]/30 bg-white/70 hover:border-[#193E30] hover:bg-white"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#193E30]/10 text-[#193E30] mb-2">
          {isUploading ? (
            <Loader2 size={24} className="animate-spin text-[#193E30]" />
          ) : (
            <UploadCloud size={24} />
          )}
        </div>
        <p className="text-sm font-medium text-[#193E30]">
          {isUploading
            ? "กำลังอัปโหลดไฟล์รูปภาพเข้าสู่เซิร์ฟเวอร์..."
            : "คลิกเพื่อเลือกไฟล์รูปภาพหลายภาพ หรือลากรูปมาวางที่นี่"}
        </p>
        <p className="text-xs text-[#193E30]/60 mt-1">
          รองรับไฟล์ JPG, PNG, WEBP (เลือกได้สูงสุด {maxImages} รูป)
        </p>
      </div>

      {uploadError && (
        <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
          {uploadError}
        </div>
      )}

      {/* URL Fallback Input toggle */}
      <div className="flex items-center justify-between text-xs pt-1">
        <button
          type="button"
          onClick={() => setShowUrlField(!showUrlField)}
          className="flex items-center gap-1.5 text-[#C5A059] hover:underline font-medium"
        >
          <LinkIcon size={14} />
          {showUrlField ? "ซ่อนช่องใส่ URL" : "+ หรือเพิ่มรูปภาพจาก URL"}
        </button>
      </div>

      {showUrlField && (
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="https://example.com/image.jpg"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="flex-1 rounded-lg border border-[#193E30]/30 bg-white px-3 py-1.5 text-sm outline-none focus:border-[#193E30]"
          />
          <button
            type="button"
            onClick={handleAddUrl}
            className="rounded-lg bg-[#193E30] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#193E30]/90 transition"
          >
            เพิ่ม URL
          </button>
        </div>
      )}

      {/* Preview Gallery Grid */}
      {images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
          {images.map((img, idx) => (
            <div
              key={`${img.slice(0, 30)}-${idx}`}
              className={`group relative flex flex-col rounded-lg border bg-white overflow-hidden shadow-xs transition-all ${
                idx === 0
                  ? "border-[#C5A059] ring-2 ring-[#C5A059]/40"
                  : "border-[#193E30]/20 hover:border-[#193E30]/50"
              }`}
            >
              {/* Image Preview container */}
              <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
                <Media src={img} alt={`Catalog Image ${idx + 1}`} />

                {/* Primary Cover Badge */}
                {idx === 0 && (
                  <span className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-[#193E30] px-2 py-0.5 text-[10px] font-bold text-[#FAF8F1] shadow-xs">
                    <Star size={10} className="fill-[#C5A059] text-[#C5A059]" />
                    ภาพหลัก
                  </span>
                )}

                {/* Action Buttons overlay */}
                <div className="absolute inset-0 bg-[#193E30]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                  {idx !== 0 && (
                    <button
                      type="button"
                      title="ตั้งเป็นภาพหลัก"
                      onClick={() => handleSetPrimary(idx)}
                      className="rounded bg-[#C5A059] p-1.5 text-white hover:bg-[#C5A059]/90 transition shadow-xs"
                    >
                      <Star size={14} className="fill-white" />
                    </button>
                  )}
                  {idx > 0 && (
                    <button
                      type="button"
                      title="ย้ายไปทางซ้าย"
                      onClick={() => handleMove(idx, "left")}
                      className="rounded bg-white/90 p-1.5 text-[#193E30] hover:bg-white transition shadow-xs"
                    >
                      <ArrowLeft size={14} />
                    </button>
                  )}
                  {idx < images.length - 1 && (
                    <button
                      type="button"
                      title="ย้ายไปทางขวา"
                      onClick={() => handleMove(idx, "right")}
                      className="rounded bg-white/90 p-1.5 text-[#193E30] hover:bg-white transition shadow-xs"
                    >
                      <ArrowRight size={14} />
                    </button>
                  )}
                  <button
                    type="button"
                    title="ลบรูปภาพ"
                    onClick={() => handleRemoveImage(idx)}
                    className="rounded bg-red-600 p-1.5 text-white hover:bg-red-700 transition shadow-xs"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Card Footer status */}
              <div className="p-1.5 flex items-center justify-between text-[11px] text-[#193E30]/70 bg-[#FAF8F1]/50 border-t border-[#193E30]/10">
                <span className="truncate">รูปที่ {idx + 1}</span>
                {idx !== 0 && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(idx)}
                    className="text-[#C5A059] hover:underline text-[10px] font-medium"
                  >
                    ตั้งเป็นภาพหลัก
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-xs text-[#193E30]/50 italic">
          ยังไม่ได้เพิ่มรูปภาพสำหรับรายการนี้
        </div>
      )}
    </div>
  );
}
