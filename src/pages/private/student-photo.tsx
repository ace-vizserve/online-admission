import { Button } from "@/components/ui/button";
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

  if (!url) {
    return <NotFound />;
  }

  const goBack = () => {
    navigate(-1);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

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
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  if (hasError) {
    return (
      <div className="relative h-dvh w-full flex flex-col items-center justify-center p-4 space-y-4">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold">Failed to load image</h2>
          <p className="text-muted-foreground">The image could not be loaded. Please try again.</p>
        </div>
        <Button onClick={goBack} variant="outline">
          <ArrowLeft /> Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="relative h-dvh w-full flex flex-col bg-background">
      {/* Header with controls */}
      <div className="flex items-center justify-between p-4 md:p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Button onClick={goBack} size="sm" variant="ghost" className="gap-2">
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Go back</span>
        </Button>

        <div className="flex items-center gap-2">
          <Button onClick={handleZoomOut} size="icon" variant="outline" disabled={zoom <= 0.5}>
            <ZoomOut className="size-4" />
          </Button>
          <span className="text-sm font-medium min-w-[60px] text-center">{Math.round(zoom * 100)}%</span>
          <Button onClick={handleZoomIn} size="icon" variant="outline" disabled={zoom >= 3}>
            <ZoomIn className="size-4" />
          </Button>
          <Button onClick={handleRotate} size="icon" variant="outline">
            <RotateCw className="size-4" />
          </Button>
          <Button
            onClick={handleReset}
            size="icon"
            variant="outline"
            disabled={zoom === 1 && rotation === 0 && position.x === 0 && position.y === 0}>
            <X className="size-4" />
          </Button>
          <Button onClick={handleDownload} size="icon" variant="outline">
            <Download className="size-4" />
          </Button>
        </div>
      </div>

      {/* Image container */}
      <div
        className="flex-1 overflow-hidden bg-muted/30 relative"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}>
        <div className="absolute inset-0 flex items-center justify-center p-4">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          )}

          <img
            ref={imageRef}
            src={url}
            alt="Student photo"
            onLoad={handleImageLoad}
            onError={handleImageError}
            onMouseDown={handleMouseDown}
            className={`max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-opacity duration-300 ${
              isLoading ? "opacity-0" : "opacity-100"
            } ${zoom > 1 ? "cursor-move" : "cursor-default"}`}
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg) translate(${position.x / zoom}px, ${
                position.y / zoom
              }px)`,
              transformOrigin: "center center",
              transition: isDragging ? "none" : "transform 0.2s ease-out",
            }}
            draggable={false}
          />
        </div>
      </div>

      {/* Info footer */}
      <div className="p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <p className="text-sm text-muted-foreground text-center">
          {zoom > 1 ? "Click and drag to pan • " : ""}Use controls to zoom • Click rotate to change orientation
        </p>
      </div>
    </div>
  );
}

export default StudentPhoto;
