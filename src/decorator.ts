/**
 * @module
 * Class and method decorators that mark a class as a GraphQL resolver and map
 * its methods to schema root fields, wrapping core's `SetMetadata` like the
 * WebSocket and gRPC transports do.
 */

import { type MetadataFunction, SetMetadata } from '@danet/core/metadata';
import { OPERATION_METADATA, RESOLVER_METADATA } from './constants.ts';

/**
 * Marks a class as a GraphQL resolver so `GraphQLModule` discovers it among
 * the module's injectables and binds its decorated methods to schema fields.
 * Resolver classes are instantiated by the injector, so constructor
 * dependencies resolve like those of controllers.
 */
export function Resolver(): MetadataFunction {
	return SetMetadata(RESOLVER_METADATA, true);
}

/**
 * Binds the decorated method to the `Query` root field `name`, defaulting to
 * the method name when none is given.
 */
export function Query(name?: string): MetadataFunction {
	return SetMetadata(OPERATION_METADATA, { type: 'query', name: name ?? '' });
}

/**
 * Binds the decorated method to the `Mutation` root field `name`, defaulting
 * to the method name when none is given.
 */
export function Mutation(name?: string): MetadataFunction {
	return SetMetadata(OPERATION_METADATA, {
		type: 'mutation',
		name: name ?? '',
	});
}
