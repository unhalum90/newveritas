"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, X, RefreshCw, Check } from "lucide-react";

interface CameraCaptureDialogProps {
    open: boolean;
    onClose: () => void;
    onCapture: (file: File) => void;
}

export function CameraCaptureDialog({ open, onClose, onCapture }: CameraCaptureDialogProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [open]);

    const startCamera = async () => {
        setError(null);
        setPreviewUrl(null);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" },
                audio: false,
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError("Could not access camera. Please ensure you have granted permission.");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            setStream(null);
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext("2d");
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL("image/jpeg");
                setPreviewUrl(dataUrl);
                stopCamera();
            }
        }
    };

    const retake = () => {
        setPreviewUrl(null);
        startCamera();
    };

    const confirmCapture = () => {
        if (previewUrl) {
            // Convert dataUrl to File
            fetch(previewUrl)
                .then((res) => res.blob())
                .then((blob) => {
                    const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: "image/jpeg" });
                    onCapture(file);
                    onClose();
                });
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <Card className="w-full max-w-2xl overflow-hidden border-zinc-800 bg-zinc-950 text-zinc-100 shadow-2xl">
                <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-800 pb-4">
                    <div>
                        <CardTitle className="text-xl font-bold">Capture Photo</CardTitle>
                        <CardDescription className="text-zinc-400">
                            Take a photo of your work using your device camera.
                        </CardDescription>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="text-zinc-400 hover:text-white w-8 h-8 p-0"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="relative aspect-video w-full bg-zinc-900">
                        {error ? (
                            <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                                <span className="mb-4 text-4xl">⚠️</span>
                                <p className="text-red-400">{error}</p>
                                <Button onClick={startCamera} variant="outline" className="mt-4 border-zinc-700">
                                    Try Again
                                </Button>
                            </div>
                        ) : previewUrl ? (
                            <img src={previewUrl} alt="Captured preview" className="h-full w-full object-contain" />
                        ) : (
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                className="h-full w-full object-cover"
                            />
                        )}

                        {/* Hidden canvas for capturing */}
                        <canvas ref={canvasRef} className="hidden" />
                    </div>

                    <div className="flex items-center justify-center gap-4 border-t border-zinc-800 p-6">
                        {!previewUrl && !error && (
                            <Button
                                onClick={capturePhoto}
                                size="lg"
                                className="h-16 w-16 rounded-full bg-white text-black hover:bg-zinc-200"
                            >
                                <Camera className="h-8 w-8" />
                            </Button>
                        )}
                        {previewUrl && (
                            <>
                                <Button
                                    onClick={retake}
                                    variant="outline"
                                    size="lg"
                                    className="flex items-center gap-2 border-zinc-700 bg-transparent text-zinc-100 hover:bg-zinc-900"
                                >
                                    <RefreshCw className="h-5 w-5" />
                                    Retake
                                </Button>
                                <Button
                                    onClick={confirmCapture}
                                    size="lg"
                                    className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-500"
                                >
                                    <Check className="h-5 w-5" />
                                    Use Photo
                                </Button>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
