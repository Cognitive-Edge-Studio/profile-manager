import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "redirects_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"services_id" integer,
  	"posts_id" integer
  );
  
  ALTER TABLE "pages_sections_actions" ADD COLUMN "required_for_publishing" boolean DEFAULT false;
  ALTER TABLE "pages_actions" ADD COLUMN "required_for_publishing" boolean DEFAULT false;
  ALTER TABLE "pages" ADD COLUMN "meta_structured_data" boolean DEFAULT true;
  ALTER TABLE "_pages_v_version_sections_actions" ADD COLUMN "required_for_publishing" boolean DEFAULT false;
  ALTER TABLE "_pages_v_version_actions" ADD COLUMN "required_for_publishing" boolean DEFAULT false;
  ALTER TABLE "_pages_v" ADD COLUMN "version_meta_structured_data" boolean DEFAULT true;
  ALTER TABLE "services_actions" ADD COLUMN "required_for_publishing" boolean DEFAULT false;
  ALTER TABLE "services" ADD COLUMN "meta_structured_data" boolean DEFAULT true;
  ALTER TABLE "_services_v_version_actions" ADD COLUMN "required_for_publishing" boolean DEFAULT false;
  ALTER TABLE "_services_v" ADD COLUMN "version_meta_structured_data" boolean DEFAULT true;
  ALTER TABLE "posts_actions" ADD COLUMN "required_for_publishing" boolean DEFAULT false;
  ALTER TABLE "posts" ADD COLUMN "meta_structured_data" boolean DEFAULT true;
  ALTER TABLE "_posts_v_version_actions" ADD COLUMN "required_for_publishing" boolean DEFAULT false;
  ALTER TABLE "_posts_v" ADD COLUMN "version_meta_structured_data" boolean DEFAULT true;
  ALTER TABLE "redirects" ADD COLUMN "enabled" boolean DEFAULT true;
  ALTER TABLE "site_settings_header_links" ADD COLUMN "required_for_publishing" boolean DEFAULT false;
  ALTER TABLE "site_settings_header_action" ADD COLUMN "required_for_publishing" boolean DEFAULT false;
  ALTER TABLE "site_settings_footer_links" ADD COLUMN "required_for_publishing" boolean DEFAULT false;
  ALTER TABLE "site_settings" ADD COLUMN "meta_structured_data" boolean DEFAULT true;
  ALTER TABLE "_site_settings_v_version_header_links" ADD COLUMN "required_for_publishing" boolean DEFAULT false;
  ALTER TABLE "_site_settings_v_version_header_action" ADD COLUMN "required_for_publishing" boolean DEFAULT false;
  ALTER TABLE "_site_settings_v_version_footer_links" ADD COLUMN "required_for_publishing" boolean DEFAULT false;
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_meta_structured_data" boolean DEFAULT true;
  ALTER TABLE "redirects_rels" ADD CONSTRAINT "redirects_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."redirects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "redirects_rels" ADD CONSTRAINT "redirects_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "redirects_rels" ADD CONSTRAINT "redirects_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "redirects_rels_order_idx" ON "redirects_rels" USING btree ("order");
  CREATE INDEX "redirects_rels_parent_idx" ON "redirects_rels" USING btree ("parent_id");
  CREATE INDEX "redirects_rels_path_idx" ON "redirects_rels" USING btree ("path");
  CREATE INDEX "redirects_rels_services_id_idx" ON "redirects_rels" USING btree ("services_id");
  CREATE INDEX "redirects_rels_posts_id_idx" ON "redirects_rels" USING btree ("posts_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "redirects_rels" CASCADE;
  ALTER TABLE "pages_sections_actions" DROP COLUMN "required_for_publishing";
  ALTER TABLE "pages_actions" DROP COLUMN "required_for_publishing";
  ALTER TABLE "pages" DROP COLUMN "meta_structured_data";
  ALTER TABLE "_pages_v_version_sections_actions" DROP COLUMN "required_for_publishing";
  ALTER TABLE "_pages_v_version_actions" DROP COLUMN "required_for_publishing";
  ALTER TABLE "_pages_v" DROP COLUMN "version_meta_structured_data";
  ALTER TABLE "services_actions" DROP COLUMN "required_for_publishing";
  ALTER TABLE "services" DROP COLUMN "meta_structured_data";
  ALTER TABLE "_services_v_version_actions" DROP COLUMN "required_for_publishing";
  ALTER TABLE "_services_v" DROP COLUMN "version_meta_structured_data";
  ALTER TABLE "posts_actions" DROP COLUMN "required_for_publishing";
  ALTER TABLE "posts" DROP COLUMN "meta_structured_data";
  ALTER TABLE "_posts_v_version_actions" DROP COLUMN "required_for_publishing";
  ALTER TABLE "_posts_v" DROP COLUMN "version_meta_structured_data";
  ALTER TABLE "redirects" DROP COLUMN "enabled";
  ALTER TABLE "site_settings_header_links" DROP COLUMN "required_for_publishing";
  ALTER TABLE "site_settings_header_action" DROP COLUMN "required_for_publishing";
  ALTER TABLE "site_settings_footer_links" DROP COLUMN "required_for_publishing";
  ALTER TABLE "site_settings" DROP COLUMN "meta_structured_data";
  ALTER TABLE "_site_settings_v_version_header_links" DROP COLUMN "required_for_publishing";
  ALTER TABLE "_site_settings_v_version_header_action" DROP COLUMN "required_for_publishing";
  ALTER TABLE "_site_settings_v_version_footer_links" DROP COLUMN "required_for_publishing";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_meta_structured_data";`)
}
