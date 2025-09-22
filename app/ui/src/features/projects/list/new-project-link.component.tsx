import { Button, Text } from '@geti/ui';
import { AddCircle } from '@geti/ui/icons';
import { Link } from 'react-router-dom';

import { $api } from '../../../api/client';
import { paths } from '../../../router';

import classes from './project-list.module.scss';

export const NewProjectLink = () => {
    const projectMutation = $api.useMutation('post', '/api/projects');

    return (
        <Button
            onPress={() => {
                projectMutation.mutate({ body: { name: 'Test' } });
            }}
            UNSAFE_className={classes.link}
            isPending={projectMutation.isPending}
        >
            <AddCircle />
            <Text>Add another project</Text>
        </Button>
    );
};
