"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Save, CheckCircle2, AlertCircle } from "lucide-react";
import { updateOtopProduct, updateWellness } from "@/lib/api/vendor";
import { extractErrorMessage } from "@/lib/api/errors";
import { CatalogMultiImageUploader } from "./CatalogMultiImageUploader";

export function CatalogImageEditor({
  id,
  kind,
  image,
  title,
}: {
  id: string;
  kind: "otop" | "wellness";
  image?: string;
  title: string;
}) {
  const initialImages = image
    ? image.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const [imageList, setImageList] = useState<string[]>(initialImages);
  const client = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => {
      const primaryImage = imageList.length > 0 ? imageList[0] : "";
      const joinedImages = imageList.join(",");
      const payload = {
        image_url: primaryImage,
        gallery_images: joinedImages,
      };

      return kind === "otop"
        ? updateOtopProduct(id, payload)
        : updateWellness(id, payload);
    },
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: [kind] }),
        client.invalidateQueries({
          queryKey: [kind === "otop" ? "portal-otop" : "portal-services"],
        }),
        client.invalidateQueries({
          queryKey: [kind === "otop" ? "home-products" : "home-wellness"],
        }),
        client.invalidateQueries({ queryKey: ["wellness-slots", id] }),
      ]);
    },
  });

  return (
    <details className="mt-4 border-t border-[#193E30]/15 pt-3">
      <summary className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold text-[#193E30] hover:text-[#C5A059] transition-colors">
        <ImagePlus size={16} className="text-[#C5A059]" />
        จัดการรูปภาพ {title} (อัปโหลดหลายภาพ)
      </summary>

      <form
        className="mt-3 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <CatalogMultiImageUploader
          images={imageList}
          onChange={(newImages) => {
            setImageList(newImages);
            mutation.reset();
          }}
          maxImages={8}
          label={`รูปภาพสินค้า/บริการ: ${title}`}
          description="ลากวาง หรือเลือกไฟล์รูปภาพเพื่ออัปโหลด สามารถสลับรูปภาพหลักได้"
        />

        <button
          disabled={mutation.isPending}
          className="flex items-center gap-2 rounded-xl bg-[#193E30] px-4 py-2 text-sm font-semibold text-[#FAF8F1] shadow-xs hover:bg-[#193E30]/90 transition disabled:opacity-50"
          type="submit"
        >
          <Save size={16} />
          {mutation.isPending ? "กำลังบันทึก…" : "บันทึกภาพทั้งหมด"}
        </button>

        {mutation.isError && (
          <div role="alert" className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
            <AlertCircle size={14} />
            {extractErrorMessage(mutation.error, "บันทึกภาพไม่สำเร็จ")}
          </div>
        )}

        {mutation.isSuccess && (
          <div role="status" className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
            <CheckCircle2 size={14} />
            บันทึกชุดรูปภาพสำเร็จแล้ว
          </div>
        )}
      </form>
    </details>
  );
}
