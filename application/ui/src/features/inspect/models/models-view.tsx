import React, { useState } from 'react';

import {
    ActionButton,
    Button,
    Cell,
    Column,
    Flex,
    Heading,
    IllustratedMessage,
    ProgressBar,
    Row,
    Selection,
    TableBody,
    TableHeader,
    TableView,
    Text,
    View,
} from '@adobe/react-spectrum';
import ChevronRight from '@spectrum-icons/workflow/ChevronRight';
import Forward from '@spectrum-icons/workflow/Forward';
import More from '@spectrum-icons/workflow/More';
import { useDateFormatter } from 'react-aria';
import { SchemaJob } from 'src/api/openapi-spec';

import { useRefreshModelsOnJobUpdates } from '../dataset/dataset-status-panel.component';
import { useInference } from '../inference-provider.component';
import { ShowJobLogs } from '../jobs/show-job-logs.component';
import { useJobs, useModels } from './models.component';

interface ModelData {
    id: string;
    name: string;
    timestamp: string;
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
            return {
                id: job.id!,
                name,
                status: job.status === 'pending' ? 'Training' : job.status === 'running' ? 'Training' : 'Failed',
                architecture: name,
                timestamp: '01 Oct 2025, 11:07 AM',
                progress: 1.0,
                duration: Infinity,
                job,
            };
        });

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
                        {[...nonCompletedJobs, ...models].map((model) => (
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
                                            {model.job && model.job.status}
                                            {selectedModelId === model.id && (
                                                <View
                                                    padding='size-50'
                                                    paddingX='size-150'
                                                    marginStart='size-100'
                                                    UNSAFE_style={{
                                                        backgroundColor: 'var(--spectrum-global-color-blue-400)',
                                                        borderRadius: '16px',
                                                        fontSize: '0.75rem',
                                                    }}
                                                >
                                                    <Text>Active</Text>
                                                </View>
                                            )}
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

interface ModelRowProps {
    model: ModelData;
}

const ModelRow = ({ model }: ModelRowProps) => {
    return (
        <View>
            <Row>
                <Cell>
                    <Flex alignItems='center' gap='size-100'>
                        <ChevronRight size='S' />
                        <Flex direction={'column'} gap='size-50'>
                            <Text>{model.name}</Text>
                            <Text UNSAFE_style={{ fontSize: '0.9rem', color: 'var(--spectrum-global-color-gray-500)' }}>
                                {model.timestamp}
                            </Text>
                        </Flex>
                        <View
                            padding='size-50'
                            paddingX='size-150'
                            marginStart='size-100'
                            UNSAFE_style={{
                                backgroundColor: 'var(--spectrum-global-color-blue-400)',
                                borderRadius: '16px',
                                fontSize: '0.75rem',
                            }}
                        >
                            <Text>{model.status}</Text>
                        </View>
                    </Flex>
                </Cell>
                <Cell>
                    <Flex justifyContent='space-between' alignItems='center'>
                        <Text>{model.architecture}</Text>
                        <Flex alignItems='center' gap='size-200'>
                            <Flex alignItems='center' gap='size-50'>
                                <Forward size='S' />
                                <Text>Speed</Text>
                            </Flex>
                            <ActionButton isQuiet>
                                <More />
                            </ActionButton>
                        </Flex>
                    </Flex>
                </Cell>
            </Row>

            {/* Progress bar container */}
            <View UNSAFE_style={{ height: '4px', marginTop: '-2px' }}>
                <ProgressBar
                    value={model.progress}
                    UNSAFE_className='spectrum-ProgressBar--quiet'
                    UNSAFE_style={{
                        height: '4px',
                        backgroundColor: 'transparent',
                        '--spectrum-progressbar-fill-color': 'var(--spectrum-global-color-blue-400)',
                    }}
                />
            </View>
        </View>
    );
};

const Progressssss = ({ model }) => {
    return (
        <View key={model.id}>
            {/* Progress bar container */}
            <View UNSAFE_style={{ height: '4px', marginTop: '-2px' }}>
                <ProgressBar
                    value={model.progress}
                    UNSAFE_className='spectrum-ProgressBar--quiet'
                    UNSAFE_style={{
                        height: '4px',
                        backgroundColor: 'transparent',
                        '--spectrum-progressbar-fill-color': 'var(--spectrum-global-color-blue-400)',
                    }}
                />
            </View>
        </View>
    );
};
