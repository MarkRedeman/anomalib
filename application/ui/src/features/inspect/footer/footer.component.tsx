// Copyright (C) 2025 Intel Corporation
// SPDX-License-Identifier: Apache-2.0

import { Suspense } from 'react';

import { $api } from '@geti-inspect/api';
import { SchemaJob as Job, SchemaJobStage } from '@geti-inspect/api/spec';
import { useProjectIdentifier } from '@geti-inspect/hooks';
import { Flex, ProgressBar, Text, View } from '@geti/ui';
import { CanceledIcon, WaitingIcon } from '@geti/ui/icons';
import { queryOptions, experimental_streamedQuery as streamedQuery, useQuery } from '@tanstack/react-query';
import { fetchSSE } from 'src/api/fetch-sse';

const IdleItem = () => {
    return (
        <Flex
            alignItems='center'
            width='size-3000'
            justifyContent='start'
            gap='size-100'
            height='100%'
            UNSAFE_style={{
                padding: '0 var(--spectrum-global-dimension-size-200)',
            }}
        >
            <WaitingIcon height='14px' width='14px' stroke='var(--spectrum-global-color-gray-600)' />
            <Text marginStart={'5px'} UNSAFE_style={{ color: 'var(--spectrum-global-color-gray-600)' }}>
                Idle
            </Text>
        </Flex>
    );
};

const getStyleForStage = (stage: SchemaJobStage) => {
    if (stage.toLowerCase().includes('valid')) {
        return {
            backgroundColor: 'var(--spectrum-global-color-yellow-600)',
            color: '#000',
        };
    } else if (stage.toLowerCase().includes('test')) {
        return {
            backgroundColor: 'var(--spectrum-global-color-green-600)',
            color: '#fff',
        };
    } else if (stage.toLowerCase().includes('train') || stage.toLowerCase().includes('fit')) {
        return {
            backgroundColor: 'var(--spectrum-global-color-blue-600)',
            color: '#fff',
        };
    }

    return {
        backgroundColor: 'var(--spectrum-global-color-blue-600)',
        color: '#fff',
    };
};

const TrainingStatusItem = ({
    progress,
    stage,
    onCancel,
}: {
    progress: number;
    stage: SchemaJobStage;
    onCancel?: () => void;
}) => {
    const { backgroundColor, color } = getStyleForStage(stage);

    return (
        <div
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor,
            }}
        >
            <Flex direction='row' alignItems='center' width='100px' justifyContent='space-between'>
                <button
                    onClick={() => {
                        console.info('Cancel training');
                        if (onCancel) {
                            onCancel();
                        }
                    }}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                    }}
                >
                    <CanceledIcon height='14px' width='14px' stroke={color} />
                </button>
                <Text
                    UNSAFE_style={{
                        fontSize: '12px',
                        marginBottom: '4px',
                        marginRight: '4px',
                        textAlign: 'center',
                        color,
                    }}
                >
                    {stage}
                </Text>
            </Flex>
            <ProgressBar value={progress} aria-label={stage} width='100px' showValueLabel={false} />
        </div>
    );
};

const useCurrentJob = () => {
    const { data: jobsData } = $api.useSuspenseQuery('get', '/api/jobs', undefined, {
        refetchInterval: 5000,
    });

    const { projectId } = useProjectIdentifier();
    const runningJob = jobsData.jobs.find(
        (job: Job) => job.project_id === projectId && (job.status === 'running' || job.status === 'pending')
    );

    if (runningJob === undefined) {
        return {
            currentJobId: null,
            status: null,
            stage: null,
            progress: null,
        };
    }

    return {
        currentJobId: runningJob.id,
        status: runningJob.status,
        stage: runningJob.stage,
        progress: runningJob.progress,
    };
};

export const ProgressBarItem = () => {
    const { currentJobId, progress: jobProgress, stage: jobStage, status: jobStatus } = useCurrentJob();

    const query = useQuery(
        queryOptions({
            queryKey: ['get', '/api/jobs/{job_id}/progress', currentJobId],
            queryFn: streamedQuery({
                queryFn: () => fetchSSE(`/api/jobs/${currentJobId}/progress`),
                maxChunks: 1,
            }),
            staleTime: Infinity,
            enabled: currentJobId !== null,
        })
    );

    // Get the job progress and stage from the last SSE message, or fallback
    const lastJobProgress = query.data?.at(-1);
    const progress = lastJobProgress?.progress ?? jobProgress ?? null;
    const stage = lastJobProgress?.stage ?? jobStage ?? null;

    //
    const cancelJobMutation = $api.useMutation('post', '/api/jobs/{job_id}:cancel');
    const handleCancel = async () => {
        if (!currentJobId) {
            return;
        }

        try {
            await cancelJobMutation.mutateAsync({
                params: {
                    path: {
                        job_id: currentJobId,
                    },
                },
            });
            console.info('Job cancelled successfully');
        } catch (error) {
            console.error('Failed to cancel job:', error);
        }
    };

    if (jobStatus === 'running') {
        return <TrainingStatusItem progress={progress ?? 0} stage={stage ?? ''} onCancel={handleCancel} />;
    }

    return <IdleItem />;
};

export const Footer = () => {
    return (
        <View gridArea={'footer'} backgroundColor={'gray-100'} width={'100%'} height={'size-400'} overflow={'hidden'}>
            <Suspense>
                <ProgressBarItem />
            </Suspense>
        </View>
    );
};
