/**
 * @module
 * `@danet/graphql`: schema-first GraphQL endpoint for Danet applications,
 * executed by [graphql-js](https://www.npmjs.com/package/graphql) on the
 * application's own HTTP server.
 *
 * @example
 * ```typescript
 * import { DanetApplication, Module } from '@danet/core';
 * import { Args, GraphQLModule, Query, Resolver } from '@danet/graphql';
 *
 * const typeDefs = `
 * 	type Query {
 * 		hello(name: String): String
 * 	}
 * `;
 *
 * @Resolver()
 * class HelloResolver {
 * 	@Query()
 * 	hello(@Args('name') name: string) {
 * 		return `Hello ${name ?? 'world'}`;
 * 	}
 * }
 *
 * @Module({
 * 	imports: [GraphQLModule.forRoot({ typeDefs })],
 * 	injectables: [HelloResolver],
 * })
 * class AppModule {}
 *
 * const app = new DanetApplication();
 * await app.init(AppModule);
 * await app.listen(3000);
 * ```
 */

export * from './src/constants.ts';
export * from './src/decorator.ts';
export * from './src/params.ts';
export * from './src/module.ts';
export { GraphQLError } from './deps.ts';
