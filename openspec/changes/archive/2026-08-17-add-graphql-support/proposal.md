## Why

Danet users have requested first-class GraphQL support. Today the framework only routes REST-style HTTP, SSE, and WebSocket traffic, so teams that want a GraphQL API must hand-wire a third-party GraphQL server next to their Danet app, losing dependency injection, guards, and the decorator programming model that the rest of the framework provides.

## What Changes

- Create a new `@danet/graphql` package (repo `Danet-graphql`, sibling of `Danet-grpc`) modeled on NestJS's `@nestjs/graphql`: the app enables GraphQL by importing `GraphQLModule.forRoot({ typeDefs, path?, playground? })` in a module — no manual server wiring.
- The module mounts the endpoint on the application's existing HTTP server (default path `/graphql`, configurable) during bootstrap, handling both `POST` and `GET` query execution. It reaches the application through the injectable application host being added to Danet core (change `add-application-host` in the Danet repo — the `HttpAdapterHost` equivalent), which is a **prerequisite core release**.
- Resolver classes are declared as module `injectables` (mirroring NestJS, where resolvers are providers) and decorated with `@Resolver`; the module discovers them by scanning the injector for resolver metadata, so they are instantiated with full DI.
- Schema-first approach (confirmed): the developer supplies SDL type definitions; the module builds the executable schema by binding `@Query`/`@Mutation` methods to the corresponding schema fields, failing `app.init()` on mismatches.
- Resolver method parameters resolve through parameter decorators (`@Args`, `@Context`).
- Authorization guards (`@UseGuard`, global guards) run before resolver execution, mirroring HTTP route behavior.
- GraphQL errors are returned in the standard GraphQL response `errors` shape instead of crashing the request.
- Optional GraphiQL playground can be enabled for development.

Decisions confirmed by the maintainer: separate package, schema-first, and NestJS's GraphQL module as the design template. Code-first schema generation (`@ObjectType`/`@Field` style) and GraphQL subscriptions remain out of scope as follow-ups.

## Capabilities

### New Capabilities

- `graphql`: Serving a GraphQL endpoint from a Danet application via the `@danet/graphql` package: schema construction from SDL plus decorated resolver classes, resolver discovery and DI, parameter resolution, guard enforcement, error shaping, and playground option.

### Modified Capabilities

<!-- none in this repo: the required Danet core change (injectable application host) is planned separately as `add-application-host` in the Danet repo's openspec -->

## Impact

- **Code**: new repository `Danet-graphql` publishing `@danet/graphql`, mirroring `Danet-grpc`'s layout (`mod.ts`, `deps.ts`, `src/` with `module.ts`, `decorator.ts`, `schema.ts`, `handler.ts`, `constants.ts`, `spec/` tests).
- **Dependencies**: `@danet/core` at the version shipping the application host token (prerequisite: Danet change `add-application-host`), and the reference `graphql` (graphql-js) implementation for parsing, validation, and execution.
- **APIs**: new public package surface — `GraphQLModule.forRoot(options)`, resolver/parameter decorators. No breaking changes to any existing Danet API.
- **Docs/examples**: package README with usage example; danet.land GraphQL section (tracked in tasks).
