import { assertEquals } from '@std/assert';
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
	imports: [GraphQLModule.forRoot({ typeDefs })],
	injectables: [HelloResolver],
})
class AppModule {}

Deno.test('POST query execution returns { data }', async () => {
	const app = new DanetApplication();
	try {
		await app.init(AppModule);
		const { port } = await app.listen(0);
		const res = await fetch(`http://localhost:${port}/graphql`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ query: '{ hello }' }),
		});
		const body = await res.json();
		assertEquals(body, { data: { hello: 'world' } });
	} finally {
		await app.close();
	}
});

Deno.test('GET query execution returns the JSON result', async () => {
	const app = new DanetApplication();
	try {
		await app.init(AppModule);
		const { port } = await app.listen(0);
		const res = await fetch(
			`http://localhost:${port}/graphql?query=${
				encodeURIComponent('{ hello }')
			}`,
		);
		const body = await res.json();
		assertEquals(body, { data: { hello: 'world' } });
	} finally {
		await app.close();
	}
});

@Module({
	imports: [GraphQLModule.forRoot({ typeDefs, path: '/api/gql' })],
	injectables: [HelloResolver],
})
class CustomPathModule {}

Deno.test('custom path serves there and not at /graphql', async () => {
	const app = new DanetApplication();
	try {
		await app.init(CustomPathModule);
		const { port } = await app.listen(0);

		const res = await fetch(`http://localhost:${port}/api/gql`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ query: '{ hello }' }),
		});
		const body = await res.json();
		assertEquals(body, { data: { hello: 'world' } });

		const defaultPathRes = await fetch(`http://localhost:${port}/graphql`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ query: '{ hello }' }),
		});
		assertEquals(defaultPathRes.status, 404);
		await defaultPathRes.body?.cancel();
	} finally {
		await app.close();
	}
});
