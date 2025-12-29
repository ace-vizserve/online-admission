import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, Download, RotateCw, X, ZoomIn, ZoomOut } from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import NotFound from "../not-found";

function StudentPhoto() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);

  const url = params.get("url");

  if (!url) return <NotFound />;

  const goBack = () => navigate(-1);
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `student-photo-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  if (hasError) {
    return (
      <div className="h-dvh w-full flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="size-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4">
          <X size={32} />
        </div>
        <h2 className="text-xl font-black text-slate-900">Failed to load photo</h2>
        <p className="text-slate-500 mb-6 max-w-xs">The image might have been moved or the link has expired.</p>
        <Button onClick={goBack} variant="outline" className="rounded-xl px-8 font-bold">
          <ArrowLeft className="mr-2" /> Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="relative h-dvh w-full flex flex-col overflow-hidden select-none">
      <div className="absolute top-0 inset-x-0 z-50 flex items-center justify-between p-4 md:p-6">
        <Button onClick={goBack} variant="ghost" className="text-primary rounded-xl font-bold backdrop-blur-md">
          <ArrowLeft className="mr-2 size-4" />
          Back
        </Button>

        <div className="flex items-center gap-1.5 bg-primary p-1.5 rounded-2xl border border-white/10">
          <Button
            onClick={handleZoomOut}
            size="icon"
            variant="ghost"
            className="text-white size-9"
            disabled={zoom <= 0.5}>
            <ZoomOut size={18} />
          </Button>
          <div className="px-2 min-w-[50px] text-center">
            <span className="text-[11px] font-black text-white/90 uppercase tracking-tighter">
              {Math.round(zoom * 100)}%
            </span>
          </div>
          <Button onClick={handleZoomIn} size="icon" variant="ghost" className="text-white size-9" disabled={zoom >= 3}>
            <ZoomIn size={18} />
          </Button>

          <div className="w-px h-4 bg-white/10 mx-1" />

          <Button onClick={handleRotate} size="icon" variant="ghost" className="text-white size-9">
            <RotateCw size={18} />
          </Button>
          <Button onClick={handleDownload} size="icon" variant="ghost" className="text-white size-9">
            <Download size={18} />
          </Button>
          <Button
            onClick={handleReset}
            size="icon"
            variant="ghost"
            className="text-rose-400 hover:text-rose-500 size-9">
            <X size={18} />
          </Button>
        </div>
      </div>

      {/* Main Canvas */}
      <div
        className="flex-1 relative flex items-center justify-center transition-colors duration-500"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}>
        {isLoading && (
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/20 border-t-white" />
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Processing</span>
          </div>
        )}

        <img
          ref={imageRef}
          src={url}
          alt="Student"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          onMouseDown={handleMouseDown}
          className={cn(
            "max-w-[90%] max-h-[85%] object-contain rounded-xl shadow-2xl transition-opacity duration-700",
            isLoading ? "opacity-0" : "opacity-100",
            zoom > 1 ? "cursor-move" : "cursor-default"
          )}
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg) translate(${position.x / zoom}px, ${
              position.y / zoom
            }px)`,
            transformOrigin: "center center",
            transition: isDragging ? "none" : "transform 0.3s cubic-bezier(0.2, 0, 0, 1)",
          }}
          draggable={false}
        />
      </div>

      {/* Minimal Footer */}
      <div className="absolute bottom-6 inset-x-0 flex justify-center pointer-events-none">
        <div className="bg-primary backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
          <p className="text-[10px] text-white font-bold uppercase tracking-widest">
            {zoom > 1 ? "Drag to pan" : "Inspection Mode"}
          </p>
        </div>
      </div>
    </div>
  );
}
export default StudentPhoto;
