"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface ImageCropModalProps {
  imageUrl: string;
  onSave: (croppedDataUrl: string) => void;
  onCancel: () => void;
  circular?: boolean;
}

const CROP_SIZE = 256; // output size in px

export default function ImageCropModal({
  imageUrl,
  onSave,
  onCancel,
  circular = true,
}: ImageCropModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 });

  // Viewport size for the crop area
  const VIEWPORT = 260;

  // Load image and compute initial scale/offset to fit
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImgNatural({ w: img.naturalWidth, h: img.naturalHeight });

      // Scale so the smaller dimension fills the viewport
      const minDim = Math.min(img.naturalWidth, img.naturalHeight);
      const initScale = VIEWPORT / minDim;
      setScale(initScale);

      // Center the image
      setOffset({
        x: (VIEWPORT - img.naturalWidth * initScale) / 2,
        y: (VIEWPORT - img.naturalHeight * initScale) / 2,
      });

      setImgLoaded(true);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      setDragging(true);
      setDragStart({ x: clientX - offset.x, y: clientY - offset.y });
    },
    [offset]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!dragging) return;
      e.preventDefault();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      setOffset({ x: clientX - dragStart.x, y: clientY - dragStart.y });
    },
    [dragging, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setDragging(false);
  }, []);

  // Also listen for mouseup/touchend on window so dragging outside works
  useEffect(() => {
    const up = () => setDragging(false);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchend", up);
    };
  }, []);

  const handleZoom = (newScale: number) => {
    if (!imgRef.current) return;
    // Zoom toward center of viewport
    const cx = VIEWPORT / 2;
    const cy = VIEWPORT / 2;
    const ratio = newScale / scale;
    setOffset({
      x: cx - (cx - offset.x) * ratio,
      y: cy - (cy - offset.y) * ratio,
    });
    setScale(newScale);
  };

  const handleSave = () => {
    if (!imgRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = CROP_SIZE;
    canvas.height = CROP_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Map viewport coordinates back to source image
    const srcX = -offset.x / scale;
    const srcY = -offset.y / scale;
    const srcW = VIEWPORT / scale;
    const srcH = VIEWPORT / scale;

    ctx.drawImage(imgRef.current, srcX, srcY, srcW, srcH, 0, 0, CROP_SIZE, CROP_SIZE);
    onSave(canvas.toDataURL("image/jpeg", 0.9));
  };

  const minScale = imgNatural.w && imgNatural.h
    ? VIEWPORT / Math.max(imgNatural.w, imgNatural.h)
    : 0.1;
  const maxScale = imgNatural.w && imgNatural.h
    ? (VIEWPORT / Math.min(imgNatural.w, imgNatural.h)) * 3
    : 5;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">Crop Photo</h3>
          <p className="text-xs text-gray-500 mt-0.5">Drag to reposition, use slider to zoom</p>
        </div>

        <div className="flex justify-center py-5 bg-gray-50">
          <div
            ref={containerRef}
            className="relative select-none cursor-grab active:cursor-grabbing"
            style={{
              width: VIEWPORT,
              height: VIEWPORT,
              overflow: "hidden",
              borderRadius: circular ? "50%" : 12,
              border: "3px solid #e5e7eb",
              boxShadow: "0 0 0 4000px rgba(0,0,0,0.15)",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
          >
            {imgLoaded && (
              <img
                src={imageUrl}
                alt="Crop preview"
                draggable={false}
                style={{
                  position: "absolute",
                  left: offset.x,
                  top: offset.y,
                  width: imgNatural.w * scale,
                  height: imgNatural.h * scale,
                  maxWidth: "none",
                  pointerEvents: "none",
                }}
              />
            )}
            {!imgLoaded && (
              <div className="w-full h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600" />
              </div>
            )}
          </div>
        </div>

        {/* Zoom slider */}
        <div className="px-6 py-4 flex items-center gap-3">
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
          </svg>
          <input
            type="range"
            min={minScale}
            max={maxScale}
            step={0.001}
            value={scale}
            onChange={(e) => handleZoom(parseFloat(e.target.value))}
            className="flex-1 h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-red-600"
          />
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!imgLoaded}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
