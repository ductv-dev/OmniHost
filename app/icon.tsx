import { ImageResponse } from "next/og"
import { LumaIconArtwork } from "@/components/brand/luma-icon-artwork"

export const size = {
  width: 512,
  height: 512,
}

export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(<LumaIconArtwork />, size)
}
