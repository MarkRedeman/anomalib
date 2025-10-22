import { Suspense } from 'react';

import { $api } from '@geti-inspect/api';
import { useProjectIdentifier } from '@geti-inspect/hooks';
import { Button, Divider, FileTrigger, Flex, Grid, Heading, Loading, toast, View } from '@geti/ui';

import { REQUIRED_NUMBER_OF_NORMAL_IMAGES_TO_TRIGGER_TRAINING } from '../dataset/utils';
import { TrainModelButton } from '../train-model/train-model-button.component';
import { DatasetModelsView } from './copilot';
import ModelsView from './models-view';

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
    const { projectId } = useProjectIdentifier();
    const jobsQuery = $api.useSuspenseQuery('get', '/api/jobs');
    const jobs = jobsQuery.data.jobs.filter((job) => job.project_id === projectId);

    return jobs;
};

export const useModels = () => {
    const { projectId } = useProjectIdentifier();
    const modelsQuery = $api.useSuspenseQuery('get', '/api/projects/{project_id}/models', {
        params: { path: { project_id: projectId } },
    });
    const models = modelsQuery.data.models;

    return models;
};

const ModelsContent = () => {
    const { projectId } = useProjectIdentifier();

    const jobs = useJobs();
    const models = useModels();

    return (
        <>
            <View>Training jobs</View>
            <Grid areas={['_ model_name architecture _', 'collapse model_name architecture menu']}>
                <View></View>
            </Grid>

            <ul>
                <Flex gap='size-200' direction={'column'}>
                    {jobs.map((job) => {
                        return (
                            <View backgroundColor={'gray-50'} padding='size-100' key={job.id}>
                                {' '}
                                {JSON.stringify(job)}{' '}
                            </View>
                        );
                    })}
                </Flex>
            </ul>

            <Divider size={'S'} />

            <View>Trained modesl</View>
            <ul>
                <Flex gap='size-200' direction={'column'}>
                    {models.map((model) => {
                        return (
                            <View backgroundColor={'gray-200'} padding='size-100' key={model.id}>
                                {' '}
                                {JSON.stringify(model)}{' '}
                            </View>
                        );
                    })}
                </Flex>
            </ul>
        </>
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
