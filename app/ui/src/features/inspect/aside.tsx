// Copyright (C) 2025 Intel Corporation
// SPDX-License-Identifier: Apache-2.0

import { useState } from 'react';

import {
    ActionButton,
    Button,
    ButtonGroup,
    Divider,
    FileTrigger,
    Flex,
    Grid,
    Heading,
    minmax,
    repeat,
    View,
} from '@geti/ui';

import { $api } from '../../api/client';
import { NoMediaPlaceholder } from '../../components/no-media-placeholder/no-media-placeholder.component';
import { useProjectId } from '../projects/use-project';
import { ReactComponent as DoubleChevronRight } from './../../assets/icons/double-chevron-right-icon.svg';

export const AsideContent = () => {
    const { project_id } = useProjectId();
    const { data: uploadedImages } = $api.useSuspenseQuery('get', '/api/projects/{project_id}/images', {
        params: {
            path: {
                project_id,
            },
        },
    });
    const captureImageMutation = $api.useMutation('post', '/api/projects/{project_id}/capture');
    const trainMutation = $api.useMutation('post', '/api/jobs:train');
    const inferMutation = $api.useMutation('post', '/api/projects/{project_id}/models/{model_id}:predict');
    const jobs = $api.useQuery(
        'get',
        '/api/jobs',
        {},
        {
            refetchInterval: 5_000,
        }
    );

    const models = $api.useQuery('get', '/api/projects/{project_id}/models', {
        params: { path: { project_id } },
    });

    const emptyImages = new Array(Math.max(0, 20 - uploadedImages.media.length)).fill(0);

    console.log({ uploadedImages, emptyImages });

    return (
        <Flex direction='column' gap='size-200'>
            <Flex gap='size-200'>
                <Button
                    onPress={async () => {
                        trainMutation.mutate({ body: { project_id, model_name: 'padim' } });
                    }}
                    isDisabled={trainMutation.isPending}
                >
                    Train
                </Button>
                <FileTrigger
                    allowsMultiple
                    onSelect={async (files) => {
                        console.log('upload files', files);

                        const model = models.at(0);
                        if (files === null || model === undefined) {
                            return;
                        }

                        for (const file of files) {
                            const formData = new FormData();
                            formData.append('file', file);

                            inferMutation.mutate({
                                params: {
                                    path: {
                                        project_id,
                                        //model_name: 'padim',
                                        model_id: model.id,
                                    },
                                },
                                body: formData,
                            });
                        }
                    }}
                >
                    <Button isDisabled={inferMutation.isPending}>Infer</Button>
                </FileTrigger>
                <FileTrigger
                    allowsMultiple
                    onSelect={async (files) => {
                        console.log('upload files', files);

                        if (files === null) {
                            return;
                        }

                        for (const file of files) {
                            const formData = new FormData();
                            formData.append('file', file);

                            await captureImageMutation.mutateAsync({
                                params: { path: { project_id } },
                                body: formData,
                            });
                        }
                    }}
                >
                    <Button variant='primary'>Upload your files</Button>
                </FileTrigger>
            </Flex>

            <p>{JSON.stringify(jobs?.data?.jobs, 2)}</p>
        </Flex>
    );
};

export const Aside = () => {
    const [isHidden, setIsHidden] = useState(false);

    return (
        <Grid
            gridArea={'aside'}
            height={'90vh'}
            areas={['header', 'graphs']}
            rows={['min-content', 'minmax(0, 1fr)']}
            UNSAFE_style={{
                padding: 'var(--spectrum-global-dimension-size-200)',
                paddingLeft: isHidden
                    ? 'var(--spectrum-global-dimension-size-100)'
                    : 'var(--spectrum-global-dimension-size-200)',
                paddingRight: isHidden
                    ? 'var(--spectrum-global-dimension-size-100)'
                    : 'var(--spectrum-global-dimension-size-200)',
                backgroundColor: 'var(--spectrum-global-color-gray-100)',
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                width: isHidden ? 'var(--spectrum-global-dimension-size-400)' : '720px',
            }}
        >
            <Flex gridArea={'header'} alignItems='center' gap={'size-100'} marginBottom={'size-300'}>
                <ActionButton
                    isQuiet
                    onPress={() => setIsHidden((hidden) => !hidden)}
                    UNSAFE_style={{
                        transform: isHidden ? 'scaleX(-1)' : 'scaleX(1)',
                        cursor: 'pointer',
                    }}
                >
                    <DoubleChevronRight />
                </ActionButton>
                <Heading level={4} isHidden={isHidden}>
                    Input source
                </Heading>
            </Flex>
            <View
                gridArea={'graphs'}
                isHidden={isHidden}
                UNSAFE_style={{ overflow: 'hidden auto' }}
                paddingX='size-200'
            >
                <AsideContent />
            </View>
        </Grid>
    );
};
