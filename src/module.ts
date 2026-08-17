/**
 * @module
 * `GraphQLModule`: import `GraphQLModule.forRoot({ typeDefs })` in a module
 * to serve a GraphQL endpoint from your application.
 */

import {
	APPLICATION_HOST,
	type DanetApplication,
	type DynamicModule,
	injector,
	Logger,
	Module,
} from '@danet/core';
import type { OnAppBootstrap } from '@danet/core/hook';
import { GRAPHQL_OPTIONS } from './constants.ts';
import { createGraphQLHandler } from './handler.ts';
import { bindResolvers, buildExecutableSchema } from './schema.ts';

/** Options accepted by {@link GraphQLModule.forRoot}. */
export interface GraphQLModuleOptions {
	/** Schema definition language type definitions, the source of truth. */
	typeDefs: string;
	/** Endpoint path, `/graphql` by default. */
	path?: string;
	/** Serve GraphiQL to browsers requesting the endpoint. Off by default. */
	playground?: boolean;
}

/**
 * Serves a schema-first GraphQL endpoint from the application: on bootstrap it
 * builds the executable schema from the SDL, binds `@Resolver` injectables'
 * `@Query`/`@Mutation` methods to its root fields, and mounts the endpoint on
 * the application's HTTP server.
 *
 * @example
 * ```typescript
 * @Module({
 * 	imports: [GraphQLModule.forRoot({ typeDefs })],
 * 	injectables: [TodoResolver],
 * })
 * class AppModule {}
 * ```
 */
@Module({})
export class GraphQLModule implements OnAppBootstrap {
	private logger: Logger = new Logger('GraphQLModule');

	/** Configures the GraphQL endpoint served by the importing application. */
	static forRoot(options: GraphQLModuleOptions): DynamicModule {
		return {
			module: GraphQLModule,
			injectables: [{ token: GRAPHQL_OPTIONS, useValue: options }],
		};
	}

	onAppBootstrap(): void {
		const options = injector.get<GraphQLModuleOptions>(GRAPHQL_OPTIONS);
		const schema = buildExecutableSchema(options.typeDefs);
		bindResolvers(schema);
		const app = injector.get<DanetApplication>(APPLICATION_HOST);
		const path = options.path ?? '/graphql';
		const handler = createGraphQLHandler(schema, {
			path,
			playground: options.playground ?? false,
		}, this.logger);
		app.router.get(path, handler);
		app.router.post(path, handler);
		this.logger.log(`GraphQL endpoint mounted on ${path}`);
	}
}
