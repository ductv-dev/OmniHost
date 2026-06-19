import { ImageResponse } from "next/og"

export const size = {
  width: 512,
  height: 512,
}

export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#09090b",
        }}
      >
        {/* House shape via clip-path polygon */}
        <div
          style={{
            width: "62%",
            height: "62%",
            background: "#fafafa",
            clipPath:
              "polygon(50% 0%, 100% 40%, 83% 40%, 83% 100%, 64% 100%, 64% 61%, 36% 61%, 36% 100%, 17% 100%, 17% 40%, 0% 40%)",
          }}
        />
      </div>
    ),
    size
  )
}
