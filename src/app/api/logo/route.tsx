import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const variant = searchParams.get("variant") || "dark"; // "dark" = white BASE on transparent, "light" = dark BASE on transparent
  const size = parseInt(searchParams.get("size") || "200", 10);
  const tagline = searchParams.get("tagline") !== "false";

  // Fetch Permanent Marker font from Google Fonts
  const fontData = await fetch(
    "https://fonts.gstatic.com/s/permanentmarker/v16/Fh4uPib9Iyv2ucM6pGQMWimMp004HaqIfrT5nlk.ttf"
  ).then((res) => res.arrayBuffer());

  // Scale everything relative to the base size
  const fontSize = size;
  const width = Math.ceil(fontSize * 7.2);
  const height = Math.ceil(fontSize * (tagline ? 1.8 : 1.3));
  const taglineSize = Math.ceil(fontSize * 0.14);

  const baseColor = variant === "light" ? "#111827" : "#FFFFFF";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          padding: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: "Permanent Marker",
            fontSize: `${fontSize}px`,
            lineHeight: 1,
          }}
        >
          <span style={{ color: "#EF4444" }}>EXTRA</span>
          <span style={{ color: baseColor }}>BASE</span>
        </div>
        {tagline && (
          <div
            style={{
              display: "flex",
              fontSize: `${taglineSize}px`,
              color: variant === "light" ? "rgba(17,24,39,0.5)" : "rgba(255,255,255,0.6)",
              letterSpacing: "0.25em",
              marginTop: `${Math.ceil(fontSize * 0.12)}px`,
              fontWeight: 600,
            }}
          >
            College baseball recruiting, simplified.
          </div>
        )}
      </div>
    ),
    {
      width,
      height,
      fonts: [
        {
          name: "Permanent Marker",
          data: fontData,
          style: "normal",
        },
      ],
      // transparent background
      headers: {
        "Content-Disposition": `inline; filename="extrabase-logo.png"`,
        "Cache-Control": "public, max-age=86400",
      },
    }
  );
}
