import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" ADD COLUMN "source_id" varchar;
  ALTER TABLE "media" ADD COLUMN "source_snapshot" jsonb;
  CREATE UNIQUE INDEX "media_source_id_idx" ON "media" USING btree ("source_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "media_source_id_idx";
  ALTER TABLE "media" DROP COLUMN "source_id";
  ALTER TABLE "media" DROP COLUMN "source_snapshot";`)
}
