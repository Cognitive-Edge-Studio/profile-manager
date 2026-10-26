import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_inquiries_source" AS ENUM('home', 'contact');
  ALTER TYPE "public"."enum_inquiries_notification_status" ADD VALUE 'sending' BEFORE 'sent';
  ALTER TYPE "public"."enum_inquiries_notification_status" ADD VALUE 'captured';
  ALTER TYPE "public"."enum_inquiries_notification_status" ADD VALUE 'review';
  ALTER TABLE "inquiries" ADD COLUMN "source" "enum_inquiries_source";
  ALTER TABLE "inquiries" ADD COLUMN "notification_attempts" numeric DEFAULT 0;
  ALTER TABLE "inquiries" ADD COLUMN "notification_error" varchar;
  ALTER TABLE "inquiries" ADD COLUMN "next_attempt_at" timestamp(3) with time zone;
  ALTER TABLE "inquiries" ADD COLUMN "notified_at" timestamp(3) with time zone;
  ALTER TABLE "inquiries" ADD COLUMN "expires_at" timestamp(3) with time zone;
  ALTER TABLE "inquiries" ADD COLUMN "payload_hash" varchar;
  ALTER TABLE "inquiries" ADD COLUMN "notification_key" varchar;
  ALTER TABLE "inquiries" ADD COLUMN "notification_provider_id" varchar;
  ALTER TABLE "inquiries" ADD COLUMN "lease_token" varchar;
  ALTER TABLE "inquiries" ADD COLUMN "lease_until" timestamp(3) with time zone;
  ALTER TABLE "inquiries" ADD COLUMN "first_send_at" timestamp(3) with time zone;
  ALTER TABLE "inquiries" ADD COLUMN "notification_envelope" jsonb;
  ALTER TABLE "site_settings" ADD COLUMN "home_form_heading" varchar DEFAULT 'Inquiry form';
  ALTER TABLE "site_settings" ADD COLUMN "form_help" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "name_label" varchar DEFAULT 'Your name';
  ALTER TABLE "site_settings" ADD COLUMN "email_label" varchar DEFAULT 'Email address';
  ALTER TABLE "site_settings" ADD COLUMN "message_label" varchar DEFAULT 'About your project';
  ALTER TABLE "site_settings" ADD COLUMN "home_message_label" varchar DEFAULT 'Tell me about the project';
  ALTER TABLE "site_settings" ADD COLUMN "budget_label" varchar DEFAULT 'Budget range';
  ALTER TABLE "site_settings" ADD COLUMN "timeline_label" varchar DEFAULT 'Preferred timeline';
  ALTER TABLE "site_settings" ADD COLUMN "message_placeholder" varchar DEFAULT 'I''d like to build or improve… It''s for… I need help with…';
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_home_form_heading" varchar DEFAULT 'Inquiry form';
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_form_help" varchar;
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_name_label" varchar DEFAULT 'Your name';
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_email_label" varchar DEFAULT 'Email address';
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_message_label" varchar DEFAULT 'About your project';
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_home_message_label" varchar DEFAULT 'Tell me about the project';
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_budget_label" varchar DEFAULT 'Budget range';
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_timeline_label" varchar DEFAULT 'Preferred timeline';
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_message_placeholder" varchar DEFAULT 'I''d like to build or improve… It''s for… I need help with…';
  CREATE INDEX "inquiries_expires_at_idx" ON "inquiries" USING btree ("expires_at");
  CREATE INDEX "inquiries_notification_due_idx" ON "inquiries" ("notification_status", "next_attempt_at");
  CREATE TABLE "contact_rate_limits" ("key" varchar PRIMARY KEY, "hits" integer NOT NULL, "expires_at" timestamp with time zone NOT NULL);
  CREATE INDEX "contact_rate_limits_expiry_idx" ON "contact_rate_limits" ("expires_at");
  CREATE TABLE "contact_receipts" ("key" varchar PRIMARY KEY, "payload_hash" varchar NOT NULL, "expires_at" timestamp with time zone NOT NULL);
  CREATE INDEX "contact_receipts_expiry_idx" ON "contact_receipts" ("expires_at");
  CREATE TABLE "contact_worker_state" ("id" integer PRIMARY KEY, "last_run_at" timestamp with time zone NOT NULL);
  UPDATE "inquiries" SET "expires_at" = "created_at" + interval '180 days' WHERE "expires_at" IS NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "contact_worker_state";
  DROP TABLE "contact_receipts";
  DROP TABLE "contact_rate_limits";
  DROP INDEX "inquiries_notification_due_idx";
  ALTER TABLE "inquiries" ALTER COLUMN "notification_status" SET DATA TYPE text;
  ALTER TABLE "inquiries" ALTER COLUMN "notification_status" SET DEFAULT 'pending'::text;
  DROP TYPE "public"."enum_inquiries_notification_status";
  CREATE TYPE "public"."enum_inquiries_notification_status" AS ENUM('pending', 'sent', 'failed');
  UPDATE "inquiries" SET "notification_status" = CASE WHEN "notification_status" = 'sent' THEN 'sent' ELSE 'failed' END;
  ALTER TABLE "inquiries" ALTER COLUMN "notification_status" SET DEFAULT 'pending'::"public"."enum_inquiries_notification_status";
  ALTER TABLE "inquiries" ALTER COLUMN "notification_status" SET DATA TYPE "public"."enum_inquiries_notification_status" USING "notification_status"::"public"."enum_inquiries_notification_status";
  DROP INDEX "inquiries_expires_at_idx";
  ALTER TABLE "inquiries" DROP COLUMN "source";
  ALTER TABLE "inquiries" DROP COLUMN "notification_attempts";
  ALTER TABLE "inquiries" DROP COLUMN "notification_error";
  ALTER TABLE "inquiries" DROP COLUMN "next_attempt_at";
  ALTER TABLE "inquiries" DROP COLUMN "notified_at";
  ALTER TABLE "inquiries" DROP COLUMN "expires_at";
  ALTER TABLE "inquiries" DROP COLUMN "payload_hash";
  ALTER TABLE "inquiries" DROP COLUMN "notification_key";
  ALTER TABLE "inquiries" DROP COLUMN "notification_provider_id";
  ALTER TABLE "inquiries" DROP COLUMN "lease_token";
  ALTER TABLE "inquiries" DROP COLUMN "lease_until";
  ALTER TABLE "inquiries" DROP COLUMN "first_send_at";
  ALTER TABLE "inquiries" DROP COLUMN "notification_envelope";
  ALTER TABLE "site_settings" DROP COLUMN "home_form_heading";
  ALTER TABLE "site_settings" DROP COLUMN "form_help";
  ALTER TABLE "site_settings" DROP COLUMN "name_label";
  ALTER TABLE "site_settings" DROP COLUMN "email_label";
  ALTER TABLE "site_settings" DROP COLUMN "message_label";
  ALTER TABLE "site_settings" DROP COLUMN "home_message_label";
  ALTER TABLE "site_settings" DROP COLUMN "budget_label";
  ALTER TABLE "site_settings" DROP COLUMN "timeline_label";
  ALTER TABLE "site_settings" DROP COLUMN "message_placeholder";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_home_form_heading";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_form_help";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_name_label";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_email_label";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_message_label";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_home_message_label";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_budget_label";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_timeline_label";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_message_placeholder";
  DROP TYPE "public"."enum_inquiries_source";`)
}
