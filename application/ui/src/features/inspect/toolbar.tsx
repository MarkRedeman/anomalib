// Copyright (C) 2025 Intel Corporation
// SPDX-License-Identifier: Apache-2.0

import { FileTrigger, Item, Picker, StatusLight } from '@adobe/react-spectrum';
import { $api } from '@geti-inspect/api';
import { useProjectIdentifier } from '@geti-inspect/hooks';
import { Button, Divider, Flex, Slider, View } from '@geti/ui';

import { useWebRTCConnection } from '../../components/stream/web-rtc-connection-provider';
import { useInspect, useSetInspect } from './inspect-provider';

const WebRTCConnectionStatus = () => {
    const { status, stop } = useWebRTCConnection();

    switch (status) {
        case 'idle':
            return (
                <Flex
                    gap='size-100'
                    alignItems={'center'}
                    UNSAFE_style={{
                        '--spectrum-gray-visual-color': 'var(--spectrum-global-color-gray-500)',
                    }}
                >
                    <StatusLight role={'status'} aria-label='Idle' variant='neutral'>
                        Idle
                    </StatusLight>
                </Flex>
            );
        case 'connecting':
            return (
                <Flex gap='size-100' alignItems={'center'}>
                    <StatusLight role={'status'} aria-label='Connecting' variant='info'>
                        Connecting
                    </StatusLight>
                </Flex>
            );
        case 'disconnected':
            return (
                <Flex gap='size-100' alignItems={'center'}>
                    <StatusLight role={'status'} aria-label='Disconnected' variant='negative'>
                        Disconnected
                    </StatusLight>
                </Flex>
            );
        case 'failed':
            return (
                <Flex gap='size-100' alignItems={'center'}>
                    <StatusLight role={'status'} aria-label='Failed' variant='negative'>
                        Failed
                    </StatusLight>
                </Flex>
            );
        case 'connected':
            return (
                <Flex gap='size-200' alignItems={'center'}>
                    <StatusLight role={'status'} aria-label='Connected' variant='positive'>
                        Connected
                    </StatusLight>
                    <Button onPress={stop} variant='secondary'>
                        Stop
                    </Button>
                </Flex>
            );
    }
};

const InferTrigger = () => {
    const { projectId: project_id } = useProjectIdentifier();

    const inspect = useInspect();
    const model_id = inspect.selectedModelId;
    const inferMutation = inspect.inferMutation!;
    const device = inspect.device;

    const infer = async (files: FileList | null) => {
        if (model_id === undefined || files === null) {
            console.log('no');
            return;
        }

        async function downloadImageAsFile(url: string, filename: string = 'image.png'): Promise<File> {
            const response = await fetch(url);
            const blob = await response.blob();
            return new File([blob], filename, { type: blob.type });
        }

        for (const file of files) {
            const formData = new FormData();
            formData.append('file', file);

            const res = await inferMutation.mutateAsync({
                params: {
                    path: { project_id, model_id },

                    query: {
                        device,
                    },
                },
                // @ts-expect-error There is an incorrect type in OpenAPI
                body: formData,
            });
            console.log(res.score, res.label);
        }
    };

    return (
        <FileTrigger allowsMultiple={false} onSelect={infer}>
            <Button>Infer</Button>
        </FileTrigger>
    );
};

const InferButton = () => {
    const { projectId: project_id } = useProjectIdentifier();

    const imagesQuery = $api.useSuspenseQuery('get', '/api/projects/{project_id}/images', {
        params: { path: { project_id } },
    });

    const inspect = useInspect();
    const model_id = inspect.selectedModelId;
    const inferMutation = inspect.inferMutation!;
    const device = inspect.device;

    return (
        <Button
            onPress={async () => {
                if (model_id === undefined) {
                    console.log('no');
                    return;
                }

                async function downloadImageAsFile(url: string, filename: string = 'image.png'): Promise<File> {
                    const response = await fetch(url);
                    const blob = await response.blob();
                    return new File([blob], filename, { type: blob.type });
                }

                for (const image of imagesQuery.data.media) {
                    const mediaUrl = `/api/projects/${image.project_id}/images/${image.id}/full`;

                    const formData = new FormData();
                    formData.append('file', await downloadImageAsFile(mediaUrl));

                    const res = await inferMutation.mutateAsync({
                        params: { path: { project_id, model_id }, query: { device } },
                        // @ts-expect-error There is an incorrect type in OpenAPI
                        body: formData,
                    });
                    console.log(res.score, res.label);
                }
            }}
        >
            Infer
        </Button>
    );
};

const ModelPicker = () => {
    const setInspect = useSetInspect();
    const inspect = useInspect();

    const { projectId: project_id } = useProjectIdentifier();
    const modelsQuery = $api.useSuspenseQuery('get', '/api/projects/{project_id}/models', {
        params: { path: { project_id } },
    });

    return (
        <>
            <Picker
                label='Model'
                labelPosition='side'
                selectedKey={inspect.selectedModelId}
                onSelectionChange={(key) => {
                    if (key) {
                        setInspect((inspect) => ({ ...inspect, selectedModelId: String(key) }));
                    }
                }}
            >
                {modelsQuery.data.models.map((model) => {
                    return <Item key={model.id}>{model.name}</Item>;
                })}
            </Picker>
            <InferButton />
            <InferTrigger />
        </>
    );
};

const OpacitySlider = () => {
    const setInspect = useSetInspect();
    const inspect = useInspect();

    return (
        <Slider
            label='Opacity'
            value={inspect.opacity}
            minValue={0}
            maxValue={1}
            step={0.001}
            onChange={(newOpacity) => setInspect((inspect) => ({ ...inspect, opacity: newOpacity }))}
        />
    );
};

const DevicePicker = () => {
    const setInspect = useSetInspect();
    const inspect = useInspect();
    type Device = 'CPU' | 'GPU' | 'NPU';

    return (
        <Picker
            label='Device'
            labelPosition='side'
            selectedKey={inspect.device}
            onSelectionChange={(key) => {
                if (!key && key !== 'CPU' && key !== 'GPU' && key !== 'NPU') {
                    return;
                }
                setInspect((inspect) => ({ ...inspect, device: key as Device }));
            }}
        >
            <Item key={'CPU'}>CPU</Item>
            <Item key={'GPU'}>GPU</Item>
            <Item key={'NPU'}>NPU</Item>
        </Picker>
    );
};

const ResultLabel = () => {
    const inspect = useInspect();
    const inferMutation = inspect.inferMutation!;

    if (inferMutation.data?.label) {
        return (
            <View marginStart='size-300'>
                {inferMutation.data.label} ({(inferMutation.data.score * 100).toFixed(1)}%)
            </View>
        );
    }

    return null;
};

export const Toolbar = () => {
    return (
        <View
            backgroundColor={'gray-100'}
            gridArea='toolbar'
            padding='size-200'
            UNSAFE_style={{
                fontSize: '12px',
                color: 'var(--spectrum-global-color-gray-800)',
            }}
        >
            <Flex height='100%' gap='size-200' alignItems={'center'}>
                <WebRTCConnectionStatus />
                <ModelPicker />
                <DevicePicker />

                <Divider orientation='vertical' size='S' />

                <OpacitySlider />
                <ResultLabel />

                <Divider orientation='vertical' size='S' />

                <Flex marginStart='auto'>Work in progress</Flex>
            </Flex>
        </View>
    );
};
