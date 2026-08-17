import { assertRejects, assertStringIncludes } from '@std/assert';
import { DanetApplication, Module } from '@danet/core';
import { GraphQLModule, Query, Resolver } from '@danet/graphql';

@Module({
	imports: [GraphQLModule.forRoot({ typeDefs: 'type Query {' })],
})
class MalformedSdlModule {}

Deno.test('malformed type definitions make app.init() throw', async () => {
	const app = new DanetApplication();
	try {
		const error = await assertRejects(() => app.init(MalformedSdlModule));
		assertStringIncludes(
			(error as Error).message.toLowerCase(),
			'invalid',
		);
	} finally {
		await app.close();
	}
});

@Module({
	imports: [
		GraphQLModule.forRoot({ typeDefs: 'type Mutation { x: String }' }),
	],
})
class SemanticallyInvalidSdlModule {}

Deno.test(
	'parseable but semantically invalid type definitions make app.init() throw',
	async () => {
		const app = new DanetApplication();
		try {
			const error = await assertRejects(() =>
				app.init(SemanticallyInvalidSdlModule)
			);
			assertStringIncludes(
				(error as Error).message.toLowerCase(),
				'invalid',
			);
		} finally {
			await app.close();
		}
	},
);

@Resolver()
class UnmatchedResolver {
	@Query('missing')
	missing() {
		return 'never reached';
	}
}

@Module({
	imports: [
		GraphQLModule.forRoot({ typeDefs: 'type Query { hello: String }' }),
	],
	injectables: [UnmatchedResolver],
})
class UnmatchedFieldModule {}

Deno.test(
	'resolver decorated with a field absent from the schema makes app.init() throw naming the field',
	async () => {
		const app = new DanetApplication();
		try {
			const error = await assertRejects(() => app.init(UnmatchedFieldModule));
			assertStringIncludes((error as Error).message, 'missing');
		} finally {
			await app.close();
		}
	},
);
