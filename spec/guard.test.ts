import { assert, assertEquals, assertExists } from '@std/assert';
import {
	DanetApplication,
	GLOBAL_GUARD,
	Injectable,
	Module,
	UseGuard,
} from '@danet/core';
import type { AuthGuard, ExecutionContext } from '@danet/core';
import { GraphQLModule, Query, Resolver } from '@danet/graphql';

const typeDefs = `
	type Query {
		open: String
		methodProtected: String
		classProtected: String
	}
`;

@Injectable()
class HeaderGuard implements AuthGuard {
	canActivate(context: ExecutionContext) {
		return context.req.header('authorization') === 'valid';
	}
}

let methodProtectedInvoked = false;

@Resolver()
class GuardedResolver {
	@Query()
	open() {
		return 'open';
	}

	@UseGuard(HeaderGuard)
	@Query()
	methodProtected() {
		methodProtectedInvoked = true;
		return 'method secret';
	}
}

@UseGuard(HeaderGuard)
@Resolver()
class ClassGuardedResolver {
	@Query()
	classProtected() {
		return 'class secret';
	}
}

@Module({
	imports: [GraphQLModule.forRoot({ typeDefs })],
	injectables: [GuardedResolver, ClassGuardedResolver],
})
class AppModule {}

async function post(
	port: number,
	query: string,
	headers: Record<string, string> = {},
	// deno-lint-ignore no-explicit-any
): Promise<any> {
	const res = await fetch(`http://localhost:${port}/graphql`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...headers },
		body: JSON.stringify({ query }),
	});
	return await res.json();
}

Deno.test('@UseGuard on resolver method and class', async (t) => {
	const app = new DanetApplication();
	try {
		await app.init(AppModule);
		const { port } = await app.listen(0);

		await t.step(
			'denying method guard: resolver not invoked, errors entry present',
			async () => {
				methodProtectedInvoked = false;
				const body = await post(port, '{ methodProtected }');
				assertExists(body.errors);
				assert(body.errors.length > 0);
				assertEquals(body.data?.methodProtected ?? null, null);
				assertEquals(methodProtectedInvoked, false);
			},
		);

		await t.step('allowing method guard: resolver executes', async () => {
			const body = await post(port, '{ methodProtected }', {
				authorization: 'valid',
			});
			assertEquals(body.data, { methodProtected: 'method secret' });
			assertEquals(body.errors, undefined);
		});

		await t.step('denying class guard produces an errors entry', async () => {
			const body = await post(port, '{ classProtected }');
			assertExists(body.errors);
			assertEquals(body.data?.classProtected ?? null, null);
		});

		await t.step('allowing class guard: resolver executes', async () => {
			const body = await post(port, '{ classProtected }', {
				authorization: 'valid',
			});
			assertEquals(body.data, { classProtected: 'class secret' });
		});

		await t.step('unguarded resolver is unaffected', async () => {
			const body = await post(port, '{ open }');
			assertEquals(body.data, { open: 'open' });
		});
	} finally {
		await app.close();
	}
});

@Injectable()
class GlobalHeaderGuard implements AuthGuard {
	canActivate(context: ExecutionContext) {
		return context.req.header('authorization') === 'valid';
	}
}

@Module({
	imports: [GraphQLModule.forRoot({ typeDefs })],
	injectables: [
		{ token: GLOBAL_GUARD, useClass: GlobalHeaderGuard },
		GuardedResolver,
		ClassGuardedResolver,
	],
})
class GlobalGuardModule {}

Deno.test('global guard applies to every resolver', async (t) => {
	const app = new DanetApplication();
	try {
		await app.init(GlobalGuardModule);
		const { port } = await app.listen(0);

		await t.step('denies the open resolver without the header', async () => {
			const body = await post(port, '{ open }');
			assertExists(body.errors);
			assertEquals(body.data?.open ?? null, null);
		});

		await t.step('allows the open resolver with the header', async () => {
			const body = await post(port, '{ open }', { authorization: 'valid' });
			assertEquals(body.data, { open: 'open' });
		});
	} finally {
		await app.close();
	}
});
