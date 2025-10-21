import React from 'react';

import { Button, Cell, Column, ProgressBar, Row, Table, TableBody, TableHeader } from 'react-aria-components';

export const ModelsView = () => {
    return (
        <div className='bg-gray-900 text-white p-8'>
            {/* Header section */}
            <div className='flex justify-between items-center mb-6'>
                <h1 className='text-2xl font-semibold'>Models</h1>
                <Button className='bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 px-6 rounded-full flex items-center gap-2'>
                    Train model
                    <span className='text-lg'>»</span>
                </Button>
            </div>

            <div className='border-t border-gray-700 pt-6'>
                <h2 className='text-gray-300 mb-4'>Current training</h2>

                {/* Table structure */}
                <Table aria-label='Models' className='w-full'>
                    <TableHeader>
                        <Column id='modelName' className='py-4 px-6 bg-gray-800 text-left font-medium'>
                            MODEL NAME
                        </Column>
                        <Column id='architecture' className='py-4 px-6 bg-gray-800 text-left font-medium'>
                            ARCHITECTURE
                        </Column>
                    </TableHeader>
                    <TableBody>
                        {/* Each model row will be wrapped in a custom component to handle the progress bar */}
                        <ModelRowWithProgress
                            model={{
                                id: '1',
                                name: 'Model #1',
                                timestamp: '01 Oct 2025, 11:07 AM',
                                status: 'Training',
                                architecture: 'PADIM',
                                progress: 15,
                            }}
                        />
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

interface ModelData {
    id: string;
    name: string;
    timestamp: string;
    status: 'Training' | 'Completed' | 'Failed';
    architecture: string;
    progress: number;
}

interface ModelRowProps {
    model: ModelData;
}

const ModelRowWithProgress = ({ model }: ModelRowProps) => {
    return (
        <div className='relative'>
            {/* The actual table row */}
            <Row className='bg-gray-800 hover:bg-gray-750 cursor-pointer'>
                <Cell className='py-4 px-6 relative'>
                    <div className='flex items-center'>
                        <span className='text-gray-400 mr-2'>›</span>
                        <div>
                            <div className='font-medium'>{model.name}</div>
                            <div className='text-gray-400 text-sm'>{model.timestamp}</div>
                        </div>
                        <span className='ml-3 bg-cyan-500 text-xs rounded-full px-3 py-1'>{model.status}</span>
                    </div>
                </Cell>
                <Cell className='py-4 px-6 flex justify-between items-center'>
                    <div>{model.architecture}</div>
                    <div className='flex items-center gap-4'>
                        <div className='flex items-center gap-1 text-gray-300'>
                            <svg
                                xmlns='http://www.w3.org/2000/svg'
                                className='h-5 w-5'
                                fill='none'
                                viewBox='0 0 24 24'
                                stroke='currentColor'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M14 5l7 7m0 0l-7 7m7-7H3'
                                />
                            </svg>
                            <span>Speed</span>
                        </div>
                        <button className='text-gray-400 hover:text-white'>
                            <svg
                                xmlns='http://www.w3.org/2000/svg'
                                className='h-5 w-5'
                                viewBox='0 0 20 20'
                                fill='currentColor'
                            >
                                <path d='M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z' />
                            </svg>
                        </button>
                    </div>
                </Cell>
            </Row>

            {/* Progress bar positioned below the row */}
            <div className='w-full h-1 bg-gray-700'>
                <ProgressBar
                    value={model.progress}
                    maxValue={100}
                    className='h-full'
                    barClassName='h-full bg-cyan-500'
                    formatOptions={{ style: 'percent' }}
                />
            </div>
        </div>
    );
};
