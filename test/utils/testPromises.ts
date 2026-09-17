import {createTestPromiseFactory} from './createTestPromiseFactory.js';

export const postfix = 'POSTFIX';

export const postfix2 = 'POSTFIX_2';

export const createTestPromiseResult = '_TEST_';

export const createTestPromise = createTestPromiseFactory({
    getResult: (args: {variables: {postfix?: string}}) => createTestPromiseResult + (args.variables.postfix ?? ''),
});

export const badPromiseError = new Error();

export const createBadTestPromise = createTestPromiseFactory({
    getResult: (_: {variables: null}) => {
        throw badPromiseError;
    },
});
