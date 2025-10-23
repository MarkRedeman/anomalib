import { Suspense } from 'react';

import { Badge } from '@adobe/react-spectrum';
import { $api } from '@geti-inspect/api';
import { useProjectIdentifier } from '@geti-inspect/hooks';
import {
    Button,
    Cell,
    Column,
    Divider,
    FileTrigger,
    Flex,
    Grid,
    Heading,
    IllustratedMessage,
    Loading,
    Row,
    TableBody,
    TableHeader,
    TableView,
    Text,
    toast,
    View,
} from '@geti/ui';
import { sortBy } from 'lodash-es';
import { useDateFormatter } from 'react-aria';
import { SchemaJob } from 'src/api/openapi-spec';

import { useProjectTrainingJobs, useRefreshModelsOnJobUpdates } from '../dataset/dataset-status-panel.component';
import { REQUIRED_NUMBER_OF_NORMAL_IMAGES_TO_TRIGGER_TRAINING } from '../dataset/utils';
import { useInference } from '../inference-provider.component';
import { ShowJobLogs } from '../jobs/show-job-logs.component';
import { TrainModelButton } from '../train-model/train-model-button.component';

const useMediaItems = () => {
    const { projectId } = useProjectIdentifier();

    const { data } = $api.useSuspenseQuery('get', '/api/projects/{project_id}/images', {
        params: {
            path: {
                project_id: projectId,
            },
        },
    });

    return {
        mediaItems: data.media,
    };
};

export const useJobs = () => {
    const { jobs } = useProjectTrainingJobs();

    //const { projectId } = useProjectIdentifier();
    //const jobsQuery = $api.useSuspenseQuery('get', '/api/jobs');
    //const jobs = jobsQuery.data.jobs.filter((job) => job.project_id === projectId);

    return jobs ?? [];
};

export const useModels = () => {
    const { projectId } = useProjectIdentifier();
    const modelsQuery = $api.useSuspenseQuery('get', '/api/projects/{project_id}/models', {
        params: { path: { project_id: projectId } },
    });
    const models = modelsQuery.data.models;

    return models;
};

interface ModelData {
    id: string;
    name: string;
    timestamp: string;
    startTime: number;
    duration: number; // seconds
    status: 'Training' | 'Completed' | 'Failed';
    architecture: string;
    progress: number;
    job: SchemaJob | undefined;
}

export const ModelsView = () => {
    const dateFormatter = useDateFormatter({ dateStyle: 'medium', timeStyle: 'short' });
    //const formattedStart = dateFormatter.format(start);
    //const formattedEnd = dateFormatter.format(end);

    const jobs = useJobs();
    useRefreshModelsOnJobUpdates(jobs);

    const models = useModels().map((model): ModelData => {
        const job = jobs.find((job) => {
            return job.id === model.train_job_id;
        });

        let timestamp = '';
        let duration = 0;
        const start = new Date(job?.start_time!);
        if (job) {
            const start = new Date(job.start_time!);
            const end = new Date(job.end_time!);
            const diffMs = end.getTime() - start.getTime(); // milliseconds
            const diffSec = Math.floor(diffMs / 1000);
            duration = diffSec;

            timestamp = dateFormatter.format(start);
        }

        return {
            id: model.id!,
            name: model.name!,
            status: 'Completed',
            architecture: model.name!,
            startTime: start.getTime(),
            timestamp,
            duration,
            progress: 1.0,
            job,
        };
    });

    const nonCompletedJobs = jobs
        .filter((job) => job.status !== 'completed')
        .map((job): ModelData => {
            const name = String(job.payload['model_name']);

            const start = new Date(job.start_time!);
            const timestamp = dateFormatter.format(start);
            return {
                id: job.id!,
                name,
                status: job.status === 'pending' ? 'Training' : job.status === 'running' ? 'Training' : 'Failed',
                architecture: name,
                timestamp,
                startTime: start.getTime(),
                progress: 1.0,
                duration: Infinity,
                job,
            };
        });

    const showModels = sortBy([...nonCompletedJobs, ...models], (model) => model.startTime);

    const { selectedModelId, onSetSelectedModelId } = useInference();

    return (
        <View backgroundColor='gray-100' height='100%' padding='size-200'>
            <View borderTopWidth='thin' borderTopColor='gray-400' backgroundColor={'gray-300'}>
                {/* Models Table */}
                <TableView
                    aria-label='Models'
                    overflowMode='wrap'
                    selectionStyle='highlight'
                    selectionMode='single'
                    selectedKeys={selectedModelId === undefined ? new Set() : new Set([selectedModelId])}
                    onSelectionChange={(key: Selection) => {
                        if (typeof key === 'string') {
                            return;
                        }

                        const selectedModelId = key.values().next().value;
                        const model = models.find((model) => model.id === selectedModelId);

                        onSetSelectedModelId(model?.id);
                    }}
                >
                    <TableHeader>
                        <Column colspan={2}>MODEL NAME</Column>
                        <Column> </Column>
                    </TableHeader>
                    <TableBody>
                        {showModels.map((model) => (
                            <Row key={model.id}>
                                <Cell>
                                    <Flex alignItems='start' gap='size-25' direction='column'>
                                        <Text>{model.name}</Text>
                                        <Text
                                            UNSAFE_style={{
                                                fontSize: '0.9rem',
                                                color: 'var(--spectrum-global-color-gray-500)',
                                            }}
                                        >
                                            {model.timestamp}
                                        </Text>
                                    </Flex>
                                </Cell>
                                <Cell>
                                    <Flex justifyContent='end' alignItems='center'>
                                        <Flex alignItems='center' gap='size-200'>
                                            {model.job?.status === 'pending' && <span>pending...</span>}
                                            {model.job?.status === 'running' && <span>{model.job.progress}%...</span>}
                                            {model.job?.status === 'canceled' && (
                                                <Badge variant='neutral'>Cancelled</Badge>
                                            )}
                                            {model.job?.status === 'failed' && <Badge variant='neutral'>Failed</Badge>}
                                            {selectedModelId === model.id && <Badge variant='info'>Active</Badge>}
                                            {model.job?.id && <ShowJobLogs jobId={model.job.id} />}
                                        </Flex>
                                    </Flex>
                                </Cell>
                            </Row>
                        ))}
                    </TableBody>
                </TableView>

                {jobs.length === 0 && models.length === 0 && (
                    <IllustratedMessage>
                        <Heading>No models in training</Heading>
                        <Text>Start a new training to see models here.</Text>
                    </IllustratedMessage>
                )}
            </View>
        </View>
    );
};

export const Models = () => {
    const { mediaItems } = useMediaItems();

    return (
        <Flex direction={'column'} height={'100%'}>
            <Heading margin={0}>
                <Flex justifyContent={'space-between'}>
                    Models
                    <Flex gap='size-200'>
                        <TrainModelButton
                            isDisabled={mediaItems.length < REQUIRED_NUMBER_OF_NORMAL_IMAGES_TO_TRIGGER_TRAINING}
                        />
                    </Flex>
                </Flex>
            </Heading>
            <Suspense fallback={<Loading mode={'inline'} />}>
                <View flex={1} padding={'size-50'}>
                    <Flex direction={'column'} height={'100%'} gap={'size-300'}>
                        <ModelsView />
                    </Flex>
                </View>
            </Suspense>
        </Flex>
    );
};
