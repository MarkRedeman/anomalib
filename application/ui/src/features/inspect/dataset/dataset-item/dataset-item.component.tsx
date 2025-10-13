import { Image } from '@geti-inspect/icons';
import { Flex, View } from '@geti/ui';
import { clsx } from 'clsx';

import { useInspect, useSetInspect } from '../../inspect-provider';
import { type MediaItem } from '../types';

import styles from './dataset-item.module.scss';

const DatasetItemPlaceholder = () => {
    return (
        <Flex
            justifyContent={'center'}
            alignItems={'center'}
            UNSAFE_className={clsx(styles.datasetItemPlaceholder, styles.datasetItem)}
        >
            <Flex>
                <Image />
            </Flex>
        </Flex>
    );
};

interface DatasetItemProps {
    mediaItem: MediaItem | undefined;
}

export const DatasetItem = ({ mediaItem }: DatasetItemProps) => {
    const setInspect = useSetInspect();
    const inspect = useInspect();

    if (mediaItem === undefined) {
        return <DatasetItemPlaceholder />;
    }

    const mediaUrl = `/api/projects/${mediaItem.project_id}/images/${mediaItem.id}/thumbnail`;

    const performInference = async () => {
        async function downloadImageAsFile(url: string, filename: string = 'image.png'): Promise<File> {
            const response = await fetch(url);
            const blob = await response.blob();
            return new File([blob], filename, { type: blob.type });
        }

        const mediaUrl = `/api/projects/${mediaItem.project_id}/images/${mediaItem.id}/full`;

        const formData = new FormData();
        formData.append('file', await downloadImageAsFile(mediaUrl));

        const project_id = mediaItem.project_id;
        const model_id = inspect.selectedModelId;
        const device = inspect.device;

        await inspect.inferMutation?.mutateAsync({
            params: { path: { project_id, model_id }, query: { device } },
            // @ts-expect-error There is an incorrect type in OpenAPI
            body: formData,
        });
    };

    return (
        <div
            onClick={() => {
                setInspect((inspect) => ({
                    ...inspect,
                    selectedImageId: mediaItem.id,
                }));
                performInference();
            }}
        >
            <View
                UNSAFE_className={clsx({
                    [styles.datasetItem]: true,
                    [styles.selectedDatasetItem]: inspect.selectedImageId === mediaItem.id,
                })}
            >
                <img src={mediaUrl} alt={mediaItem.filename} />
            </View>
        </div>
    );
};
