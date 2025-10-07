import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useState } from 'react';

import { $api } from '@geti-inspect/api';
import { UseMutationResult } from '@tanstack/react-query';
import { UseMutationMethod } from 'openapi-react-query';
import { SchemaPredictionResponse } from 'src/api/openapi-spec';

const inferMutation = () => {
    return $api.useMutation('post', '/api/projects/{project_id}/models/{model_id}:predict');
};

type InspectState = {
    selectedModelId: string | undefined;
    selectedImageId: string | undefined;
    selectedFile: File | undefined;
    result: SchemaPredictionResponse | undefined;
    inferMutation: undefined | ReturnType<typeof inferMutation>;

    // Inference
    opacity: number;
    device: 'CPU' | 'GPU' | 'NPU';
};

export const Inspect = createContext<InspectState>({
    result: undefined,
    selectedModelId: undefined,
    selectedImageId: undefined,
    selectedFile: undefined,
    inferMutation: undefined,
    opacity: 0.9,
    device: 'CPU',
});
const SetInspect = createContext<Dispatch<SetStateAction<InspectState>> | null>(null);

export const useInspect = () => {
    return useContext(Inspect);
};

export const useSetInspect = () => {
    const context = useContext(SetInspect);

    if (!context) {
        throw new Error('');
    }

    return context;
};

export const InspectProvider = ({ children }: { children: ReactNode }) => {
    const [inspect, setInspect] = useState<InspectState>({
        result: undefined,
        selectedModelId: undefined,
        selectedImageId: undefined,
        selectedFile: undefined,
        inferMutation: undefined,
        opacity: 0.9,
        device: 'CPU',
    });

    const inferMutation = $api.useMutation('post', '/api/projects/{project_id}/models/{model_id}:predict');

    return (
        <Inspect.Provider value={{ ...inspect, inferMutation }}>
            <SetInspect.Provider value={setInspect}>{children}</SetInspect.Provider>
        </Inspect.Provider>
    );
};
