import {
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * Phase B schema — relational tables backing the multiplayer Bastion Planner.
 *
 * `state_jsonb` and `history_jsonb` are intentionally opaque (the app's
 * `Bastion` shape in `src/types/bastion.ts` lives entirely in JSONB so the
 * domain reducers do not need column-level migrations).
 *
 * `history_jsonb` is a max-10-deep ring of prior `Bastion` snapshots, updated
 * atomically with `state_jsonb` on each Advance.
 */

export const users = pgTable('users', {
  // Clerk userId, e.g. "user_2abc..."
  id: text('id').primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  dmUserId: text('dm_user_id')
    .notNull()
    .references(() => users.id),
  inviteCode: text('invite_code').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const campaignMembers = pgTable(
  'campaign_members',
  {
    campaignId: uuid('campaign_id')
      .notNull()
      .references(() => campaigns.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role', { enum: ['dm', 'player'] }).notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.campaignId, table.userId] }),
  ],
);

export const bastions = pgTable('bastions', {
  id: uuid('id').primaryKey().defaultRandom(),
  // One bastion per campaign (for Phase B / C). Relax later if needed.
  campaignId: uuid('campaign_id')
    .notNull()
    .unique()
    .references(() => campaigns.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  // Full `Bastion` document (see src/types/bastion.ts).
  stateJsonb: jsonb('state_jsonb').notNull(),
  // Rewind ring: array of up to 10 prior `Bastion` snapshots, newest first.
  historyJsonb: jsonb('history_jsonb').notNull().default([]),
  version: integer('version').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
