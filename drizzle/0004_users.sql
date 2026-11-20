CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_idx" ON "users" USING btree ("username");--> statement-breakpoint
-- Existing data belongs to the original user; asi starts with an empty plan.
INSERT INTO "users" ("username", "name") VALUES ('liran', 'לירן'), ('asi', 'אסי');--> statement-breakpoint
ALTER TABLE "workouts" ADD COLUMN "user_id" integer;--> statement-breakpoint
UPDATE "workouts" SET "user_id" = (SELECT "id" FROM "users" WHERE "username" = 'liran');--> statement-breakpoint
-- Preview builds share the production DB, so this can run while the old code is still live.
-- The default keeps the old code's inserts working (they go to liran); the new code always sets user_id.
DO $$ BEGIN
  EXECUTE format('ALTER TABLE "workouts" ALTER COLUMN "user_id" SET DEFAULT %s', (SELECT "id" FROM "users" WHERE "username" = 'liran'));
END $$;--> statement-breakpoint
ALTER TABLE "workouts" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "workouts_user_idx" ON "workouts" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
