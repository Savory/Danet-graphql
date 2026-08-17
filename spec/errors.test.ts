import {
	assert,
	assertEquals,
	assertExists,
	assertFalse,
	assertStringIncludes,
} from '@std/assert';
import { DanetApplication, Module } from '@danet/core';
import { GraphQLModule, Query, Resolver } from '@danet/graphql';

const typeDefs = `
	type Query {
		hello: String
		boom: String
	}
`;

@Resolver()
class ErrorProneResolver {
	@Query()
	hello() {
		return 'world';
	}

	@Query()
	boom(): string {
		throw new Error('kaboom');
	}
}

@Module({
	imports: [GraphQLModule.forRoot({ typeDefs })],
	injectables: [ErrorProneResolver],
})
class AppModule {}

Deno.test('error shaping', async (t) => {
	const app = new DanetApplication();
	try {
		await app.init(AppModule);
		const { port } = await app.listen(0);
		const url = `http://localhost:${port}/graphql`;

		await t.step(
			'query failing validation returns errors without transport failure',
			async () => {
				const res = await fetch(url, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ query: '{ nonexistent }' }),
				});
				assert(res.status >= 200 && res.status < 300);
				const body = await res.json();
				assertExists(body.errors);
				assertStringIncludes(body.errors[0].message, 'nonexistent');
				assertEquals(body.data, undefined);
			},
		);

		await t.step(
			'syntactically invalid query returns errors without transport failure',
			async () => {
				const res = await fetch(url, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ query: '{ hello' }),
				});
				assert(res.status >= 200 && res.status < 300);
				const body = await res.json();
				assertExists(body.errors);
				assertEquals(body.data, undefined);
			},
		);

		await t.step(
			'throwing resolver surfaces its message without a stack trace',
			async () => {
				const res = await fetch(url, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ query: '{ boom }' }),
				});
				assert(res.status >= 200 && res.status < 300);
				const raw = await res.text();
				const body = JSON.parse(raw);
				assertEquals(body.errors[0].message, 'kaboom');
				assertEquals(body.data, { boom: null });
				assertFalse(raw.includes('errors.test.ts'));
				assertFalse(raw.includes('    at '));
			},
		);

		await t.step(
			'POST body of literal null returns errors without transport failure',
			async () => {
				const res = await fetch(url, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: 'null',
				});
				assert(res.status >= 200 && res.status < 300);
				const body = await res.json();
				assertExists(body.errors);
			},
		);

		await t.step('server keeps serving after a resolver threw', async () => {
			const res = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ query: '{ hello }' }),
			});
			const body = await res.json();
			assertEquals(body, { data: { hello: 'world' } });
		});
	} finally {
		await app.close();
	}
});
