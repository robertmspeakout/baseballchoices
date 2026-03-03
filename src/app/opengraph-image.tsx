import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ExtraBase - College Baseball Recruiting Directory";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  const fontData = await fetch(
    new URL("../../public/fonts/PermanentMarker-Regular.woff", import.meta.url)
  ).then((res) => res.arrayBuffer());

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
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
          padding: "60px",
        }}
      >
        {/* Red accent line at top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "6px",
            background: "linear-gradient(to right, #b91c1c, #ef4444, #b91c1c)",
            display: "flex",
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: "flex",
            fontFamily: "Permanent Marker",
            fontSize: "120px",
            lineHeight: 1,
          }}
        >
          <span style={{ color: "#EF4444" }}>EXTRA</span>
          <span style={{ color: "#FFFFFF" }}>BASE</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            display: "flex",
            fontSize: "22px",
            color: "rgba(255,255,255,0.5)",
            letterSpacing: "0.3em",
            marginTop: "24px",
            fontWeight: 600,
          }}
        >
          COLLEGE BASEBALL RECRUITING, SIMPLIFIED.
        </div>

        {/* Description */}
        <div
          style={{
            display: "flex",
            fontSize: "28px",
            color: "rgba(255,255,255,0.7)",
            marginTop: "48px",
            textAlign: "center",
            maxWidth: "800px",
            lineHeight: 1.4,
          }}
        >
          Search 1,800+ programs across D1, D2, D3 & JUCO. AI-powered matching. Free to try.
        </div>

        {/* Red accent line at bottom */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "6px",
            background: "linear-gradient(to right, #b91c1c, #ef4444, #b91c1c)",
            display: "flex",
          }}
        />
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Permanent Marker",
          data: fontData,
          style: "normal",
        },
      ],
    }
  );
}
