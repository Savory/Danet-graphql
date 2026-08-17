/**
 * @module
 * Centralized re-exports of the GraphQL runtime dependency
 * ([graphql-js](https://www.npmjs.com/package/graphql)), mirroring the
 * single-barrel dependency convention used by `@danet/core`'s `src/deps.ts`.
 */

export {
	buildSchema,
	execute,
	GraphQLError,
	parse,
	validate,
	validateSchema,
} from 'graphql';

export type {
	DocumentNode,
	ExecutionResult,
	GraphQLFieldResolver,
	GraphQLSchema,
} from 'graphql';
