import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const landRecords = sqliteTable('land_records', {
 id: text('id').primaryKey(),
 dataset: text('dataset').notNull(),
 data: text('data').notNull(),
});
import {integer} from 'drizzle-orm/sqlite-core';
export const aiUsage=sqliteTable('ai_usage',{bucket:text('bucket').primaryKey(),count:integer('count').notNull().default(0),expires:integer('expires').notNull()});
