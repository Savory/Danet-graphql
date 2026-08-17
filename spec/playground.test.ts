import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { DanetApplication, Module } from '@danet/core';
import { GraphQLModule, Query, Resolver } from '@danet/graphql';

const typeDefs = `
	type Query {
		hello: String
	}
`;

@Resolver()
class HelloResolver {
	@Query()
	hello() {
		return 'world';
	}
}

@Module({
	imports: [GraphQLModule.forRoot({ typeDefs, playground: true })],
	injectables: [HelloResolver],
})
class PlaygroundModule {}

Deno.test('playground enabled serves an HTML editor to browsers', async (t) => {
	const app = new DanetApplication();
	try {
		await app.init(PlaygroundModule);
		const { port } = await app.listen(0);

		await t.step('GET with Accept: text/html returns GraphiQL', async () => {
			const res = await fetch(`http://localhost:${port}/graphql`, {
				headers: { Accept: 'text/html' },
			});
			assertStringIncludes(
				res.headers.get('content-type') ?? '',
				'text/html',
			);
			const html = await res.text();
			assertStringIncludes(html.toLowerCase(), 'graphiql');
		});

		await t.step('GET with a query still executes it', async () => {
			const res = await fetch(
				`http://localhost:${port}/graphql?query=${
					encodeURIComponent('{ hello }')
				}`,
				{ headers: { Accept: 'application/json' } },
			);
			assertEquals(await res.json(), { data: { hello: 'world' } });
		});
	} finally {
		await app.close();
	}
});

@Module({
	imports: [GraphQLModule.forRoot({ typeDefs })],
	injectables: [HelloResolver],
})
class NoPlaygroundModule {}

Deno.test(
	'playground omitted does not serve the HTML editor',
	async () => {
		const app = new DanetApplication();
		try {
			await app.init(NoPlaygroundModule);
			const { port } = await app.listen(0);
			const res = await fetch(`http://localhost:${port}/graphql`, {
				headers: { Accept: 'text/html' },
			});
			const contentType = res.headers.get('content-type') ?? '';
			assert(!contentType.includes('text/html'));
			const body = await res.text();
			assert(!body.toLowerCase().includes('graphiql'));
		} finally {
			await app.close();
		}
	},
);
