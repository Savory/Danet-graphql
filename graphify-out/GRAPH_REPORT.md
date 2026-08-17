# Graph Report - Danet-graphql  (2026-08-17)

## Corpus Check
- 23 files · ~11,723 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 223 nodes · 275 edges · 16 communities
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1ee13e5a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Requirements
- schema.ts
- Query
- deno.json
- ADDED Requirements
- TodoResolver
- handler.ts
- guard.test.ts
- tasks.md
- coexistence.test.ts
- design.md
- proposal.md
- endpoint.test.ts
- playground.test.ts
- startup.test.ts
- @danet/graphql

## God Nodes (most connected - your core abstractions)
1. `Query()` - 14 edges
2. `TodoResolver` - 9 edges
3. `Resolver()` - 9 edges
4. `createGraphQLHandler()` - 8 edges
5. `ADDED Requirements` - 8 edges
6. `Requirements` - 8 edges
7. `imports` - 7 edges
8. `@danet/graphql` - 7 edges
9. `exclude` - 6 edges
10. `exclude` - 5 edges

## Surprising Connections (you probably didn't know these)
- `TodoResolver` --references--> `Resolver()`  [EXTRACTED]
  spec/resolver.test.ts → src/decorator.ts
- `GreetingResolver` --references--> `Resolver()`  [EXTRACTED]
  spec/coexistence.test.ts → src/decorator.ts
- `HelloResolver` --references--> `Resolver()`  [EXTRACTED]
  spec/endpoint.test.ts → src/decorator.ts
- `ErrorProneResolver` --references--> `Resolver()`  [EXTRACTED]
  spec/errors.test.ts → src/decorator.ts
- `GuardedResolver` --references--> `Resolver()`  [EXTRACTED]
  spec/guard.test.ts → src/decorator.ts

## Import Cycles
- None detected.

## Communities (16 total, 0 thin omitted)

### Community 0 - "Requirements"
Cohesion: 0.07
Nodes (26): GraphQL Specification, Purpose, Requirement: GraphiQL Playground Option, Requirement: GraphQL Endpoint, Requirement: GraphQL Error Shaping, Requirement: Guard Enforcement On Resolvers, Requirement: Resolver Method Parameters, Requirement: Resolver Registration (+18 more)

### Community 1 - "schema.ts"
Cohesion: 0.17
Nodes (13): GRAPHQL_OPTIONS, OPERATION_METADATA, OperationMetadata, RESOLVER_METADATA, GraphQLModule, GraphQLModuleOptions, Module, GqlExecutionContext (+5 more)

### Community 2 - "Query"
Cohesion: 0.13
Nodes (12): GreetingResolver, HelloResolver, AppModule, ErrorProneResolver, Module, ClassGuardedResolver, GuardedResolver, HelloResolver (+4 more)

### Community 3 - "deno.json"
Cohesion: 0.06
Nodes (36): compilerOptions, emitDecoratorMetadata, experimentalDecorators, description, exports, fmt, exclude, options (+28 more)

### Community 4 - "ADDED Requirements"
Cohesion: 0.08
Nodes (25): ADDED Requirements, Purpose, Requirement: GraphiQL Playground Option, Requirement: GraphQL Endpoint, Requirement: GraphQL Error Shaping, Requirement: Guard Enforcement On Resolvers, Requirement: Resolver Method Parameters, Requirement: Resolver Registration (+17 more)

### Community 5 - "TodoResolver"
Cohesion: 0.13
Nodes (8): AppModule, TodoResolver, TodoService, Injectable, Module, Mutation(), Args(), Context()

### Community 6 - "handler.ts"
Cohesion: 0.31
Nodes (9): createGraphQLHandler(), errorResponse(), extractParams(), GraphQLRequestParams, HandlerOptions, ShapedError, shapeError(), shapeResult() (+1 more)

### Community 7 - "guard.test.ts"
Cohesion: 0.24
Nodes (6): AppModule, GlobalGuardModule, GlobalHeaderGuard, HeaderGuard, Injectable, Module

### Community 8 - "tasks.md"
Cohesion: 0.25
Nodes (7): 1. Prerequisite, 2. Package Scaffolding, 3. Decorators & Module, 4. Bootstrap: Discovery, Schema, Mounting, 5. Request Handling, 6. Tests (spec/*.test.ts, e2e against a booted DanetApplication), 7. Public API & Docs

### Community 9 - "coexistence.test.ts"
Cohesion: 0.29
Nodes (5): Controller, Get, AppModule, TodoController, Module

### Community 10 - "design.md"
Cohesion: 0.29
Nodes (6): Context, Decisions, Goals / Non-Goals, Migration Plan, Open Questions, Risks / Trade-offs

### Community 11 - "proposal.md"
Cohesion: 0.29
Nodes (6): Capabilities, Impact, Modified Capabilities, New Capabilities, What Changes, Why

### Community 12 - "endpoint.test.ts"
Cohesion: 0.67
Nodes (3): AppModule, CustomPathModule, Module

### Community 13 - "playground.test.ts"
Cohesion: 0.67
Nodes (3): NoPlaygroundModule, PlaygroundModule, Module

### Community 14 - "startup.test.ts"
Cohesion: 0.60
Nodes (4): MalformedSdlModule, SemanticallyInvalidSdlModule, Module, UnmatchedFieldModule

### Community 15 - "@danet/graphql"
Cohesion: 0.25
Nodes (7): @danet/graphql, Error behavior, Limitations, Options, Playground, Requirements, Usage

## Knowledge Gaps
- **83 isolated node(s):** `name`, `version`, `description`, `license`, `exports` (+78 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Resolver()` connect `Query` to `schema.ts`, `TodoResolver`?**
  _High betweenness centrality (0.120) - this node is a cross-community bridge._
- **Why does `Query()` connect `Query` to `schema.ts`, `TodoResolver`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Why does `TodoResolver` connect `TodoResolver` to `Query`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _83 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Requirements` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._
- **Should `Query` be split into smaller, more focused modules?**
  _Cohesion score 0.12987012987012986 - nodes in this community are weakly interconnected._
- **Should `deno.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06006006006006006 - nodes in this community are weakly interconnected._