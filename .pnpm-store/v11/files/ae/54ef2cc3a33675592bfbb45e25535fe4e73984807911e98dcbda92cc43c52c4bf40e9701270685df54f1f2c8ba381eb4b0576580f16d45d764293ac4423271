import { getAdapter } from "../db/adapter-kysely.mjs";
import "../db/index.mjs";
import { getMigrations } from "../db/get-migration.mjs";
import { getBaseURL } from "../utils/url.mjs";
import { parseSetCookieHeader, setCookieToHeader } from "../cookies/cookie-utils.mjs";
import "../cookies/index.mjs";
import { betterAuth } from "../auth/auth.mjs";
import "../auth/index.mjs";
import { createAuthClient } from "../client/vanilla.mjs";
import "../client/index.mjs";
import { bearer } from "../plugins/bearer/index.mjs";
import "../plugins/index.mjs";
import { sql } from "kysely";
import { afterAll } from "vitest";
import { AsyncLocalStorage } from "node:async_hooks";

//#region src/test-utils/test-instance.ts
const cleanupSet = /* @__PURE__ */ new Set();
const currentUserContextStorage = new AsyncLocalStorage();
afterAll(async () => {
	for (const cleanup of cleanupSet) {
		await cleanup();
		cleanupSet.delete(cleanup);
	}
});
async function getTestInstance(options, config) {
	const testWith = config?.testWith || "sqlite";
	async function getPostgres() {
		const { Kysely: Kysely$1, PostgresDialect: PostgresDialect$1 } = await import("kysely");
		const { Pool } = await import("pg");
		return new Kysely$1({ dialect: new PostgresDialect$1({ pool: new Pool({ connectionString: "postgres://user:password@localhost:5432/better_auth" }) }) });
	}
	async function getSqlite() {
		const { default: Database } = await import("better-sqlite3");
		return new Database(":memory:");
	}
	async function getMysql() {
		const { Kysely: Kysely$1, MysqlDialect: MysqlDialect$1 } = await import("kysely");
		const { createPool } = await import("mysql2/promise");
		return new Kysely$1({ dialect: new MysqlDialect$1(createPool("mysql://user:password@localhost:3306/better_auth")) });
	}
	async function mongodbClient() {
		const { MongoClient } = await import("mongodb");
		const dbClient = async (connectionString, dbName) => {
			const client$1 = new MongoClient(connectionString);
			await client$1.connect();
			return client$1.db(dbName);
		};
		return await dbClient("mongodb://127.0.0.1:27017", "better-auth");
	}
	const opts = {
		socialProviders: {
			github: {
				clientId: "test",
				clientSecret: "test"
			},
			google: {
				clientId: "test",
				clientSecret: "test"
			}
		},
		secret: "better-auth-secret-that-is-long-enough-for-validation-test",
		database: testWith === "postgres" ? {
			db: await getPostgres(),
			type: "postgres"
		} : testWith === "mongodb" ? await Promise.all([mongodbClient(), await import("../adapters/mongodb-adapter/index.mjs")]).then(([db, { mongodbAdapter }]) => mongodbAdapter(db)) : testWith === "mysql" ? {
			db: await getMysql(),
			type: "mysql"
		} : await getSqlite(),
		emailAndPassword: { enabled: true },
		rateLimit: { enabled: false },
		advanced: { cookies: {} },
		logger: { level: "debug" }
	};
	const auth = betterAuth({
		baseURL: "http://localhost:" + (config?.port || 3e3),
		...opts,
		...options,
		plugins: [bearer(), ...options?.plugins || []]
	});
	const testUser = {
		email: "test@test.com",
		password: "test123456",
		name: "test user",
		...config?.testUser
	};
	async function createTestUser() {
		if (config?.disableTestUser) return;
		await auth.api.signUpEmail({ body: testUser });
	}
	if (testWith !== "mongodb") {
		const { runMigrations } = await getMigrations({
			...auth.options,
			database: opts.database
		});
		await runMigrations();
	}
	await createTestUser();
	const cleanup = async () => {
		if (testWith === "mongodb") {
			await (await mongodbClient()).dropDatabase();
			return;
		}
		if (testWith === "postgres") {
			const postgres = await getPostgres();
			await sql`DROP SCHEMA public CASCADE; CREATE SCHEMA public;`.execute(postgres);
			await postgres.destroy();
			return;
		}
		if (testWith === "mysql") {
			const mysql = await getMysql();
			await sql`SET FOREIGN_KEY_CHECKS = 0;`.execute(mysql);
			const tables = await mysql.introspection.getTables();
			for (const table of tables) await mysql.deleteFrom(table.name).execute();
			await sql`SET FOREIGN_KEY_CHECKS = 1;`.execute(mysql);
			return;
		}
		if (testWith === "sqlite") {
			(await getSqlite()).close();
			return;
		}
	};
	cleanupSet.add(cleanup);
	const customFetchImpl = async (url, init) => {
		const headers = init?.headers || {};
		const storageHeaders = currentUserContextStorage.getStore()?.headers;
		return auth.handler(new Request(url, init ? {
			...init,
			headers: new Headers({
				...storageHeaders ? Object.fromEntries(storageHeaders.entries()) : {},
				...headers instanceof Headers ? Object.fromEntries(headers.entries()) : typeof headers === "object" ? headers : {}
			})
		} : { headers }));
	};
	const client = createAuthClient({
		...config?.clientOptions,
		baseURL: getBaseURL(options?.baseURL || "http://localhost:" + (config?.port || 3e3), options?.basePath || "/api/auth"),
		fetchOptions: { customFetchImpl }
	});
	async function signInWithTestUser() {
		if (config?.disableTestUser) throw new Error("Test user is disabled");
		let headers = new Headers();
		const setCookie = (name, value) => {
			const current = headers.get("cookie");
			headers.set("cookie", `${current || ""}; ${name}=${value}`);
		};
		const { data } = await client.signIn.email({
			email: testUser.email,
			password: testUser.password,
			fetchOptions: { onSuccess(context) {
				const signedCookie = parseSetCookieHeader(context.response.headers.get("set-cookie") || "").get("better-auth.session_token")?.value;
				headers.set("cookie", `better-auth.session_token=${signedCookie}`);
			} }
		});
		return {
			session: data.session,
			user: data.user,
			headers,
			setCookie,
			runWithUser: async (fn) => {
				return currentUserContextStorage.run({ headers }, async () => {
					await fn(headers);
				});
			}
		};
	}
	async function signInWithUser(email, password) {
		const headers = new Headers();
		const { data } = await client.signIn.email({
			email,
			password,
			fetchOptions: { onSuccess(context) {
				const signedCookie = parseSetCookieHeader(context.response.headers.get("set-cookie") || "").get("better-auth.session_token")?.value;
				headers.set("cookie", `better-auth.session_token=${signedCookie}`);
			} }
		});
		return {
			res: data,
			headers
		};
	}
	function sessionSetter(headers) {
		return (context) => {
			const header = context.response.headers.get("set-cookie");
			if (header) {
				const signedCookie = parseSetCookieHeader(header || "").get("better-auth.session_token")?.value;
				headers.set("cookie", `better-auth.session_token=${signedCookie}`);
			}
		};
	}
	return {
		auth,
		client,
		testUser,
		signInWithTestUser,
		signInWithUser,
		cookieSetter: setCookieToHeader,
		customFetchImpl,
		sessionSetter,
		db: await getAdapter(auth.options),
		runWithUser: async (email, password, fn) => {
			const { headers } = await signInWithUser(email, password);
			return currentUserContextStorage.run({ headers }, async () => {
				await fn(headers);
			});
		}
	};
}

//#endregion
export { getTestInstance };
//# sourceMappingURL=test-instance.mjs.map