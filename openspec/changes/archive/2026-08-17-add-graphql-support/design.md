## Context

See proposal.md for motivation. The design transposes NestJS's `@nestjs/graphql` architecture onto Danet primitives:

- In NestJS, `GraphQLModule.forRoot(options)` is a dynamic module whose instance injects `HttpAdapterHost`; its `onModuleInit` hook generates the schema and the driver mounts the endpoint on the underlying server. Resolvers are **providers**, discovered by scanning the modules container for `@Resolver` metadata and wrapped so guards/interceptors and parameter decorators apply.
- Danet equivalents: `DynamicModule` with token-based option providers; the injectable application host from core change `add-application-host` (prerequisite, Danet repo) standing in for `HttpAdapterHost`; the `OnAppBootstrap` hook (fired inside `app.init()` after bootstrap, before `listen()`) standing in for `onModuleInit`; the publicly exported `injector` and its `injectables` for provider scanning (the `ScheduleModule` pattern); `GuardExecutor` + `ExecutionContext` (extends Hono's `Context`) for guards.
- The package mirrors `Danet-grpc`'s repo conventions: `mod.ts`, `deps.ts`, `src/`, tests in `spec/*.test.ts`, single quotes and tabs, JSR publishing as `@danet/graphql`. Unlike gRPC it owns no server — it mounts on the app's Hono instance via `app.router`.

## Goals / Non-Goals

**Goals:**

- NestJS-familiar developer experience: import `GraphQLModule.forRoot(...)`, declare resolvers as module injectables, done.
- GraphQL served by the same Hono app and port as the rest of the application, sharing DI, guards, and lifecycle.
- Fail fast during `app.init()` on invalid SDL or schema/resolver mismatches.

**Non-Goals:**

- Code-first schema generation (`@ObjectType`/`@Field`); the SDL is the source of truth (confirmed).
- GraphQL subscriptions (would build on SSE/WebSocket later).
- A driver abstraction layer (NestJS needs one for Apollo/Mercurius/Yoga; Danet has one HTTP engine, so the module executes directly — a driver seam can be extracted later if ever needed).
- Federation, persisted queries, response caching.

## Decisions

**1. Separate `@danet/graphql` package (confirmed), depending on the `add-application-host` core change.**
Protocol integrations follow the `Danet-grpc` precedent of living in their own repo. The one core capability GraphQL needs that gRPC didn't — reaching the app from inside the module system — is added to core as the injectable application host (NestJS `HttpAdapterHost` equivalent) rather than worked around, because it is a general extension primitive.

**2. `GraphQLModule.forRoot({ typeDefs, path?, playground? })` returning a `DynamicModule` (supersedes the earlier `new GraphQLServer(app, options)` decision).**
This is the NestJS-shaped API the maintainer asked for: configuration travels as a token-registered options provider inside the dynamic module, and users wire GraphQL by importing a module like any other Danet feature. The `GrpcServer`-style constructor was the right call only while core offered no way for a module to reach the app; with the application host that constraint is gone.

**3. Resolvers are module `injectables` discovered by metadata scan, mirroring NestJS providers.**
`@Resolver()` stamps metadata on the class; users list resolver classes under `injectables` in their modules, so the injector instantiates them with constructor DI as usual. During `onAppBootstrap`, the module scans the injector's registered injectables for that metadata (exactly how `ScheduleModule` finds `@Cron` methods, and the analogue of NestJS's modules-container scan). No `useTransport`, no controller dispatch involvement.

**4. Schema build, binding validation, and endpoint mounting happen in the module's `onAppBootstrap` hook.**
The hook runs inside `app.init()` after all modules are bootstrapped — every resolver is registered, and `listen()` has not started. The hook: parses the SDL with `buildSchema` (invalid SDL throws, failing `init()`), binds each discovered `@Query(name?)`/`@Mutation(name?)` method into the schema's root fields (a decorated name with no matching schema field throws, naming the field), then obtains the application via the host token and mounts the endpoint route on `app.router` at the configured path. This satisfies the startup-validation requirement with no post-init steps.

**5. Execution via graphql-js (`npm:graphql`).**
The reference implementation provides `buildSchema`, `parse`, `validate`, and `execute` with no server opinions — Hono is the server. Alternatives: GraphQL Yoga (brings its own server/fetch handling), `@hono/graphql-server` middleware (owns request handling and bypasses Danet guards). NestJS's driver packages wrap Apollo et al. for the same reason we go direct: the server integration is the framework's job. Pinned in the package's `deno.json`.

**6. Single Hono route handling POST, GET, and playground.**
One handler at the configured path: `POST` parses the JSON body (`query`, `variables`, `operationName`), `GET` reads query params, and `GET` with `Accept: text/html` serves the GraphiQL page when enabled (static HTML pointing at the endpoint, no extra dependency — NestJS similarly toggles landing-page plugins off in production/by default). The handler runs parse → validate → execute against the bound schema and always answers in GraphQL response shape.

**7. Guards run per root-field resolver, applied at binding time.**
Like NestJS's `externalContextCreator` wrapping, each bound resolver method is wrapped in a field-resolver function that builds an `ExecutionContext` (Hono context + resolver class/method as `getClass()`/`getHandler()`), runs `GuardExecutor` (global guards, then `@UseGuard` metadata), resolves `@Args`/`@Context` parameters from metadata, and invokes the method preserving `this`. A guard denial throws inside the field resolver, which graphql-js converts into an `errors` entry for that field. Nested (non-root) fields resolve via default property access and are not wrapped — NestJS's "fast path" equivalent.

## Risks / Trade-offs

- [Hard dependency on an unreleased core feature] → Sequence the work: `add-application-host` lands and ships in `@danet/core` first; this package pins that minimum version. Both changes are planned together.
- [Metadata scan sees all injectables in the process-global injector, not just this app's modules] → Same trade-off `ScheduleModule` already accepts; scan filters strictly on `@Resolver` metadata. A per-app container in core would improve this globally.
- [graphql-js via `npm:` specifier may behave differently across Deno versions] → Pin an exact version; CI tests Deno stable and canary like the other Savory repos.
- [Depending on core public exports (`injector`, `GuardExecutor`, `ExecutionContext`, host token) risks drift across core versions] → Import only public exports, pin the minimum core version, cover the contract with e2e tests against a real booted app, as `Danet-grpc` does.
- [Schema/resolver mismatch rules could reject valid setups (e.g. fields resolved by default property access)] → Only decorated methods are validated against the schema; undecorated schema fields resolve via default behavior.
- [GraphQL responses must not leak internals] → Resolver exceptions are mapped to their `message` only; stack traces stay server-side in the logger.

## Migration Plan

Requires a minor `@danet/core` release containing the application host (see `add-application-host`), then this package ships as a new JSR package. Purely additive for existing apps; rollback is not adopting the package.

## Open Questions

- Exact GraphiQL HTML flavor (inline minimal editor vs vendored asset) — cosmetic, decided during implementation.
