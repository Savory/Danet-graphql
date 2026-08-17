import { assertEquals } from '@std/assert';
import { DanetApplication, Injectable, Module } from '@danet/core';
import type { ExecutionContext } from '@danet/core';
import {
	Args,
	Context,
	GraphQLModule,
	Mutation,
	Query,
	Resolver,
} from '@danet/graphql';

const typeDefs = `
	type Query {
		todos: [String]
		defaultNamed: String
		echo(a: String, b: String): String
		requestHeader: String
	}
	type Mutation {
		createTodo(title: String!): String
		removeAll: String
	}
`;

@Injectable()
class TodoService {
	getAll() {
		return ['walk the dog', 'buy milk'];
	}
}

@Resolver()
class TodoResolver {
	constructor(private todoService: TodoService) {}

	@Query('todos')
	methodNamedDifferently() {
		return this.todoService.getAll();
	}

	@Query()
	defaultNamed() {
		return 'bound by method name';
	}

	@Query('echo')
	echo(@Args() args: { a: string; b: string }) {
		return `${args.a}-${args.b}`;
	}

	@Query('requestHeader')
	requestHeader(@Context() context: ExecutionContext) {
		return context.req.header('x-custom-header');
	}

	@Mutation('createTodo')
	create(@Args('title') title: string) {
		return `created ${title}`;
	}

	@Mutation()
	removeAll() {
		return 'removed';
	}
}

@Module({
	imports: [GraphQLModule.forRoot({ typeDefs })],
	injectables: [TodoService, TodoResolver],
})
class AppModule {}

async function post(
	port: number,
	// deno-lint-ignore no-explicit-any
	payload: Record<string, unknown>,
	headers: Record<string, string> = {},
	// deno-lint-ignore no-explicit-any
): Promise<any> {
	const res = await fetch(`http://localhost:${port}/graphql`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...headers },
		body: JSON.stringify(payload),
	});
	return await res.json();
}

Deno.test('resolver binding, DI and parameter decorators', async (t) => {
	const app = new DanetApplication();
	try {
		await app.init(AppModule);
		const { port } = await app.listen(0);

		await t.step(
			'query field bound to explicitly named method, with constructor DI',
			async () => {
				const body = await post(port, { query: '{ todos }' });
				assertEquals(body, {
					data: { todos: ['walk the dog', 'buy milk'] },
				});
			},
		);

		await t.step('query field bound by default method name', async () => {
			const body = await post(port, { query: '{ defaultNamed }' });
			assertEquals(body, { data: { defaultNamed: 'bound by method name' } });
		});

		await t.step('mutation field bound to decorated method', async () => {
			const body = await post(port, {
				query: 'mutation { removeAll }',
			});
			assertEquals(body, { data: { removeAll: 'removed' } });
		});

		await t.step('named @Args receives the argument value', async () => {
			const body = await post(port, {
				query: 'mutation Create($title: String!) { createTodo(title: $title) }',
				variables: { title: 'buy milk' },
			});
			assertEquals(body, { data: { createTodo: 'created buy milk' } });
		});

		await t.step('@Args without name receives the full object', async () => {
			const body = await post(port, {
				query: '{ echo(a: "left", b: "right") }',
			});
			assertEquals(body, { data: { echo: 'left-right' } });
		});

		await t.step('@Context exposes the incoming HTTP request', async () => {
			const body = await post(
				port,
				{ query: '{ requestHeader }' },
				{ 'x-custom-header': 'from-the-request' },
			);
			assertEquals(body, { data: { requestHeader: 'from-the-request' } });
		});
	} finally {
		await app.close();
	}
});
