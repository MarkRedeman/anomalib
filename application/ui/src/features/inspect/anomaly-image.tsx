import { Dispatch, RefObject, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';

import { ZoomTransform } from 'src/components/zoom/zoom-transform';

import { useInspect } from './inspect-provider';

interface AnomalyOverlayProps {
    file: File;
    anomaly_map: string; // base64 encoded image
    opacity: number;
}

const AnomalyOverlay = ({ file, anomaly_map, opacity }: AnomalyOverlayProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (!file) return;

        const fileUrl = URL.createObjectURL(file);
        const img = new Image();

        img.onload = () => {
            setDimensions({
                width: img.width,
                height: img.height,
            });

            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                }
            }
        };

        img.src = fileUrl;

        return () => {
            URL.revokeObjectURL(fileUrl);
        };
    }, [file]);

    return (
        <ZoomTransform target={dimensions}>
            <div
                ref={containerRef}
                style={{ position: 'relative', width: dimensions.width, height: dimensions.height }}
            >
                <canvas ref={canvasRef} width={dimensions.width} height={dimensions.height} />
                {anomaly_map && dimensions.width > 0 && (
                    <img
                        src={`data:image/png;base64,${anomaly_map}`}
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
