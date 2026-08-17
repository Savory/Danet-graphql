import { assertEquals } from '@std/assert';
import { Controller, DanetApplication, Get, Module } from '@danet/core';
import { GraphQLModule, Query, Resolver } from '@danet/graphql';

const typeDefs = `
	type Query {
		greeting: String
	}
`;

@Resolver()
class GreetingResolver {
	@Query()
	greeting() {
		return 'hello from graphql';
	}
}

@Controller('todo')
class TodoController {
	@Get('/')
	getAll() {
		return ['walk the dog'];
	}
}

@Module({
	imports: [GraphQLModule.forRoot({ typeDefs })],
	controllers: [TodoController],
	injectables: [GreetingResolver],
})
class AppModule {}

Deno.test(
	'HTTP controller routes keep working alongside the GraphQL endpoint',
	async () => {
		const app = new DanetApplication();
		try {
			await app.init(AppModule);
			const { port } = await app.listen(0);

			const httpRes = await fetch(`http://localhost:${port}/todo`);
			assertEquals(await httpRes.json(), ['walk the dog']);

			const gqlRes = await fetch(`http://localhost:${port}/graphql`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ query: '{ greeting }' }),
			});
			assertEquals(await gqlRes.json(), {
				data: { greeting: 'hello from graphql' },
			});
		} finally {
			await app.close();
		}
	},
);
