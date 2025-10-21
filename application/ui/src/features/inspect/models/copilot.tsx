import React, { useState } from 'react';

import {
    ActionButton,
    Badge,
    Button,
    Cell,
    Column,
    Flex,
    Heading,
    Item,
    Picker,
    Row,
    SearchField,
    TableBody,
    TableHeader,
    TableView,
    Text,
    View,
} from '@adobe/react-spectrum';
import ChevronDown from '@spectrum-icons/workflow/ChevronDown';
import ChevronRight from '@spectrum-icons/workflow/ChevronRight';
import Dashboard from '@spectrum-icons/workflow/Dashboard';
import Image from '@spectrum-icons/workflow/Image';
import More from '@spectrum-icons/workflow/More';
import Search from '@spectrum-icons/workflow/Search';
import ThumbUp from '@spectrum-icons/workflow/ThumbUp';

interface Model {
    id: string;
    name: string;
    timestamp: string;
    architecture: string;
    status?: 'Active' | 'Inactive';
    metric?: 'Speed' | 'Accuracy' | null;
    isCustomized?: boolean;
    selected?: boolean;
}

interface Dataset {
    id: string;
    name: string;
    createdDate: string;
    imageCount: number;
    models: Model[];
}

export const DatasetModelsView = () => {
    const [datasets, setDatasets] = useState<Dataset[]>([
        {
            id: '1',
            name: 'Dataset #1',
            createdDate: '01 Oct 2025, 11:07 AM',
            imageCount: 3600,
            models: [
                {
                    id: '3',
                    name: 'Model Project #3',
                    timestamp: '01 Oct 2025, 11:07 AM',
                    architecture: 'PADIM',
                    status: 'Active',
                    metric: 'Speed',
                    selected: true,
                },
                {
                    id: '2',
                    name: 'Custom model name',
                    timestamp: '01 Oct 2025, 11:07 AM',
                    architecture: 'PatchCore',
                    isCustomized: true,
                },
                {
                    id: '1',
                    name: 'Model Project #1',
                    timestamp: '01 Oct 2025, 11:07 AM',
                    architecture: 'U-FLOW',
                    metric: 'Accuracy',
                },
            ],
        },
    ]);

    const [groupBy, setGroupBy] = useState('Dataset');
    const [sortBy, setSortBy] = useState('Active model');

    return (
        <View backgroundColor='gray-100' height='100%' padding='size-400'>
            {/* Header section */}
            <Flex justifyContent='space-between' alignItems='center' marginBottom='size-300'>
                <Heading level={1}>Models</Heading>
                <Button
                    variant='cta'
                    UNSAFE_style={{
                        borderRadius: '16px',
                        backgroundColor: 'rgb(0, 178, 255)',
                        border: 'none',
                    }}
                >
                    Train model
                    <Text marginStart='size-100'>»</Text>
                </Button>
            </Flex>

            <View borderTopWidth='thin' borderTopColor='gray-400' paddingTop='size-300'>
                {/* Filter controls */}
                <Flex alignItems='center' justifyContent='space-between' marginBottom='size-300'>
                    <Flex gap='size-200'>
                        <Picker
                            label='Grouped by:'
                            selectedKey={groupBy}
                            onSelectionChange={(selected) => setGroupBy(String(selected))}
                            width='size-3000'
                            UNSAFE_className='spectrum-Dropdown--quiet'
                        >
                            <Item key='Dataset'>Dataset</Item>
                            <Item key='Architecture'>Architecture</Item>
                            <Item key='Status'>Status</Item>
                        </Picker>

                        <Picker
                            label='Sort:'
                            selectedKey={sortBy}
                            onSelectionChange={(selected) => setSortBy(String(selected))}
                            width='size-3000'
                            UNSAFE_className='spectrum-Dropdown--quiet'
                        >
                            <Item key='Active model'>Active model</Item>
                            <Item key='Newest'>Newest</Item>
                            <Item key='Oldest'>Oldest</Item>
                        </Picker>
                    </Flex>

                    <ActionButton aria-label='Search' isQuiet>
                        <Search />
                    </ActionButton>
                </Flex>

                {/* Dataset section */}
                {datasets.map((dataset) => (
                    <View
                        key={dataset.id}
                        backgroundColor='gray-75'
                        marginBottom='size-300'
                        borderRadius='medium'
                        overflow='hidden'
                    >
                        <Flex
                            alignItems='center'
                            justifyContent='space-between'
                            padding='size-250'
                            paddingLeft='size-150'
                        >
                            <Flex alignItems='center' gap='size-150'>
                                <ActionButton isQuiet>
                                    <More />
                                </ActionButton>
                                <View>
                                    <Heading level={3} margin={0}>
                                        {dataset.name}
                                    </Heading>
                                    <Text UNSAFE_style={{ color: 'var(--spectrum-global-color-gray-500)' }}>
                                        Created: {dataset.createdDate}
                                    </Text>
                                </View>
                            </Flex>

                            <Flex alignItems='center' gap='size-200'>
                                <Flex alignItems='center' gap='size-100'>
                                    <Image size='S' />
                                    <Text>{dataset.imageCount.toLocaleString()}</Text>
                                </Flex>

                                <Button variant='primary' UNSAFE_style={{ borderRadius: '16px' }}>
                                    Train model
                                </Button>
                            </Flex>
                        </Flex>

                        {/* Models table */}
                        <TableView
                            aria-label={`Models in ${dataset.name}`}
                            overflowMode='wrap'
                            selectionMode='none'
                            UNSAFE_style={{
                                backgroundColor: 'var(--spectrum-global-color-gray-75)',
                                borderTop: '1px solid var(--spectrum-global-color-gray-300)',
                            }}
                        >
                            <TableHeader>
                                <Column width='60%'>MODEL NAME</Column>
                                <Column width='40%'>ARCHITECTURE</Column>
                            </TableHeader>
                            <TableBody>
                                {dataset.models.map((model) => (
                                    <Row
                                        key={model.id}
                                        UNSAFE_style={{
                                            borderLeft: model.selected
                                                ? '4px solid var(--spectrum-global-color-blue-500)'
                                                : '4px solid transparent',
                                            position: 'relative',
                                        }}
                                    >
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
                                                {model.status === 'Active' && (
                                                    <View
                                                        padding='size-50'
                                                        paddingX='size-150'
                                                        marginStart='size-100'
                                                        UNSAFE_style={{
                                                            backgroundColor: 'rgb(0, 178, 255)',
                                                            borderRadius: '16px',
                                                            fontSize: '0.75rem',
                                                        }}
                                                    >
                                                        <Flex alignItems='center' gap='size-75'>
                                                            <Dashboard size='XS' />
                                                            <Text>Active</Text>
                                                        </Flex>
                                                    </View>
                                                )}
                                            </Flex>
                                        </Cell>
                                        <Cell>
                                            <Flex justifyContent='space-between' alignItems='center'>
                                                <Text>{model.architecture}</Text>
                                                <Flex alignItems='center' gap='size-200'>
                                                    {model.metric && (
                                                        <Flex alignItems='center' gap='size-50'>
                                                            <ThumbUp size='S' />
                                                            <Text>{model.metric}</Text>
                                                        </Flex>
                                                    )}

                                                    {model.isCustomized && <Badge variant='info'>Customized</Badge>}

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
                    </View>
                ))}
            </View>
        </View>
    );
};

interface ModelRowProps {
    model: Model;
}

export const ModelRow = ({ model }: ModelRowProps) => {
    return (
        <Row
            UNSAFE_style={{
                borderLeft: model.selected
                    ? '4px solid var(--spectrum-global-color-blue-500)'
                    : '4px solid transparent',
                position: 'relative',
            }}
        >
            <Cell>
                <Flex alignItems='center' gap='size-100'>
                    <ChevronRight size='S' />
                    <View>
                        <Text>{model.name}</Text>
                        <Text UNSAFE_style={{ fontSize: '0.9rem', color: 'var(--spectrum-global-color-gray-500)' }}>
                            {model.timestamp}
                        </Text>
                    </View>
                    {model.status === 'Active' && (
                        <View
                            padding='size-50'
                            paddingX='size-150'
                            marginStart='size-100'
                            UNSAFE_style={{
                                backgroundColor: 'rgb(0, 178, 255)',
                                borderRadius: '16px',
                                fontSize: '0.75rem',
                            }}
                        >
                            <Flex alignItems='center' gap='size-75'>
                                <Dashboard size='XS' />
                                <Text>Active</Text>
                            </Flex>
                        </View>
                    )}
                </Flex>
            </Cell>
            <Cell>
                <Flex justifyContent='space-between' alignItems='center'>
                    <Text>{model.architecture}</Text>
                    <Flex alignItems='center' gap='size-200'>
                        {model.metric && (
                            <Flex alignItems='center' gap='size-50'>
                                <ThumbUp size='S' />
                                <Text>{model.metric}</Text>
                            </Flex>
                        )}

                        {model.isCustomized && <Badge variant='info'>Customized</Badge>}

                        <ActionButton isQuiet>
                            <More />
                        </ActionButton>
                    </Flex>
                </Flex>
            </Cell>
        </Row>
    );
};
