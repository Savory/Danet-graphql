/**
 * @module
 * The single Hono handler serving the GraphQL endpoint: `POST` JSON bodies,
 * `GET` query parameters, and the GraphiQL page for browsers when enabled.
 * Failures always come back as a GraphQL `errors` response, never as a
 * transport-level crash.
 */

import type { HttpContext, Logger } from '@danet/core';
import {
	type DocumentNode,
	execute,
	type ExecutionResult,
	type GraphQLError,
	type GraphQLSchema,
	parse,
	validate,
} from '../deps.ts';
import { graphiqlHtml } from './playground.ts';

interface GraphQLRequestParams {
	query?: string;
	variables?: Record<string, unknown>;
	operationName?: string;
}

interface HandlerOptions {
	path: string;
	playground: boolean;
}

interface ShapedError {
	message: string;
	locations?: unknown;
	path?: unknown;
}

/** Creates the Hono handler for the GraphQL endpoint. */
export function createGraphQLHandler(
	schema: GraphQLSchema,
	options: HandlerOptions,
	logger: Logger,
): (context: HttpContext) => Promise<Response> {
	return async (context: HttpContext): Promise<Response> => {
		if (
			context.req.method === 'GET' && options.playground &&
			(context.req.header('accept') ?? '').includes('text/html')
		) {
			return context.html(graphiqlHtml(options.path));
		}

		let params: GraphQLRequestParams;
		try {
			params = await extractParams(context);
		} catch {
			return context.json(errorResponse('Invalid request body'));
		}
		if (!params.query) {
			return context.json(errorResponse('Must provide a query'));
		}

		let document: DocumentNode;
		try {
			document = parse(params.query);
		} catch (error) {
			return context.json({
				errors: [shapeError(error as GraphQLError)],
			});
		}

		const validationErrors = validate(schema, document);
		if (validationErrors.length > 0) {
			return context.json({ errors: validationErrors.map(shapeError) });
		}

		const result = await execute({
			schema,
			document,
			variableValues: params.variables,
			operationName: params.operationName,
			contextValue: context,
		});
		return context.json(shapeResult(result, logger));
	};
}

async function extractParams(
	context: HttpContext,
): Promise<GraphQLRequestParams> {
	if (context.req.method === 'POST') {
		const body = await context.req.json<GraphQLRequestParams>();
		return typeof body === 'object' && body !== null ? body : {};
	}
	const variables = context.req.query('variables');
	return {
		query: context.req.query('query'),
		operationName: context.req.query('operationName'),
		variables: variables ? JSON.parse(variables) : undefined,
	};
}

function errorResponse(message: string): { errors: ShapedError[] } {
	return { errors: [{ message }] };
}

function shapeError(error: GraphQLError): ShapedError {
	return {
		message: error.message,
		locations: error.locations,
		path: error.path,
	};
}

function shapeResult(
	result: ExecutionResult,
	logger: Logger,
): { data?: unknown; errors?: ShapedError[] } {
	if (!result.errors?.length) {
		return { data: result.data };
	}
	for (const error of result.errors) {
		logger.error(error.originalError?.stack ?? error.message);
	}
	return {
		data: result.data,
		errors: result.errors.map(shapeError),
	};
}
