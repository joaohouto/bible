import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ size: string }> },
) {
  const resolvedParams = await params;
  const size = parseInt(resolvedParams.size) || 192;
  const borderRadius = size * 0.5;

  return new ImageResponse(
    <div
      style={{
        width: size,
        height: size,
        borderRadius: borderRadius,
        background: "linear-gradient(145deg, #FDE047 0%, #D97706 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: `${size * 0.03}px solid #B45309`,
        boxShadow: `inset 0 2px ${size * 0.1}px rgba(255,255,255,0.8)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: size / 2,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 100%)",
          borderRadius: `${borderRadius}px ${borderRadius}px 0 0`,
        }}
      />
      <svg
        width={size * 0.5}
        height={size * 0.5}
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
    { width: size, height: size },
  );
}
