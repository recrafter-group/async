import React from 'react';
import {render} from '@testing-library/react';
import {test, expect, describe} from 'vitest';

import {
    elementRenderers,
    jsonRenderers,
    LOADING_FAILURE_ASYNC_STATE,
    SUCCESS_ASYNC_STATE,
    UNKNOWN_ASYNC_STATE,
    UPDATING_ABORT_ASYNC_STATE,
    UPDATING_ASYNC_STATE,
    UPDATING_FAILURE_ASYNC_STATE,
} from '../test/utils/testData.js';

import {AsyncGuard} from './AsyncGuard.js';
import {LOADING_ABORT_ASYNC_STATE, LOADING_ASYNC_STATE, SKIP_ASYNC_STATE} from './constants.js';

describe.each([
    SUCCESS_ASYNC_STATE,
    LOADING_ASYNC_STATE,
    LOADING_ABORT_ASYNC_STATE,
    LOADING_FAILURE_ASYNC_STATE,
    UPDATING_ASYNC_STATE,
    UPDATING_ABORT_ASYNC_STATE,
    UPDATING_FAILURE_ASYNC_STATE,
    SKIP_ASYNC_STATE,
    UNKNOWN_ASYNC_STATE,
])('%#', (props) => {
    const {status} = props;

    test(`${status} without renderers`, () => {
        const {container} = render(<AsyncGuard {...props} />);
        expect(container.innerHTML).toMatchSnapshot();
    });

    test(`${status} with elements as renderers`, () => {
        const {container} = render(<AsyncGuard {...props} {...elementRenderers} />);
        expect(container.innerHTML).toMatchSnapshot();
    });

    test(`${status} with render functions`, () => {
        const {container} = render(<AsyncGuard {...props} {...jsonRenderers} />);
        expect(container.innerHTML).toMatchSnapshot();
    });

    test(`${status} with render functions and unexpected properties`, () => {
        const {container} = render(<AsyncGuard {...props} {...jsonRenderers} {...{unexpectedProperty: 'foo'}} />);
        expect(container.innerHTML).toMatchSnapshot();
    });
});
