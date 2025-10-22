import { CSSProperties, FC, ReactNode } from 'react';

import { $api } from '@geti-inspect/api';
import { Content, ContextualHelp, Flex, Grid, Heading, minmax, Radio, repeat, Text, View } from '@geti/ui';
import clsx from 'clsx';
import { capitalize } from 'lodash-es';

import classes from './train-model.module.scss';

const useAvailableModels = () => {
    const { data } = $api.useSuspenseQuery('get', '/api/trainable-models', undefined, {
        staleTime: Infinity,
        gcTime: Infinity,
    });

    return data.trainable_models.map((model) => ({ id: model, name: model }));
};

type Ratings = 'LOW' | 'MEDIUM' | 'HIGH';

const RateColorPalette = {
    LOW: 'var(--energy-blue-tint2)',
    MEDIUM: 'var(--energy-blue-tint1)',
    HIGH: 'var(--energy-blue)',
    EMPTY: 'var(--spectrum-global-color-gray-500)',
};

const RateColors = {
    LOW: [RateColorPalette.LOW, RateColorPalette.EMPTY, RateColorPalette.EMPTY],
    MEDIUM: [RateColorPalette.LOW, RateColorPalette.MEDIUM, RateColorPalette.EMPTY],
    HIGH: [RateColorPalette.LOW, RateColorPalette.MEDIUM, RateColorPalette.HIGH],
};

interface AttributeRatingProps {
    name: string;
    rating: Ratings;
}

const AttributeRating = ({ name, rating }: AttributeRatingProps) => {
    return (
        <div aria-label={`Attribute rating for ${name} is ${rating}`} style={{ height: '100%' }}>
            <Flex direction={'column'} gap={'size-100'} justifyContent={'space-between'} height={'100%'}>
                <Heading margin={0} UNSAFE_className={classes.attributeRatingTitle}>
                    {name}
                </Heading>
                <Flex alignItems={'center'} gap={'size-100'}>
                    {RateColors[rating].map((color, idx) => (
                        <View
                            key={idx}
                            UNSAFE_className={classes.rate}
                            UNSAFE_style={{
                                backgroundColor: color,
                            }}
                        />
                    ))}
                </Flex>
            </Flex>
        </div>
    );
};

enum PerformanceCategory {
    OTHER = 'other',
    SPEED = 'speed',
    BALANCE = 'balance',
    ACCURACY = 'accuracy',
}

type SupportedAlgorithmStatsValues = 1 | 2 | 3;

interface SupportedAlgorithm {
    name: string;
    modelTemplateId: string;
    performanceCategory: PerformanceCategory;
    performanceRatings: {
        accuracy: SupportedAlgorithmStatsValues;
        inferenceSpeed: SupportedAlgorithmStatsValues;
        trainingTime: SupportedAlgorithmStatsValues;
    };
    license: string;
}

interface ModelTypeProps {
    name: string;
    algorithm: SupportedAlgorithm;
    selectedModelTemplateId: string | null;
    onChangeSelectedTemplateId: (modelTemplateId: string | null) => void;
    activeModelTemplateId: string | null;
}

interface TemplateRatingProps {
    ratings: {
        inferenceSpeed: Ratings;
        trainingTime: Ratings;
        accuracy: Ratings;
    };
}

const TemplateRating = ({ ratings }: TemplateRatingProps) => {
    return (
        <Grid columns={repeat(3, '1fr')} justifyContent={'space-evenly'} gap={'size-250'}>
            <AttributeRating name={'Inference speed'} rating={ratings.inferenceSpeed} />
            <AttributeRating name={'Training time'} rating={ratings.trainingTime} />
            <AttributeRating name={'Accuracy'} rating={ratings.accuracy} />
        </Grid>
    );
};

interface InfoTooltipProps {
    id?: string;
    tooltipText: ReactNode;
    iconColor?: string | undefined;
    className?: string;
}

const InfoTooltip = ({ tooltipText, id, iconColor, className }: InfoTooltipProps) => {
    const style = iconColor ? ({ '--spectrum-alias-icon-color': iconColor } as CSSProperties) : {};

    return (
        <ContextualHelp variant='info' id={id} data-testid={id} UNSAFE_className={className} UNSAFE_style={style}>
            <Content marginTop='0'>
                <Text>{tooltipText}</Text>
            </Content>
        </ContextualHelp>
    );
};

type PerformanceRating = SupportedAlgorithm['performanceRatings'][keyof SupportedAlgorithm['performanceRatings']];

const RATING_MAP: Record<PerformanceRating, Ratings> = {
    1: 'LOW',
    2: 'MEDIUM',
    3: 'HIGH',
};

const ModelType: FC<ModelTypeProps> = ({ name, algorithm, selectedModelTemplateId }) => {
    const { modelTemplateId, performanceRatings } = algorithm;
    const isSelected = selectedModelTemplateId === modelTemplateId;

    return (
        <label
            htmlFor={`select-model-${algorithm.modelTemplateId}`}
            aria-label={isSelected ? 'Selected card' : 'Not selected card'}
            className={[classes.selectableCard, isSelected ? classes.selectableCardSelected : ''].join(' ')}
        >
            <View
                position={'relative'}
                paddingX={'size-175'}
                paddingY={'size-125'}
                borderTopWidth={'thin'}
                borderTopEndRadius={'regular'}
                borderTopStartRadius={'regular'}
                borderTopColor={'gray-200'}
                backgroundColor={'gray-200'}
                UNSAFE_className={isSelected ? classes.selectedHeader : ''}
            >
                <Flex alignItems={'center'} gap={'size-50'} marginBottom='size-50'>
                    <Radio value={modelTemplateId} aria-label={name} id={`select-model-${algorithm.modelTemplateId}`}>
                        <Heading UNSAFE_className={clsx({ [classes.selected]: isSelected })}>{name}</Heading>
                    </Radio>
                    <InfoTooltip
                        id={`${name.toLocaleLowerCase()}-summary-id`}
                        tooltipText={
                            //<ModelArchitectureTooltipText description={description} isDeprecated={isDeprecated} />
                            'test'
                        }
                        iconColor={isSelected ? 'var(--energy-blue)' : undefined}
                    />
                </Flex>
            </View>
            <View
                flex={1}
                paddingX={'size-250'}
                paddingY={'size-225'}
                borderBottomWidth={'thin'}
                borderBottomEndRadius={'regular'}
                borderBottomStartRadius={'regular'}
                borderBottomColor={'gray-100'}
                minHeight={'size-1000'}
                UNSAFE_className={[
                    classes.selectableCardDescription,
                    isSelected ? classes.selectedDescription : '',
                ].join(' ')}
            >
                <Flex direction={'column'} gap={'size-200'}>
                    <TemplateRating
                        ratings={{
                            accuracy: RATING_MAP[performanceRatings.accuracy],
                            trainingTime: RATING_MAP[performanceRatings.trainingTime],
                            inferenceSpeed: RATING_MAP[performanceRatings.inferenceSpeed],
                        }}
                    />
                </Flex>
            </View>
        </label>
    );
};

interface ModelTypesListProps {
    selectedModelTemplateId: string | null;
    onChangeSelectedTemplateId: (modelTemplateId: string | null) => void;
    activeModelTemplateId: string | null;
}

export const TrainableModelListBox: FC<ModelTypesListProps> = ({
    selectedModelTemplateId,
    onChangeSelectedTemplateId,
    activeModelTemplateId,
}) => {
    const availableModels = useAvailableModels();
    const algorithms = availableModels.map((model) => {
        return {
            modelTemplateId: model.id,
            name: capitalize(model.name),
            license: 'Apache 2.0',
            performanceRatings: {
                accuracy: 1,
                inferenceSpeed: 1,
                trainingTime: 1,
            },
            performanceCategory: PerformanceCategory.OTHER,
        } satisfies SupportedAlgorithm;
    });

    return (
        <Grid columns={repeat('auto-fit', minmax('size-3400', '1fr'))} gap={'size-250'}>
            {algorithms.map((algorithm) => {
                const isRecommendedAlgorithm = false;
                const name = isRecommendedAlgorithm ? capitalize(algorithm.performanceCategory) : algorithm.name;

                return (
                    <ModelType
                        key={algorithm.modelTemplateId}
                        name={name}
                        algorithm={algorithm}
                        selectedModelTemplateId={selectedModelTemplateId}
                        onChangeSelectedTemplateId={onChangeSelectedTemplateId}
                        activeModelTemplateId={activeModelTemplateId}
                    />
                );
            })}
        </Grid>
    );
};
