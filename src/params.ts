/**
 * @module
 * Parameter decorators for resolver methods, built on core's
 * `createParamDecorator` so `resolveMethodParam` resolves them exactly like
 * controller parameters.
 */

import {
	createParamDecorator,
	type DecoratorFunction,
	type ExecutionContext,
} from '@danet/core';

/**
 * Danet's `ExecutionContext` extended with the GraphQL arguments of the field
 * being resolved.
 */
export type GqlExecutionContext = ExecutionContext & {
	graphqlArgs?: Record<string, unknown>;
};

/**
 * Injects the operation's arguments object for the field, or the single
 * argument `name` when one is given.
 */
export function Args(name?: string): DecoratorFunction {
	return createParamDecorator((context: ExecutionContext) => {
		const args = (context as GqlExecutionContext).graphqlArgs ?? {};
		return name ? args[name] : args;
	})();
}

/**
 * Injects the per-request execution context, giving access to the underlying
 * HTTP request (`context.req`).
 */
export function Context(): DecoratorFunction {
	return createParamDecorator((context: ExecutionContext) => {
		return context;
	})();
}
