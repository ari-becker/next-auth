import {
    InferModel, int, MySqlDatabase, mysqlTable,
    primaryKey,
    text,
    timestamp,
} from 'drizzle-orm/mysql-core'
import {Adapter, AdapterAccount} from "next-auth/adapters";
import {DrizzleDatabase} from "../index";
import {drizzle} from "drizzle-orm/mysql2";
import {createId} from "@paralleldrive/cuid2";
import {and, eq} from "drizzle-orm/expressions";

export const users = mysqlTable('users', {
    id: text('id').primaryKey(),
    name: text('name'),
    // TODO: set email to be unique
    email: text('email').notNull(),
    emailVerified: timestamp('email_verified'),
    image: text('image'),
    phone: text('phone'),
})

export type User = InferModel<typeof users>

export const accounts = mysqlTable('accounts', {
    userId: text('user_id').references(() => users.id, {onDelete: 'cascade'}),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refreshToken: text('refresh_token'),
    accessToken: text('access_token'),
    expiresAt: int('expires_at'),
    tokenType: text('token_type'),
    scope: text('scope'),
    idToken: text('id_token'),
    sessionState: text('session_state'),
}, (accounts) => ({
    cpk: primaryKey(accounts.provider, accounts.providerAccountId),
}))

export type Account = InferModel<typeof accounts>

export const sessions = mysqlTable('sessions', {
    userId: text('user_id').references(() => users.id, {onDelete: 'cascade'}),
    // TODO: set sessionToken to be unique
    sessionToken: text('session_token'),
    expires: timestamp('expires'),
})

export type Session = InferModel<typeof sessions>

export const verificationTokens = mysqlTable('verification_tokens', {
    id: text('id'),
    // TODO: set token to be unique
    token: text('token'),
    expires: timestamp('expires'),
}, (verificationTokens) => ({
    pk: primaryKey(verificationTokens.id, verificationTokens.token)
}))

export function DrizzleMySqlAdapter(db: MySqlDatabase<any, any>, idGenerator = createId): Adapter {
    return {
        async createUser (user) {
            return await db.insert(users)
                .values({...user, id: idGenerator()})
                .execute()
        },
        async getUser (id) {
            const result = await db.select({
                id: users.id,
                email: users.email,
                emailVerified: users.emailVerified,
            }).from(users).where(eq(users.id, id)).limit(1).execute()
            if (result.length > 0) return result[0]
            else return null
        },
        async getUserByEmail (email) {
            const result = await db.select({
                id: users.id,
                email: users.email,
                emailVerified: users.emailVerified,
            }).from(users).where(eq(users.email, email)).limit(1).execute()
            if (result.length > 0) return result[0]
            else return null
        },
        async getUserByAccount({provider, providerAccountId}) {
            const result = await db.select({
                id: users.id,
                email: users.email,
                emailVerified: users.emailVerified,
            }).from(users)
                .leftJoin(accounts, eq(users.id, accounts.userId))
                .where(and(eq(accounts.provider, provider), eq(accounts.providerAccountId, providerAccountId)))
                .limit(1)
                .execute()
            if (result.length > 0) return result[0]
            else return null
        },
        async updateUser ({id, ...data}) {
            const result = await db.update(users).set(data).where(eq(users.id, id)).execute()
        },
        deleteUser: (id) => p.user.delete({where: {id}}),
        linkAccount: (data) =>
            p.account.create({data}) as unknown as AdapterAccount,
        unlinkAccount: (provider_providerAccountId) =>
            p.account.delete({
                where: {provider_providerAccountId},
            }) as unknown as AdapterAccount,
        async getSessionAndUser(sessionToken) {
            const userAndSession = await p.session.findUnique({
                where: {sessionToken},
                include: {user: true},
            })
            if (!userAndSession) return null
            const {user, ...session} = userAndSession
            return {user, session}
        },
        createSession: (data) => p.session.create({data}),
        updateSession: (data) =>
            p.session.update({where: {sessionToken: data.sessionToken}, data}),
        deleteSession: (sessionToken) =>
            p.session.delete({where: {sessionToken}}),
        async createVerificationToken(data) {
            const verificationToken = await p.verificationToken.create({data})
            // @ts-expect-errors // MongoDB needs an ID, but we don't
            if (verificationToken.id) delete verificationToken.id
            return verificationToken
        },
        async useVerificationToken(identifier_token) {
            try {
                const verificationToken = await p.verificationToken.delete({
                    where: {identifier_token},
                })
                // @ts-expect-errors // MongoDB needs an ID, but we don't
                if (verificationToken.id) delete verificationToken.id
                return verificationToken
            } catch (error) {
                // If token already used/deleted, just return null
                // https://www.prisma.io/docs/reference/api-reference/error-reference#p2025
                if ((error as Prisma.PrismaClientKnownRequestError).code === "P2025")
                    return null
                throw error
            }
        },
    }
}
