## Purpose

Danet serves GraphQL APIs alongside HTTP routes: developers supply schema type definitions and decorated resolver classes, and the framework exposes a GraphQL endpoint with dependency injection, guard enforcement, and standard GraphQL error responses.

## ADDED Requirements

### Requirement: GraphQL Endpoint

The system SHALL expose a GraphQL endpoint on the running application when the GraphQL module is imported with schema type definitions, mounted at `/graphql` by default and at a configurable path when one is provided. The endpoint SHALL execute operations sent as `POST` requests with a JSON body containing `query`, and optional `variables` and `operationName`, and SHALL also execute queries sent as `GET` requests via URL query parameters.

#### Scenario: POST query execution

- **WHEN** a client sends `POST /graphql` with body `{ "query": "{ hello }" }` and a resolver is bound for the `hello` field
- **THEN** the response SHALL be JSON of the shape `{ "data": { "hello": <resolver result> } }`

#### Scenario: Custom path

- **WHEN** the GraphQL module is imported with path `/api/gql`
- **THEN** the endpoint SHALL be served at `/api/gql` and no GraphQL endpoint SHALL be mounted at `/graphql`

#### Scenario: GET query execution

- **WHEN** a client sends `GET /graphql?query={ hello }`
- **THEN** the query SHALL be executed and the JSON result returned

### Requirement: Resolver Registration

The system SHALL bind methods of classes decorated with `@Resolver()` and declared as injectables in a module to the schema fields named by their `@Query(name?)` and `@Mutation(name?)` decorators, defaulting the field name to the method name when none is given. Resolver classes SHALL be instantiated by the injector so their constructor dependencies are resolved like those of controllers.

#### Scenario: Query field bound to decorated method

- **WHEN** the schema declares `type Query { todos: [Todo] }` and a registered resolver class has a method decorated `@Query('todos')`
- **THEN** executing `{ todos { ... } }` SHALL invoke that method and use its return value as the field result

#### Scenario: Mutation field bound to decorated method

- **WHEN** the schema declares a `Mutation` field and a registered resolver method is decorated `@Mutation()` with a matching method name
- **THEN** executing that mutation SHALL invoke the method

#### Scenario: Dependency injection into resolvers

- **WHEN** a resolver class declares an injectable service as a constructor parameter
- **THEN** the instance SHALL receive the same service resolution behavior as a controller in the same module

### Requirement: Schema Validation At Startup

The system SHALL fail application startup with a descriptive error when the provided type definitions are not valid schema definition language, or when a decorated `@Query`/`@Mutation` method names a field that does not exist on the corresponding root type.

#### Scenario: Invalid type definitions

- **WHEN** the GraphQL module is imported with malformed type definitions
- **THEN** application bootstrap SHALL throw an error identifying the schema as invalid

#### Scenario: Resolver without matching field

- **WHEN** a resolver method is decorated `@Query('missing')` and the schema's `Query` type has no `missing` field
- **THEN** application bootstrap SHALL throw an error naming the unmatched field

### Requirement: Resolver Method Parameters

The system SHALL resolve resolver method parameters through parameter decorators: `@Args()` SHALL yield the operation's arguments object for that field (or a single named argument when a name is given), and `@Context()` SHALL yield the per-request execution context giving access to the underlying HTTP request.

#### Scenario: Named argument injection

- **WHEN** a mutation resolver method declares a parameter decorated `@Args('title')` and the client executes the mutation with `title: "buy milk"`
- **THEN** the parameter SHALL receive the string `"buy milk"`

#### Scenario: Context injection

- **WHEN** a resolver method declares a parameter decorated `@Context()`
- **THEN** the parameter SHALL expose the incoming HTTP request of the current operation

### Requirement: Guard Enforcement On Resolvers

The system SHALL run authorization guards before resolver execution with the same semantics as HTTP routes: global guards apply to every resolver, and guards declared with `@UseGuard` on a resolver class or method apply to that scope. When a guard denies access, the operation SHALL NOT invoke the resolver method and the response SHALL report the denial as a GraphQL error.

#### Scenario: Guard denies a resolver

- **WHEN** a resolver method is protected by a guard that returns false for the request
- **THEN** the resolver method SHALL NOT be invoked and the response SHALL contain an `errors` entry describing the authorization failure

#### Scenario: Guard allows a resolver

- **WHEN** the protecting guard returns true
- **THEN** the resolver SHALL execute normally

### Requirement: GraphQL Error Shaping

The system SHALL return failures as GraphQL responses rather than transport-level failures: operations that reference unknown fields or are syntactically invalid SHALL produce a `200`-family JSON response whose `errors` array describes the problem, and an exception thrown by a resolver method SHALL surface as an `errors` entry for that field without terminating the server or leaking a stack trace to the client.

#### Scenario: Invalid query document

- **WHEN** a client submits a query that fails validation against the schema
- **THEN** the response SHALL contain an `errors` array describing the validation failure and no `data` for the invalid selection

#### Scenario: Resolver throws

- **WHEN** a bound resolver method throws an exception during execution
- **THEN** the response SHALL contain an `errors` entry with the exception message and the server SHALL keep serving subsequent requests

### Requirement: GraphiQL Playground Option

The system SHALL serve an interactive GraphiQL page for browser requests to the GraphQL endpoint when the playground option is enabled, and SHALL NOT serve it when the option is disabled or omitted.

#### Scenario: Playground enabled

- **WHEN** the GraphQL module is imported with the playground option enabled and a browser requests the endpoint with `Accept: text/html`
- **THEN** the response SHALL be an HTML page providing an interactive query editor against the endpoint

#### Scenario: Playground disabled by default

- **WHEN** the GraphQL module is imported without the playground option and a browser requests the endpoint with `Accept: text/html`
- **THEN** the response SHALL NOT be the playground page
