import { useState } from 'react';

import { $api } from '@geti-inspect/api';
import { useProjectIdentifier } from '@geti-inspect/hooks';
import { Button, Content, Flex, Heading, InlineAlert, Item, Picker, ProgressBar, Text } from '@geti/ui';
import { SchemaJob, SchemaJobStatus } from 'src/api/openapi-spec';

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

const useAvailableModels = () => {
    const AVAILABLE_MODELS = [
        {
            id: 'padim',
            name: 'PADIM',
        },
        {
            id: 'efficient_ad',
            name: 'efficient_ad',
        },
        {
            id: 'patchcore',
            name: 'patchcore',
        },
    ];
    return [
        'ai_vad',
        'cfa',
        'cflow',
        'csflow',
        'dfkde',
        'dfm',
        'draem',
        'efficient_ad',
        'fastflow',
        'fre',
        'ganomaly',
        'padim',
        'patchcore',
        'reverse_distillation',
        'stfpm',
        'uflow',
        'vlm_ad',
        'winclip',
    ].map((name) => ({ name, id: name }));

    return AVAILABLE_MODELS;
};

interface ReadyToTrainProps {
    onStartTraining: (body: { project_id: string; model_name: string }) => void;
    isPending: boolean;
}

const ReadyToTrain = ({ onStartTraining, isPending }: ReadyToTrainProps) => {
    const availableModels = useAvailableModels();
    const { projectId } = useProjectIdentifier();
    const [selectedModel, setSelectedModel] = useState<string>(availableModels[0].id);

    const startTraining = () => {
        onStartTraining({
            project_id: projectId,
            model_name: selectedModel,
        });
    };

    return (
        <InlineAlert variant='positive'>
            <Heading>Ready to train</Heading>
            <Content>
                <Flex direction={'column'} gap={'size-200'}>
                    <Text>You have enough normal images to train a model.</Text>

                    <Flex direction={'row'} alignItems={'end'} width={'100%'} gap={'size-200'} wrap={'wrap'}>
                        <Picker
                            label={'Model'}
                            selectedKey={selectedModel}
                            onSelectionChange={(key) => key !== null && setSelectedModel(String(key))}
                        >
                            {availableModels.map((model) => (
                                <Item key={model.id}>{model.name}</Item>
                            ))}
                        </Picker>

                        <Button isPending={isPending} onPress={startTraining}>
                            Start training
                        </Button>
                    </Flex>
                </Flex>
            </Content>
        </InlineAlert>
    );
};

interface TrainingInProgressProps {
    jobId: string;
}

const JobProgress = ({ job: jobProgress }: { job: SchemaJob }) => {
    const name = jobProgress.payload['model_name'] as string;

    if (jobProgress.status === 'completed') {
        return (
            <InlineAlert variant='info'>
                <Heading>{name} - Finished</Heading>
                <Content>
                    <Flex direction={'column'} gap={'size-100'}>
                        <Text>{jobProgress.message}</Text>
                        <ProgressBar aria-label='Training progress' isIndeterminate />
                    </Flex>
                </Content>
            </InlineAlert>
        );
    }

    if (jobProgress.status === 'pending') {
        return (
            <InlineAlert variant='info'>
                <Heading>{name} - Training will start soon</Heading>
                <Content>
                    <Flex direction={'column'} gap={'size-100'}>
                        <Text>{jobProgress.message}</Text>
                        <ProgressBar aria-label='Training progress' isIndeterminate />
                    </Flex>
                </Content>
            </InlineAlert>
        );
    }

    if (jobProgress.status === 'running') {
        return (
            <InlineAlert variant='info'>
                <Heading>{name} - Training in progress</Heading>
                <Content>
                    <Flex direction={'column'} gap={'size-100'}>
                        <Text>{jobProgress.message}</Text>
                        <ProgressBar value={jobProgress.progress} aria-label='Training progress' />
                    </Flex>
                </Content>
            </InlineAlert>
        );
    }

    if (jobProgress.status === 'failed') {
        return (
            <InlineAlert variant='negative'>
                <Heading>{name} - Training failed</Heading>
                <Content>
                    <Text>{jobProgress.message}</Text>
                </Content>
            </InlineAlert>
        );
    }

    if (jobProgress.status === 'canceled') {
        return (
            <InlineAlert variant='negative'>
                <Heading>{name} - Training canceled</Heading>
                <Content>
                    <Text>{jobProgress.message}</Text>
                </Content>
            </InlineAlert>
        );
    }
};

const TrainingInProgress = () => {
    const { data } = $api.useQuery('get', '/api/jobs', undefined, {
        refetchInterval: ({ state }) => {
            const job = state.data?.jobs.some((job) => job.status === 'pending' || job.status === 'running');

            if (job === undefined) {
                return undefined;
            } else {
                return 1000;
            }
        },
    });

    return (
        <Flex direction='column' gap='size-200'>
            {data?.jobs.map((job) => <JobProgress job={job} key={job.id} />)}
        </Flex>
    );
};

interface DatasetStatusPanelProps {
    mediaItemsCount: number;
}

export const DatasetStatusPanel = ({ mediaItemsCount }: DatasetStatusPanelProps) => {
    const startTrainingMutation = $api.useMutation('post', '/api/jobs:train');

    const handleStartTraining = (body: { project_id: string; model_name: string }) => {
        startTrainingMutation.mutate({
            body,
        });
    };

    // TODO: Investigate how to handle that case (local storage, poll for job status) after refreshing a page.
    if (startTrainingMutation.data !== undefined) {
        return (
            <>
                <ReadyToTrain isPending={startTrainingMutation.isPending} onStartTraining={handleStartTraining} />
                <TrainingInProgress />
            </>
        );
    }

    if (mediaItemsCount >= REQUIRED_NUMBER_OF_NORMAL_IMAGES_TO_TRIGGER_TRAINING) {
        return (
            <>
                <ReadyToTrain isPending={startTrainingMutation.isPending} onStartTraining={handleStartTraining} />
                <TrainingInProgress />
            </>
        );
    }

    return <NotEnoughNormalImagesToTrain mediaItemsCount={mediaItemsCount} />;
};
