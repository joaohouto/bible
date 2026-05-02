import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 16, // Círculo perfeito
        background: "linear-gradient(145deg, #FDE047 0%, #D97706 100%)", // Dourado Premium
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid #B45309",
        boxShadow:
          "inset 0 1px 3px rgba(255,255,255,0.8), 0 2px 4px rgba(0,0,0,0.15)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 16,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 100%)",
          borderRadius: "16px 16px 0 0",
        }}
      />

      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="black"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    </div>,
    { ...size },
  );
}
