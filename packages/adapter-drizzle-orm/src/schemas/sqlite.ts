import {
    InferModel,
    integer,
    primaryKey, sqliteTable,
    text,
} from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
    id: text('id').primaryKey(),
    name: text('name'),
    // TODO: set email to be unique
    email: text('email'),
    emailVerified: integer('email_verified', {mode: 'timestamp'}),
    image: text('image'),
    phone: text('phone'),
})

export type User = InferModel<typeof users>

export const accounts = sqliteTable('accounts', {
    userId: text('user_id').references(() => users.id, {onDelete: 'cascade'}),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refreshToken: text('refresh_token'),
    accessToken: text('access_token'),
    expiresAt: integer('expires_at'),
    tokenType: text('token_type'),
    scope: text('scope'),
    idToken: text('id_token'),
    sessionState: text('session_state'),
}, (accounts) => ({
    cpk: primaryKey(accounts.provider, accounts.providerAccountId),
}))

export type Account = InferModel<typeof accounts>

export const sessions = sqliteTable('sessions', {
    userId: text('user_id').references(() => users.id, {onDelete: 'cascade'}),
    // TODO: set sessionToken to be unique
    sessionToken: text('session_token'),
    expires: integer('expires', {mode: 'timestamp'}),
})

export type Session = InferModel<typeof sessions>

export const verificationTokens = sqliteTable('verification_tokens', {
    id: text('id'),
    // TODO: set token to be unique
    token: text('token'),
    expires: integer('expires', {mode: 'timestamp'}),
}, (verificationTokens) => ({
    pk: primaryKey(verificationTokens.id, verificationTokens.token)
}))
