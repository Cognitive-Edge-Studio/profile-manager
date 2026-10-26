import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "posts" ADD COLUMN "reading_minutes" numeric;
  ALTER TABLE "_posts_v" ADD COLUMN "version_reading_minutes" numeric;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "posts" DROP COLUMN "reading_minutes";
  ALTER TABLE "_posts_v" DROP COLUMN "version_reading_minutes";`)
}
