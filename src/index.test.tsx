import {fireEvent, getByText, render} from '@testing-library/react';
import React from 'react';
import {test, expect, describe} from 'vitest';

import {jsonRenderers, renderJson} from '../test/utils/testData.js';
import {wrapPromiseFactory} from '../test/utils/wrapPromiseFactory.js';
import {postfix, postfix2, createTestPromise} from '../test/utils/testPromises.js';

import {AsyncGuard, useAutoAsync} from './index.js';

describe('AsyncGuard + useAutoAsync', () => {
    test('Should properly render component on each status', async () => {
        const {createPromise, waitForResolvePromise} = wrapPromiseFactory(createTestPromise);
        const TestComponent = (props: {postfix: string}) => {
            const {postfix} = props;
            const [asyncState] = useAutoAsync({createPromise, variables: {postfix}});
            return <AsyncGuard {...asyncState} {...jsonRenderers} />;
        };
        const {container, rerender} = render(<TestComponent postfix={postfix} />);
        expect(container.innerHTML).toMatchSnapshot('loading');
        await waitForResolvePromise();
        expect(container.innerHTML).toMatchSnapshot('success');
        rerender(<TestComponent postfix={postfix2} />);
        expect(container.innerHTML).toMatchSnapshot('updating');
        await waitForResolvePromise(2);
        expect(container.innerHTML).toMatchSnapshot('success');
    });

    test('Should properly render component after click on update button', async () => {
        const {createPromise, waitForResolvePromise} = wrapPromiseFactory(createTestPromise);
        const TestComponent = (props: {postfix: string}) => {
            const {postfix} = props;
            const [asyncState, asyncAction] = useAutoAsync({createPromise, variables: {postfix}});
            const createSlot = ({isWaiting}: {isWaiting: boolean}) => {
                return function render(renderProps: {data: string}) {
                    return (
                        <>
                            {renderJson(renderProps)}
                            <button disabled={isWaiting} onClick={() => asyncAction.restart()}>
                                Update
                            </button>
                        </>
                    );
                };
            };
            return (
                <AsyncGuard {...asyncState} {...jsonRenderers} updatingSlot={createSlot({isWaiting: true})}>
                    {createSlot({isWaiting: false})}
                </AsyncGuard>
            );
        };
        const {container} = render(<TestComponent postfix={postfix} />);
        await waitForResolvePromise();
        fireEvent(
            getByText(container, 'Update'),
            new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
            }),
        );
        expect(container.innerHTML).toMatchSnapshot('updating');
        await waitForResolvePromise(2);
        expect(container.innerHTML).toMatchSnapshot('success');
    });
});
