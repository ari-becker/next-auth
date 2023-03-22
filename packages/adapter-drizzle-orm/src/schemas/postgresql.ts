import {
    InferModel,
    integer,
    pgTable,
    primaryKey,
    text,
    timestamp,
} from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
    id: text('id').primaryKey(),
    name: text('name'),
    // TODO: set email to be unique
    email: text('email'),
    emailVerified: timestamp('email_verified'),
    image: text('image'),
    phone: text('phone'),
})

export type User = InferModel<typeof users>

export const accounts = pgTable('accounts', {
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

export const sessions = pgTable('sessions', {
    userId: text('user_id').references(() => users.id, {onDelete: 'cascade'}),
    // TODO: set sessionToken to be unique
    sessionToken: text('session_token'),
    expires: timestamp('expires'),
})

export type Session = InferModel<typeof sessions>

export const verificationTokens = pgTable('verification_tokens', {
    id: text('id'),
    // TODO: set token to be unique
    token: text('token'),
    expires: timestamp('expires'),
}, (verificationTokens) => ({
    pk: primaryKey(verificationTokens.id, verificationTokens.token)
}))
