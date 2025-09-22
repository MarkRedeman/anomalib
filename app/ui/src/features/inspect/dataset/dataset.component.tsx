import { Content, Divider, Flex, Grid, Heading, InlineAlert, minmax, repeat, View } from '@geti/ui';
import { $api } from 'src/api/client';
import { useProjectId } from 'src/features/projects/use-project';

import { AsideContent } from '../aside';
import { DatasetItem } from './dataset-item/dataset-item.component';

import styles from './dataset-item/dataset-item.module.scss';

const NotEnoughNormalImagesToTrain = () => {
    // TODO: This should change dynamically when user provides more normal images
    const requiredNumberOfNormalImages = 20;

    return (
        <InlineAlert variant='info'>
            <Heading>{requiredNumberOfNormalImages} images required</Heading>
            <Content>
                Capture {requiredNumberOfNormalImages} images of normal cases. They help the model learn what is
                standard, so it can better detect anomalies.
            </Content>
        </InlineAlert>
    );
};

const DatasetItemsList = () => {
    const { project_id } = useProjectId();
    const { data: uploadedImages } = $api.useSuspenseQuery('get', '/api/projects/{project_id}/images', {
        params: {
            path: {
                project_id,
            },
        },
    });

    const mediaItems = Array.from({ length: Math.max(0, 20 - uploadedImages.media.length) }).map((_, index) => ({
        id: index,
        mediaItem: undefined,
    }));

    return (
        <Grid
            flex={1}
            columns={repeat('auto-fill', minmax('size-1600', '1fr'))}
            gap={'size-100'}
            alignContent={'start'}
        >
            {uploadedImages.media.map((media) => {
                const media_id = media.id;
                const src = `/api/projects/${project_id}/images/${media_id}/full`;
                {
                    /* <View width='size-1700' height='size-1700'>
                    </View> */
                }
                return (
                    <img
                        src={src}
                        style={{
                            maxWidth: '100%',
                            objectFit: 'contain',
                        }}
                        className={styles.datasetItemPlaceholder}
                    />
                );
            })}

            {mediaItems.map(({ id, mediaItem }) => (
                <DatasetItem key={id} mediaItem={mediaItem} />
            ))}
        </Grid>
    );
};

export const Dataset = () => {
    return (
        <Flex direction={'column'} height={'100%'}>
            <Heading margin={0}>Dataset</Heading>
            <View flex={1} padding={'size-300'}>
                <Flex direction={'column'} height={'100%'} gap={'size-300'}>
                    <AsideContent />
                    <NotEnoughNormalImagesToTrain />

                    <Divider size={'S'} />

                    <DatasetItemsList />
                </Flex>
            </View>
        </Flex>
    );
};
