/**
 * @module
 * Builds the executable schema from the SDL and binds discovered resolver
 * methods to its root fields, wrapping each in the guard and parameter
 * resolution pipeline.
 */

import {
	type Constructor,
	GuardExecutor,
	injector,
	resolveMethodParam,
} from '@danet/core';
import type { HttpContext } from '@danet/core';
import { MetadataHelper } from '@danet/core/metadata';
import { buildSchema, type GraphQLSchema, validateSchema } from '../deps.ts';
import {
	OPERATION_METADATA,
	type OperationMetadata,
	RESOLVER_METADATA,
} from './constants.ts';
import type { GqlExecutionContext } from './params.ts';

/**
 * Parses the SDL into a `GraphQLSchema`, throwing a descriptive error when the
 * type definitions are invalid so `app.init()` fails fast.
 */
export function buildExecutableSchema(typeDefs: string): GraphQLSchema {
	let schema: GraphQLSchema;
	try {
		schema = buildSchema(typeDefs);
	} catch (error) {
		throw new Error(
			`Invalid GraphQL type definitions: ${(error as Error).message}`,
		);
	}
	const schemaErrors = validateSchema(schema);
	if (schemaErrors.length > 0) {
		throw new Error(
			`Invalid GraphQL schema: ${
				schemaErrors.map((error) => error.message).join('; ')
			}`,
		);
	}
	return schema;
}

/**
 * Scans the injector's injectables for `@Resolver` classes and binds each
 * `@Query`/`@Mutation` method to the matching schema root field, throwing when
 * a decorated name has no matching field.
 */
export function bindResolvers(schema: GraphQLSchema): void {
	const guardExecutor = new GuardExecutor(injector);
	const seen = new Set<unknown>();
	for (const instance of injector.injectables) {
		if (!MetadataHelper.IsObject(instance) || seen.has(instance)) {
			continue;
		}
		seen.add(instance);
		if (
			!MetadataHelper.getMetadata<boolean>(
				RESOLVER_METADATA,
				instance.constructor,
			)
		) {
			continue;
		}
		bindResolverInstance(schema, instance, guardExecutor);
	}
}

function bindResolverInstance(
	schema: GraphQLSchema,
	// deno-lint-ignore no-explicit-any
	instance: any,
	guardExecutor: GuardExecutor,
): void {
	const prototype = instance.constructor.prototype;
	for (const methodName of Object.getOwnPropertyNames(prototype)) {
		if (methodName === 'constructor') continue;
		const method = prototype[methodName];
		if (typeof method !== 'function') continue;
		const operation = MetadataHelper.getMetadata<OperationMetadata>(
			OPERATION_METADATA,
			method,
		);
		if (!operation) continue;
		const fieldName = operation.name || methodName;
		const decoratorName = operation.type === 'query' ? '@Query' : '@Mutation';
		const rootType = operation.type === 'query'
			? schema.getQueryType()
			: schema.getMutationType();
		const rootTypeName = operation.type === 'query' ? 'Query' : 'Mutation';
		const field = rootType?.getFields()[fieldName];
		if (!field) {
			throw new Error(
				`Cannot bind ${decoratorName}('${fieldName}') of ${instance.constructor.name}.${methodName}: type ${rootTypeName} has no field '${fieldName}'`,
			);
		}
		field.resolve = createFieldResolver(instance, method, guardExecutor);
	}
}

// Hono's Context relies on private class fields, so a prototype-chained child
// object cannot stand in for it. Each root field instead gets a facade whose
// methods and accessors delegate to the real context, keeping getClass,
// getHandler and graphqlArgs isolated between concurrently resolved fields.
function createFieldContext(honoContext: HttpContext): GqlExecutionContext {
	// deno-lint-ignore no-explicit-any
	const facade: any = {};
	let source: unknown = honoContext;
	while (source && source !== Object.prototype) {
		for (const key of Object.getOwnPropertyNames(source)) {
			if (key === 'constructor' || Object.hasOwn(facade, key)) continue;
			const descriptor = Object.getOwnPropertyDescriptor(source, key)!;
			if (typeof descriptor.value === 'function') {
				facade[key] = descriptor.value.bind(honoContext);
			} else if (descriptor.get || descriptor.set) {
				Object.defineProperty(facade, key, {
					get: descriptor.get?.bind(honoContext),
					set: descriptor.set?.bind(honoContext),
					configurable: true,
					enumerable: descriptor.enumerable,
				});
			} else {
				facade[key] = descriptor.value;
			}
		}
		source = Object.getPrototypeOf(source);
	}
	return facade as GqlExecutionContext;
}

function createFieldResolver(
	// deno-lint-ignore no-explicit-any
	instance: any,
	// deno-lint-ignore no-explicit-any
	method: (...args: any[]) => unknown,
	guardExecutor: GuardExecutor,
) {
	return async (
		_source: unknown,
		args: Record<string, unknown>,
		contextValue: unknown,
	): Promise<unknown> => {
		const context = createFieldContext(contextValue as HttpContext);
		context._id = crypto.randomUUID();
		context.getClass = () => instance.constructor as Constructor;
		context.getHandler = () => method;
		context.graphqlArgs = args;
		try {
			await guardExecutor.executeAllRelevantGuards(
				context,
				instance.constructor,
				method,
			);
			const params = await resolveMethodParam(
				instance.constructor,
				method,
				context,
			);
			return await method.apply(instance, params);
		} finally {
			injector.cleanRequestInjectables(context._id);
		}
	};
}
