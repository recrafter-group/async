import type {SnapshotSerializer} from 'vitest';

// eslint-disable-next-line import/no-default-export
export default {
    serialize: (html) => html,
    test: () => true,
} satisfies SnapshotSerializer;
