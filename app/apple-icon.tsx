import { ImageResponse } from "next/og"
import { LumaIconArtwork } from "@/components/brand/luma-icon-artwork"

export const size = {
  width: 180,
  height: 180,
}

export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(<LumaIconArtwork stroke={8} />, size)
}
