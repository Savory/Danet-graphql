## 1. Prerequisite

- [x] 1.1 Verify the Danet core change `add-application-host` (injectable application host token) is implemented and released in `@danet/core`; pin that minimum version

## 2. Package Scaffolding

- [x] 2.1 Scaffold the `Danet-graphql` repo mirroring `Danet-grpc`: `deno.json` (name `@danet/graphql`, exports `./mod.ts`, lint/fmt/publish config, test task), `mod.ts`, `deps.ts`, `src/` and `spec/` folders, README stub, CI workflow
- [x] 2.2 Pin `graphql` (graphql-js) and re-export needed primitives (`buildSchema`, `parse`, `validate`, `execute`, `GraphQLError`) from `deps.ts`

## 3. Decorators & Module

- [x] 3.1 Define resolver/options metadata keys and the options injection token in `src/constants.ts`
- [x] 3.2 Implement `@Resolver()` class decorator, and `@Query(name?)` / `@Mutation(name?)` method decorators storing operation type and field name (default: method name) in `src/decorator.ts`
- [x] 3.3 Implement `@Args(name?)` and `@Context()` parameter decorators storing parameter metadata (`src/params.ts`)
- [x] 3.4 Implement `GraphQLModule.forRoot({ typeDefs, path?, playground? })` in `src/module.ts`: returns a `DynamicModule` registering the options under the token, with the module class implementing `OnAppBootstrap`

## 4. Bootstrap: Discovery, Schema, Mounting

- [x] 4.1 In `onAppBootstrap`, parse the SDL with `buildSchema`, throwing a descriptive error (failing `app.init()`) on invalid type definitions
- [x] 4.2 Discover resolver classes by scanning the injector's injectables for `@Resolver` metadata (ScheduleModule pattern) and bind each `@Query`/`@Mutation` method into the schema's root fields; throw during `app.init()` when a decorated name has no matching root-type field (error names the field)
- [x] 4.3 Obtain the application via the core application host token and mount the endpoint route on `app.router` at the configured path (default `/graphql`)

## 5. Request Handling

- [x] 5.1 Implement the endpoint handler: `POST` JSON body (`query`, `variables`, `operationName`) and `GET` query-parameter execution, running parse → validate → execute against the bound schema
- [x] 5.2 Wrap each bound root-field resolver: build `ExecutionContext` with resolver class/method, run `GuardExecutor` (global + `@UseGuard` metadata), resolve `@Args`/`@Context` parameters, invoke the method preserving `this` (nested fields stay on default resolution)
- [x] 5.3 Implement error shaping: parse/validation failures and resolver exceptions return GraphQL `errors` entries (message only, stack traces to logger), never a crashed request
- [x] 5.4 Serve the GraphiQL HTML page on `GET` with `Accept: text/html` when `playground: true`, and not otherwise

## 6. Tests (spec/*.test.ts, e2e against a booted DanetApplication)

- [x] 6.1 Endpoint tests: POST query returns `{ data }`, GET query execution, custom path serves there and not at `/graphql`
- [x] 6.2 Resolver tests: `@Query`/`@Mutation` binding (explicit and default names), constructor DI into resolvers declared as injectables, `@Args` (named and full object) and `@Context` parameter injection
- [x] 6.3 Startup validation tests: malformed SDL makes `app.init()` throw; `@Query('missing')` with no schema field makes `app.init()` throw naming the field
- [x] 6.4 Guard tests: global guard and `@UseGuard` on class/method deny → resolver not invoked and `errors` entry present; allow → normal execution
- [x] 6.5 Error-shaping tests: invalid query document returns `errors` without transport failure; throwing resolver returns `errors` and server keeps serving
- [x] 6.6 Playground tests: enabled serves HTML editor; disabled/omitted does not
- [x] 6.7 Coexistence test: HTTP controller routes on the same app keep working alongside the GraphQL endpoint

## 7. Public API & Docs

- [x] 7.1 Export `GraphQLModule`, decorators, and types from `mod.ts`
- [x] 7.2 Write the README usage example (SDL + `@Resolver` injectable + `GraphQLModule.forRoot(...)` import), noting the NestJS parallel and the core minimum version
- [x] 7.3 Run `deno lint`, `deno fmt`, and the test task; run `graphify update .` per project rules
- [x] 7.4 Draft the danet.land GraphQL documentation section (usage: typeDefs, resolvers, guards, playground)
