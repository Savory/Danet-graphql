# @danet/graphql

Schema-first GraphQL for [Danet](https://danet.land), modeled on NestJS's
[`@nestjs/graphql`](https://docs.nestjs.com/graphql/quick-start): import
`GraphQLModule.forRoot(...)` in a module, declare resolver classes as
injectables, and the endpoint is served by the same HTTP server as the rest of
your application, with dependency injection, guards, and standard GraphQL error
responses.

Execution is handled by the reference
[graphql-js](https://www.npmjs.com/package/graphql) implementation; no extra
server runs next to your app.

## Requirements

- Deno **2.x**.
- `@danet/core` **>= 2.12.0** (adds the `APPLICATION_HOST` token this module
  mounts through).

## Usage

```typescript
import { DanetApplication, Injectable, Module } from '@danet/core';
import { Args, GraphQLModule, Mutation, Query, Resolver } from '@danet/graphql';

const typeDefs = `
	type Query {
		todos: [String]
	}
	type Mutation {
		createTodo(title: String!): String
	}
`;

@Injectable()
class TodoService {
	private todos: string[] = [];

	getAll() {
		return this.todos;
	}

	create(title: string) {
		this.todos.push(title);
		return title;
	}
}

@Resolver()
class TodoResolver {
	constructor(private todoService: TodoService) {}

	@Query('todos')
	getAll() {
		return this.todoService.getAll();
	}

	@Mutation()
	createTodo(@Args('title') title: string) {
		return this.todoService.create(title);
	}
}

@Module({
	imports: [GraphQLModule.forRoot({ typeDefs })],
	injectables: [TodoService, TodoResolver],
})
class AppModule {}

const app = new DanetApplication();
await app.init(AppModule);
await app.listen(3000);
```

`POST /graphql` with a JSON body (`query`, optional `variables` and
`operationName`) executes operations; `GET /graphql?query={ todos }` works too.

- `@Query(name?)` / `@Mutation(name?)` bind a resolver method to the root field
  `name`, defaulting to the method name.
- `@Args()` injects the field's arguments object, `@Args('title')` a single
  named argument.
- `@Context()` injects the per-request execution context (the incoming HTTP
  request is at `context.req`).
- Guards run before resolver execution exactly like on HTTP routes: global
  guards apply to every resolver, `@UseGuard` applies to a resolver class or
  method. A denial becomes an `errors` entry for that field.

Invalid SDL, a semantically invalid schema, or a decorated field name missing
from the schema all fail `app.init()` with a descriptive error; nothing broken
ever starts serving.

## Options

| Option       | Type      | Default    | Description                                                         |
| ------------ | --------- | ---------- | ------------------------------------------------------------------- |
| `typeDefs`   | `string`  | (required) | Schema definition language type definitions, the source of truth.   |
| `path`       | `string`  | `/graphql` | Path the endpoint is mounted at.                                    |
| `playground` | `boolean` | `false`    | Serve GraphiQL to browser requests (`Accept: text/html`) on `path`. |

## Error behavior

Failures always come back in GraphQL response shape, never as a transport-level
error:

- Syntactically invalid or unvalidatable query documents return an `errors`
  array describing the problem.
- An exception thrown by a resolver (or a guard denial) becomes an `errors`
  entry carrying the exception message for that field; the server keeps serving.
  Stack traces go to the server-side logger only and are never sent to the
  client.

## Limitations

- **Schema-first only.** Code-first schema generation (`@ObjectType` / `@Field`)
  and GraphQL subscriptions are planned follow-ups.
- **`SCOPE.REQUEST` injectables are per-resolution.** A request-scoped
  injectable consumed by a resolver or guard is created per resolved root field,
  not per HTTP request (unlike controller routes, where one request is one
  handler call).
- **The playground loads GraphiQL from a CDN** (unpkg), so the browser opening
  it needs network access.
