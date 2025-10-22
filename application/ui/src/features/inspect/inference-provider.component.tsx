import { createContext, Dispatch, ReactNode, SetStateAction, use, useState } from 'react';

import { $api } from '@geti-inspect/api';
import { components } from '@geti-inspect/api/spec';
import { toast } from '@geti/ui';

import { MediaItem } from './dataset/types';
import { useSelectedMediaItem } from './selected-media-item-provider.component';

type InferenceResult = components['schemas']['PredictionResponse'] | undefined;

type Device = 'cpu' | 'gpu' | 'npu' | 'auto';
interface InferenceContextProps {
    onInference: (media: MediaItem, modelId: string) => Promise<void>;
    inferenceResult: InferenceResult;
    isPending: boolean;
    selectedModelId: string | undefined;
    onSetSelectedModelId: (model: string | undefined) => void;
    inferenceOpacity: number;
    onInferenceOpacityChange: (opacity: number) => void;

    selectedDevice: Device;
    setSelectedDevice: Dispatch<SetStateAction<Device>>;
}

const InferenceContext = createContext<InferenceContextProps | undefined>(undefined);

const downloadImageAsFile = async (media: MediaItem) => {
    const response = await fetch(`/api/projects/${media.project_id}/images/${media.id}/full`);

    const blob = await response.blob();

    return new File([blob], media.filename, { type: blob.type });
};

const useInferenceMutation = (device: Device) => {
    const inferenceMutation = $api.useMutation('post', '/api/projects/{project_id}/models/{model_id}:predict');

    const handleInference = async (mediaItem: MediaItem, modelId: string, newDevice?: Device) => {
        const file = await downloadImageAsFile(mediaItem);

        const formData = new FormData();
        formData.append('file', file);
        if (newDevice !== 'auto') {
            formData.append('device', newDevice ?? device);
        }

        inferenceMutation.mutate(
            {
                // @ts-expect-error There is an incorrect type in OpenAPI
                body: formData,
                params: {
                    path: {
                        project_id: mediaItem.project_id,
                        model_id: modelId,
                    },
                },
            },
            {
                onError: (error) => {
                    toast({
                        type: 'error',
                        message: String(error.detail),
                    });
                },
            }
        );
    };

    return {
        inferenceResult: inferenceMutation.data,
        onInference: handleInference,
        isPending: inferenceMutation.isPending,
    };
};

interface InferenceProviderProps {
    children: ReactNode;
}

export const InferenceProvider = ({ children }: InferenceProviderProps) => {
    const [selectedDevice, setSelectedDevice] = useState<Device>('auto');
    const { inferenceResult, onInference, isPending } = useInferenceMutation(selectedDevice);
    const [selectedModelId, setSelectedModelId] = useState<string | undefined>(undefined);
    const [inferenceOpacity, setInferenceOpacity] = useState<number>(0.75);

    const { selectedMediaItem } = useSelectedMediaItem();

    const onSetSelectedModelId = (modelId: string | undefined) => {
        setSelectedModelId(modelId);

        if (modelId) {
            if (selectedMediaItem) {
                onInference(selectedMediaItem, modelId);
            }
        }
    };

    const onSetSelectedDevice = (device: Device) => {
        setSelectedDevice(device);

        if (selectedModelId && selectedMediaItem) {
            onInference(selectedMediaItem, selectedModelId, device);
        }
    };

    return (
        <InferenceContext
            value={{
                onInference,
                isPending,
                inferenceResult,
                selectedModelId,
                onSetSelectedModelId,
                inferenceOpacity,
                onInferenceOpacityChange: setInferenceOpacity,

                selectedDevice,
                setSelectedDevice: onSetSelectedDevice,
            }}
        >
            {children}
        </InferenceContext>
    );
};

export const useInference = () => {
    const context = use(InferenceContext);

    if (context === undefined) {
        throw new Error('useInference must be used within a InferenceProvider');
    }

    return context;
};
