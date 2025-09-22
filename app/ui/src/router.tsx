import { Suspense } from 'react';

import { Loading } from '@geti/ui';
import { createBrowserRouter, redirect } from 'react-router-dom';
import { path } from 'static-path';

import { ErrorPage } from './components/error-page/error-page';
import { Layout } from './layout';
import { Inspect } from './routes/inspect/inspect';
import { OpenApi } from './routes/openapi/openapi';
import { Index as Projects } from './routes/projects/index';

const root = path('/');
const projects = root.path('/projects');
const project = root.path('/projects/:project_id');

export const paths = {
    root,
    openapi: root.path('/openapi'),
    projects: {
        index: projects,
        new: projects.path('/new'),
    },
    project: {
        index: project,
    },
};

export const router = createBrowserRouter([
    {
        path: paths.root.pattern,
        element: (
            <Suspense fallback={<Loading mode='fullscreen' />}>
                <Layout />
            </Suspense>
        ),
        errorElement: <ErrorPage />,
        children: [
            {
                index: true,
                loader: () => {
                    return redirect(paths.project.index({ project_id: 'hoi' }));
                },
            },
            {
                path: paths.openapi.pattern,
                element: <OpenApi />,
            },
            {
                path: paths.projects.index.pattern,
                children: [
                    {
                        index: true,
                        element: <Projects />,
                    },
                ],
            },
            {
                path: paths.project.index.pattern,
                element: <Inspect />,
            },
        ],
    },
]);
