import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, Download, X, ZoomIn, ZoomOut } from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import NotFound from "../not-found";

function StudentPhoto() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [zoom, setZoom] = useState(1);
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

  const handlePanStart = (clientX: number, clientY: number) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
  };

  const handlePanMove = (clientX: number, clientY: number) => {
    if (!isDragging || zoom <= 1) return;
    setPosition({ x: clientX - dragStart.x, y: clientY - dragStart.y });
  };

  const handlePanEnd = () => setIsDragging(false);

  const handleMouseDown = (e: React.MouseEvent) => handlePanStart(e.clientX, e.clientY);
  const handleMouseMove = (e: React.MouseEvent) => handlePanMove(e.clientX, e.clientY);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      e.preventDefault(); // Prevent default browser scrolling
      handlePanStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      e.preventDefault(); // Prevent default browser scrolling
      handlePanMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  if (hasError) {
    return (
      <div className="h-dvh w-full flex flex-col items-center justify-center bg-slate-900 p-6 text-center">
        <div className="size-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mb-4">
          <X size={32} />
        </div>
        <h2 className="text-xl font-black text-white">Failed to load photo</h2>
        <p className="text-slate-400 mb-6 max-w-xs">The image might have been moved or the link has expired.</p>
        <Button
          onClick={goBack}
          variant="outline"
          className="rounded-xl px-8 font-bold border-slate-700 text-white hover:bg-slate-800 hover:text-white">
          <ArrowLeft className="mr-2" /> Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="relative h-dvh w-full flex flex-col overflow-hidden select-none">
      <header className="absolute top-0 right-0 z-10 p-4">
        <Button onClick={goBack} variant="ghost" className="text-white rounded-full p-0 size-10 rounded-full">
          <X size={24} />
        </Button>
      </header>

      <main
        className="flex-1 relative flex items-center justify-center"
        onMouseMove={handleMouseMove}
        onMouseUp={handlePanEnd}
        onMouseLeave={handlePanEnd}
        onTouchMove={handleTouchMove}
        onTouchEnd={handlePanEnd}>
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
          onTouchStart={handleTouchStart}
          className={cn(
            "max-w-[90%] max-h-[85%] object-contain transition-opacity duration-700",
            isLoading ? "opacity-0" : "opacity-100",
            zoom > 1 ? "cursor-move" : "cursor-default"
          )}
          style={{
            transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
            transformOrigin: "center center",
            transition: isDragging ? "none" : "transform 0.3s cubic-bezier(0.2, 0, 0, 1)",
          }}
          draggable={false}
        />
      </main>

      <footer className="absolute bottom-0 inset-x-0 p-4 flex justify-center pointer-events-none">
        <div className="flex items-center gap-2 bg-primary p-1.5 rounded-full border border-white/10 shadow-lg pointer-events-auto">
          <Button
            onClick={handleZoomOut}
            size="icon"
            variant="ghost"
            className="text-white size-9 rounded-full disabled:opacity-50"
            disabled={zoom <= 0.5}>
            <ZoomOut size={18} />
          </Button>
          <div className="px-2 min-w-[50px] text-center">
            <span className="text-sm font-bold text-white tabular-nums">{Math.round(zoom * 100)}%</span>
          </div>
          <Button
            onClick={handleZoomIn}
            size="icon"
            variant="ghost"
            className="text-white size-9 rounded-full disabled:opacity-50"
            disabled={zoom >= 3}>
            <ZoomIn size={18} />
          </Button>
          <div className="w-px h-5 bg-white/10 mx-1.5" />
          <Button
            onClick={handleDownload}
            variant="ghost"
            className="text-white h-9 px-4 rounded-full disabled:opacity-50">
            <Download size={16} className="mr-2" />
            <span className="font-bold text-xs">Download</span>
          </Button>
        </div>
      </footer>
    </div>
  );
}
export default StudentPhoto;
