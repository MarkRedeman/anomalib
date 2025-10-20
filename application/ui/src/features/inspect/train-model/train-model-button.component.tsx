import { Button, DialogTrigger } from '@geti/ui';

import { TrainModelDialog } from './train-model-dialog.component';

export const TrainModelButton = ({ isDisabled = false }: { isDisabled?: boolean }) => {
    return (
        <DialogTrigger type='modal'>
            <Button isDisabled={isDisabled}>Train model</Button>
            {(close) => <TrainModelDialog close={close} />}
        </DialogTrigger>
    );
};
