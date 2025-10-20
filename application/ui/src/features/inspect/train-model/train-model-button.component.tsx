import { Button, DialogTrigger } from '@geti/ui';

import { TrainModelDialog } from './train-model-dialog.component';

export const TrainModelButton = () => {
    return (
        <DialogTrigger type='modal'>
            <Button>Train model</Button>
            {(close) => <TrainModelDialog close={close} />}
        </DialogTrigger>
    );
};
