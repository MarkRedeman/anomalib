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
    TableBody,
    TableHeader,
    TableView,
    Text,
    View,
} from '@adobe/react-spectrum';
import ChevronRight from '@spectrum-icons/workflow/ChevronRight';
import Forward from '@spectrum-icons/workflow/Forward';
import More from '@spectrum-icons/workflow/More';

interface ModelData {
    id: string;
    name: string;
    timestamp: string;
    status: 'Training' | 'Completed' | 'Failed';
    architecture: string;
    progress: number;
}

const ModelsView = () => {
    const [models, setModels] = useState<ModelData[]>([
        {
            id: '1',
            name: 'Model #1',
            timestamp: '01 Oct 2025, 11:07 AM',
            status: 'Training',
            architecture: 'PADIM',
            progress: 15,
        },
    ]);

    return (
        <View backgroundColor='gray-100' height='100%' padding='size-400'>
            {/* Header section */}
            <Flex justifyContent='space-between' alignItems='center' marginBottom='size-300'>
                <Heading level={1}>Models</Heading>
                <Button variant='secondary' isQuiet UNSAFE_style={{ borderRadius: '16px' }}>
                    Train model
                    <Text>»</Text>
                </Button>
            </Flex>

            <View borderTopWidth='thin' borderTopColor='gray-400' paddingTop='size-300'>
                <Heading level={2} marginBottom='size-200'>
                    Current training
                </Heading>

                {/* Models Table */}
                <TableView aria-label='Models' overflowMode='wrap' selectionMode='none'>
                    <TableHeader>
                        <Column width='60%' UNSAFE_className='spectrum-Table-headCell'>
                            MODEL NAME
                        </Column>
                        <Column width='40%' UNSAFE_className='spectrum-Table-headCell'>
                            ARCHITECTURE
                        </Column>
                    </TableHeader>
                    <TableBody>
                        {models.map((model) => (
                            <Row>
                                <Cell>
                                    <Flex alignItems='center' gap='size-100'>
                                        <ChevronRight size='S' />
                                        <View>
                                            <Text>{model.name}</Text>
                                            <Text
                                                UNSAFE_style={{
                                                    fontSize: '0.9rem',
                                                    color: 'var(--spectrum-global-color-gray-500)',
                                                }}
                                            >
                                                {model.timestamp}
                                            </Text>
                                        </View>
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
                        ))}
                    </TableBody>
                </TableView>

                {models.length === 0 && (
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
                        <View>
                            <Text>{model.name}</Text>
                            <Text UNSAFE_style={{ fontSize: '0.9rem', color: 'var(--spectrum-global-color-gray-500)' }}>
                                {model.timestamp}
                            </Text>
                        </View>
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

export default ModelsView;

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
