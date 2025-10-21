import { Suspense, useEffect, useRef } from 'react';

import { $api } from '@geti-inspect/api';
import { SchemaJob as Job } from '@geti-inspect/api/spec';
import { useProjectIdentifier } from '@geti-inspect/hooks';
import { Content, Flex, Heading, InlineAlert, IntelBrandedLoading, ProgressBar, Text } from '@geti/ui';
import { useQueryClient } from '@tanstack/react-query';
import { differenceBy, isEqual } from 'lodash-es';

import { REQUIRED_NUMBER_OF_NORMAL_IMAGES_TO_TRIGGER_TRAINING } from './utils';

interface NotEnoughNormalImagesToTrainProps {
    mediaItemsCount: number;
}

const NotEnoughNormalImagesToTrain = ({ mediaItemsCount }: NotEnoughNormalImagesToTrainProps) => {
    const missingNormalImages = REQUIRED_NUMBER_OF_NORMAL_IMAGES_TO_TRIGGER_TRAINING - mediaItemsCount;

    return (
        <InlineAlert variant='neutral'>
            <Heading>{missingNormalImages} images required</Heading>
            <Content>
                Capture {missingNormalImages} images of normal cases. They help the model learn what is standard, so it
                can better detect anomalies.
            </Content>
        </InlineAlert>
    );
};

interface TrainingInProgressProps {
    job: Job;
}

const TrainingInProgress = ({ job }: TrainingInProgressProps) => {
    if (job === undefined) {
        return null;
    }

    if (job.status === 'pending') {
        const heading = `Training will start soon - ${job.payload.model_name}`;

        return (
            <InlineAlert variant='info'>
                <Heading>{heading}</Heading>
                <Content>
                    <Flex direction={'column'} gap={'size-100'}>
                        <Text>{job.message}</Text>
                        <ProgressBar aria-label='Training progress' isIndeterminate />
                    </Flex>
                </Content>
            </InlineAlert>
        );
    }

    if (job.status === 'running') {
        const heading = `Training in progress - ${job.payload.model_name}`;

        return (
            <InlineAlert variant='info'>
                <Heading>{heading}</Heading>
                <Content>
                    <Flex direction={'column'} gap={'size-100'}>
                        <Text>{job.message}</Text>
                        <ProgressBar value={job.progress} aria-label='Training progress' />
                    </Flex>
                </Content>
            </InlineAlert>
        );
    }

    if (job.status === 'failed') {
        const heading = `Training failed - ${job.payload.model_name}`;

        return (
            <InlineAlert variant='negative'>
                <Heading>{heading}</Heading>
                <Content>
                    <Text>{job.message}</Text>
                </Content>
            </InlineAlert>
        );
    }

    if (job.status === 'canceled') {
        const heading = `Training canceled - ${job.payload.model_name}`;

        return (
            <InlineAlert variant='negative'>
                <Heading>{heading}</Heading>
                <Content>
                    <Text>{job.message}</Text>
                </Content>
            </InlineAlert>
        );
    }

    if (job.status === 'completed') {
        const heading = `Training completed - ${job.payload.model_name}`;

        return (
            <InlineAlert variant='positive'>
                <Heading>{heading}</Heading>
                <Content>
                    <Text>{job.message}</Text>
                </Content>
            </InlineAlert>
        );
    }

    return null;
};

const REFETCH_INTERVAL_WITH_TRAINING = 1_000;

const useProjectTrainingJobs = () => {
    const { projectId } = useProjectIdentifier();

    const { data } = $api.useQuery('get', '/api/jobs', undefined, {
        refetchInterval: ({ state }) => {
            const projectHasTrainingJob = state.data?.jobs.some(
                ({ project_id, type, status }) =>
                    projectId === project_id && type === 'training' && (status === 'running' || status === 'pending')
            );

            return projectHasTrainingJob ? REFETCH_INTERVAL_WITH_TRAINING : undefined;
        },
    });

    return { jobs: data?.jobs.filter((job) => job.project_id === projectId) };
};

const useRefreshModelsOnJobUpdates = (jobs: Job[] | undefined) => {
    const queryClient = useQueryClient();
    const { projectId } = useProjectIdentifier();
    const prevJobsRef = useRef<Job[]>([]);

    useEffect(() => {
        if (jobs === undefined) {
            return;
        }

        if (!isEqual(prevJobsRef.current, jobs)) {
            const differenceInJobsBasedOnStatus = differenceBy(prevJobsRef.current, jobs, (job) => job.status);
            const shouldRefetchModels = differenceInJobsBasedOnStatus.some((job) => job.status === 'completed');

            if (shouldRefetchModels) {
                queryClient.invalidateQueries({
                    queryKey: [
                        'get',
                        '/api/projects/{project_id}/models',
                        { params: { path: { project_id: projectId } } },
                    ],
                });
            }
        }

        prevJobsRef.current = jobs ?? [];
    }, [jobs, queryClient, projectId]);
};

const TrainingInProgressList = () => {
    const { jobs } = useProjectTrainingJobs();
    useRefreshModelsOnJobUpdates(jobs);

    if (jobs === undefined || jobs.length === 0) {
        return null;
    }

    return (
        <Flex direction={'column'} gap={'size-50'} UNSAFE_style={{ overflowY: 'auto' }}>
            {jobs?.map((job) => <TrainingInProgress job={job} key={job.id} />)}
        </Flex>
    );
};

interface DatasetStatusPanelProps {
    mediaItemsCount: number;
}

export const DatasetStatusPanel = ({ mediaItemsCount }: DatasetStatusPanelProps) => {
    if (mediaItemsCount < REQUIRED_NUMBER_OF_NORMAL_IMAGES_TO_TRIGGER_TRAINING) {
        return <NotEnoughNormalImagesToTrain mediaItemsCount={mediaItemsCount} />;
    }

    return (
        <Suspense fallback={<IntelBrandedLoading />}>
            <TrainingInProgressList />
        </Suspense>
    );
};
