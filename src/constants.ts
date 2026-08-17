/**
 * @module
 * Metadata keys and injection tokens used by the GraphQL module, mirroring the
 * string-key convention of the other Danet transports.
 */

/** Metadata key stashed by `@Resolver` on resolver classes. */
export const RESOLVER_METADATA = 'graphql:resolver';

/**
 * Metadata key stashed by `@Query` / `@Mutation` on resolver methods; value is
 * a {@link OperationMetadata}.
 */
export const OPERATION_METADATA = 'graphql:operation';

/** Injection token under which `GraphQLModule.forRoot` registers its options. */
export const GRAPHQL_OPTIONS = 'GRAPHQL_OPTIONS';

/** Operation metadata stored by `@Query` / `@Mutation` on resolver methods. */
export interface OperationMetadata {
	type: 'query' | 'mutation';
	name: string;
}
