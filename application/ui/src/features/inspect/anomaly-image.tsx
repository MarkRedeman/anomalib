import { Dispatch, RefObject, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';

import { useProjectIdentifier } from '@geti-inspect/hooks';
import { ZoomTransform } from 'src/components/zoom/zoom-transform';

import { useInspect } from './inspect-provider';

interface AnomalyOverlayProps {
    file: File;
    anomaly_map: string; // base64 encoded image
    opacity: number;
}

const useUrl = () => {
    const inspect = useInspect();
    const { projectId: project_id } = useProjectIdentifier();

    if (inspect.selectedImageId === undefined) {
        return null;
    }

    const mediaUrl = `/api/projects/${project_id}/images/${inspect.selectedImageId}/full`;

    return mediaUrl;
};

interface DrawImageOnCanvasProps {
    image: ImageData | undefined;
    enabled?: boolean;
}

export const loadImage = (link: string): Promise<HTMLImageElement> => {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = 'use-credentials';

        image.onload = () => resolve(image);
        image.onerror = (error) => reject(error);

        image.fetchPriority = 'high';
        image.src = link;

        if (process.env.NODE_ENV === 'test') {
            // Immediately load the media item's image
            resolve(image);
        }
    });
};

export const drawImageOnCanvas = (img: HTMLImageElement, filter = ''): HTMLCanvasElement => {
    const canvas: HTMLCanvasElement = document.createElement('canvas');

    canvas.width = img.naturalWidth ? img.naturalWidth : img.width;
    canvas.height = img.naturalHeight ? img.naturalHeight : img.height;

    const ctx = canvas.getContext('2d');

    if (ctx) {
        const width = img.naturalWidth ? img.naturalWidth : img.width;
        const height = img.naturalHeight ? img.naturalHeight : img.height;

        ctx.filter = filter;
        ctx.drawImage(img, 0, 0, width, height);
    }

    return canvas;
};

export const getImageData = (img: HTMLImageElement): ImageData => {
    // Always return valid imageData, even if the image isn't loaded yet.
    if (img.width === 0 && img.height === 0) {
        return new ImageData(1, 1);
    }

    const canvas = drawImageOnCanvas(img);
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

    const width = img.naturalWidth ? img.naturalWidth : img.width;
    const height = img.naturalHeight ? img.naturalHeight : img.height;

    return ctx.getImageData(0, 0, width, height);
};

//const image = await loadImage(mediaItem.src);
//return getImageData(image);

const AnomalyOverlay = ({ file, anomaly_map, opacity }: AnomalyOverlayProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const imageUrl = useUrl();

    useEffect(() => {
        if (!file) return;

        const fileUrl = URL.createObjectURL(file);
        const img = new Image();

        img.onload = () => {
            setDimensions({
                width: img.width,
                height: img.height,
            });

            const width = img.naturalWidth ? img.naturalWidth : img.width;
            const height = img.naturalHeight ? img.naturalHeight : img.height;

            const canvas = canvasRef.current;
            console.log('loaded image?', this, canvas);
            if (canvas) {
                const ctx = canvas.getContext('2d');
                console.log('got canvas?');
                if (ctx) {
                    console.log('drawing');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    //ctx.putImageData(img, 0, 0);
                    ctx.drawImage(img, 0, 0, width, height);
                }
            }
        };

        img.src = imageUrl ?? fileUrl;

        return () => {
            URL.revokeObjectURL(fileUrl);
        };
    }, [file, imageUrl]);

    const src = `data:image/png;base64,${anomaly_map}`;

    return (
        <ZoomTransform target={dimensions}>
            <div
                ref={containerRef}
                style={{ position: 'relative', width: dimensions.width, height: dimensions.height }}
            >
                <canvas ref={canvasRef} width={dimensions.width} height={dimensions.height} />
                {imageUrl && (
                    <img
                        src={imageUrl}
                        width={dimensions.width}
                        height={dimensions.height}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            pointerEvents: 'none',
                        }}
                    />
                )}
                {anomaly_map && dimensions.width > 0 && (
                    <img
                        src={src}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            opacity,
                            pointerEvents: 'none',
                        }}
                        alt='Anomaly overlay'
                    />
                )}
            </div>
        </ZoomTransform>
    );
};

export const AnomalyImage = () => {
    const inspect = useInspect();
    const formData = inspect.inferMutation?.variables?.body as FormData;

    if (inspect.inferMutation?.data === undefined || formData === undefined) {
        return <div>Wait</div>;
    }

    const anomaly_map = inspect.inferMutation.data?.anomaly_map ?? '';

    return <AnomalyOverlay anomaly_map={anomaly_map} file={formData.get('file') as File} opacity={inspect.opacity} />;
};
