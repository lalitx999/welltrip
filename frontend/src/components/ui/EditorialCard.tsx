"use client";

/**
 * EditorialCard.tsx - Reusable Community Eco-Premium Card Component.
 *
 * Theme: Mature Editorial Wellness Marketplace
 * High resolution photography container, refined typography, and Muted Gold accents.
 */
import { MapPin, Star } from "lucide-react";
import { Media } from "@/components/travel/Primitives";
import Link from "next/link";
import * as React from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface EditorialCardProps {
  id?: string;
  title: string;
  subtitle?: string;
  category?: string;
  location?: string;
  price?: string;
  priceUnit?: string;
  priceSuffix?: string;
  imageUrl?: string;
  href: string;
  rating?: number;
  badge?: string;
  badgeText?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export function EditorialCard({
  title,
  subtitle,
  category,
  location,
  price,
  priceUnit,
  priceSuffix = "",
  imageUrl,
  href,
  rating,
  badge,
  badgeText,
  actionText = "Explore",
  onAction,
  className,
}: EditorialCardProps) {
  const displayBadge = badgeText || badge;
  const displayLocation = location || subtitle;
  const displaySuffix = priceSuffix || priceUnit || "";

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-[#E8E4DD] bg-white transition-all duration-200 hover:-translate-y-1 hover:border-[#C5A059] hover:shadow-lg",
        className,
      )}
    >
      {/* Image Banner */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F4EFE6]">
        <Media src={imageUrl} alt={title} className="h-full !aspect-auto !rounded-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          {category ? (
            <span className="rounded-full bg-[#193E30]/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#FAF8F1] backdrop-blur-md">
              {category}
            </span>
          ) : <span />}

          {displayBadge && (
            <span className="rounded-full bg-[#C5A059] px-2.5 py-0.5 text-[10px] font-bold text-[#12291E] shadow-sm">
              {displayBadge}
            </span>
          )}
        </div>

        {/* Location snippet on image */}
        {displayLocation && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 text-xs font-medium text-[#FAF8F1]">
            <MapPin className="h-3.5 w-3.5 text-[#C5A059]" aria-hidden="true" />
            <span className="drop-shadow-xs">{displayLocation}</span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col justify-between p-4 space-y-3">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="line-clamp-1 text-base font-bold text-[#193E30] group-hover:text-[#C5A059] transition-colors">
              {title}
            </h3>
            {rating !== undefined && (
              <div className="flex items-center gap-1 shrink-0 text-xs font-bold text-[#26221F]">
                <Star className="h-3.5 w-3.5 fill-[#C5A059] text-[#C5A059]" aria-hidden="true" />
                <span>{rating}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Price & Action */}
        <div className="flex items-center justify-between border-t border-[#F4EFE6] pt-3">
          <div>
            {price && (
              <>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6E6862]">
                  Price
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-extrabold text-[#193E30]">
                    {price}
                  </span>
                  {displaySuffix && (
                    <span className="text-xs text-[#6E6862]">{displaySuffix}</span>
                  )}
                </div>
              </>
            )}
          </div>

          {onAction ? (
            <Button
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAction();
              }}
              className="bg-[#193E30] text-[#FAF8F1] hover:bg-[#C5A059] hover:text-[#12291E]"
            >
              {actionText}
            </Button>
          ) : (
            <Link href={href} className={buttonVariants({size: "sm"})}>{actionText}</Link>
          )}
        </div>
      </div>
    </div>
  );
}
