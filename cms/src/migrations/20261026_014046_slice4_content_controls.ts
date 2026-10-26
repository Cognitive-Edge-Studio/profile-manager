import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_site_settings_header_action_kind" AS ENUM('internal', 'external', 'contact');
  CREATE TYPE "public"."enum_site_settings_header_action_relationship" AS ENUM('normal', 'sponsored', 'nofollow');
  CREATE TYPE "public"."enum__site_settings_v_version_header_action_kind" AS ENUM('internal', 'external', 'contact');
  CREATE TYPE "public"."enum__site_settings_v_version_header_action_relationship" AS ENUM('normal', 'sponsored', 'nofollow');
  ALTER TYPE "public"."enum_pages_sections_template" ADD VALUE 'purpose';
  ALTER TYPE "public"."enum_pages_sections_template" ADD VALUE 'benefits';
  ALTER TYPE "public"."enum_pages_sections_template" ADD VALUE 'cta';
  ALTER TYPE "public"."enum__pages_v_version_sections_template" ADD VALUE 'purpose';
  ALTER TYPE "public"."enum__pages_v_version_sections_template" ADD VALUE 'benefits';
  ALTER TYPE "public"."enum__pages_v_version_sections_template" ADD VALUE 'cta';
  CREATE TABLE "pages_tools" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar
  );
  
  CREATE TABLE "_pages_v_version_tools" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "site_settings_header_action" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"kind" "enum_site_settings_header_action_kind" DEFAULT 'internal',
  	"url" varchar,
  	"fragment" varchar,
  	"new_tab" boolean DEFAULT false,
  	"relationship" "enum_site_settings_header_action_relationship" DEFAULT 'normal'
  );
  
  CREATE TABLE "_site_settings_v_version_header_action" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"kind" "enum__site_settings_v_version_header_action_kind" DEFAULT 'internal',
  	"url" varchar,
  	"fragment" varchar,
  	"new_tab" boolean DEFAULT false,
  	"relationship" "enum__site_settings_v_version_header_action_relationship" DEFAULT 'normal',
  	"_uuid" varchar
  );
  
  ALTER TABLE "pages_sections" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "pages_sections" ADD COLUMN "note" jsonb;
  ALTER TABLE "pages" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "_pages_v_version_sections" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "_pages_v_version_sections" ADD COLUMN "note" jsonb;
  ALTER TABLE "_pages_v" ADD COLUMN "version_eyebrow" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "source_id" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "source_snapshot" jsonb;
  ALTER TABLE "site_settings" ADD COLUMN "workspace_image_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "remote_label" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "portrait_caption" varchar;
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_source_id" varchar;
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_source_snapshot" jsonb;
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_workspace_image_id" integer;
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_remote_label" varchar;
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_portrait_caption" varchar;
  ALTER TABLE "pages_tools" ADD CONSTRAINT "pages_tools_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_version_tools" ADD CONSTRAINT "_pages_v_version_tools_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_header_action" ADD CONSTRAINT "site_settings_header_action_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_header_action" ADD CONSTRAINT "_site_settings_v_version_header_action_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_tools_order_idx" ON "pages_tools" USING btree ("_order");
  CREATE INDEX "pages_tools_parent_id_idx" ON "pages_tools" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_version_tools_order_idx" ON "_pages_v_version_tools" USING btree ("_order");
  CREATE INDEX "_pages_v_version_tools_parent_id_idx" ON "_pages_v_version_tools" USING btree ("_parent_id");
  CREATE INDEX "site_settings_header_action_order_idx" ON "site_settings_header_action" USING btree ("_order");
  CREATE INDEX "site_settings_header_action_parent_id_idx" ON "site_settings_header_action" USING btree ("_parent_id");
  CREATE INDEX "_site_settings_v_version_header_action_order_idx" ON "_site_settings_v_version_header_action" USING btree ("_order");
  CREATE INDEX "_site_settings_v_version_header_action_parent_id_idx" ON "_site_settings_v_version_header_action" USING btree ("_parent_id");
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_workspace_image_id_media_id_fk" FOREIGN KEY ("workspace_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_site_settings_v" ADD CONSTRAINT "_site_settings_v_version_workspace_image_id_media_id_fk" FOREIGN KEY ("version_workspace_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "site_settings_source_id_idx" ON "site_settings" USING btree ("source_id");
  CREATE INDEX "site_settings_workspace_image_idx" ON "site_settings" USING btree ("workspace_image_id");
  CREATE INDEX "_site_settings_v_version_version_source_id_idx" ON "_site_settings_v" USING btree ("version_source_id");
  CREATE INDEX "_site_settings_v_version_version_workspace_image_idx" ON "_site_settings_v" USING btree ("version_workspace_image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_tools" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_version_tools" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_header_action" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_site_settings_v_version_header_action" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_tools" CASCADE;
  DROP TABLE "_pages_v_version_tools" CASCADE;
  DROP TABLE "site_settings_header_action" CASCADE;
  DROP TABLE "_site_settings_v_version_header_action" CASCADE;
  ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_workspace_image_id_media_id_fk";
  
  ALTER TABLE "_site_settings_v" DROP CONSTRAINT "_site_settings_v_version_workspace_image_id_media_id_fk";
  
  ALTER TABLE "pages_sections" ALTER COLUMN "template" SET DATA TYPE text;
  ALTER TABLE "pages_sections" ALTER COLUMN "template" SET DEFAULT 'copy'::text;
  DROP TYPE "public"."enum_pages_sections_template";
  CREATE TYPE "public"."enum_pages_sections_template" AS ENUM('copy', 'services', 'projects', 'process', 'faqs', 'contact', 'technology', 'interests');
  ALTER TABLE "pages_sections" ALTER COLUMN "template" SET DEFAULT 'copy'::"public"."enum_pages_sections_template";
  ALTER TABLE "pages_sections" ALTER COLUMN "template" SET DATA TYPE "public"."enum_pages_sections_template" USING "template"::"public"."enum_pages_sections_template";
  ALTER TABLE "_pages_v_version_sections" ALTER COLUMN "template" SET DATA TYPE text;
  ALTER TABLE "_pages_v_version_sections" ALTER COLUMN "template" SET DEFAULT 'copy'::text;
  DROP TYPE "public"."enum__pages_v_version_sections_template";
  CREATE TYPE "public"."enum__pages_v_version_sections_template" AS ENUM('copy', 'services', 'projects', 'process', 'faqs', 'contact', 'technology', 'interests');
  ALTER TABLE "_pages_v_version_sections" ALTER COLUMN "template" SET DEFAULT 'copy'::"public"."enum__pages_v_version_sections_template";
  ALTER TABLE "_pages_v_version_sections" ALTER COLUMN "template" SET DATA TYPE "public"."enum__pages_v_version_sections_template" USING "template"::"public"."enum__pages_v_version_sections_template";
  DROP INDEX "site_settings_source_id_idx";
  DROP INDEX "site_settings_workspace_image_idx";
  DROP INDEX "_site_settings_v_version_version_source_id_idx";
  DROP INDEX "_site_settings_v_version_version_workspace_image_idx";
  ALTER TABLE "pages_sections" DROP COLUMN "eyebrow";
  ALTER TABLE "pages_sections" DROP COLUMN "note";
  ALTER TABLE "pages" DROP COLUMN "eyebrow";
  ALTER TABLE "_pages_v_version_sections" DROP COLUMN "eyebrow";
  ALTER TABLE "_pages_v_version_sections" DROP COLUMN "note";
  ALTER TABLE "_pages_v" DROP COLUMN "version_eyebrow";
  ALTER TABLE "site_settings" DROP COLUMN "source_id";
  ALTER TABLE "site_settings" DROP COLUMN "source_snapshot";
  ALTER TABLE "site_settings" DROP COLUMN "workspace_image_id";
  ALTER TABLE "site_settings" DROP COLUMN "remote_label";
  ALTER TABLE "site_settings" DROP COLUMN "portrait_caption";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_source_id";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_source_snapshot";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_workspace_image_id";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_remote_label";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_portrait_caption";
  DROP TYPE "public"."enum_site_settings_header_action_kind";
  DROP TYPE "public"."enum_site_settings_header_action_relationship";
  DROP TYPE "public"."enum__site_settings_v_version_header_action_kind";
  DROP TYPE "public"."enum__site_settings_v_version_header_action_relationship";`)
}
