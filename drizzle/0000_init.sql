CREATE TABLE "exercises" (
	"id" serial PRIMARY KEY NOT NULL,
	"workout_id" integer NOT NULL,
	"section" text DEFAULT 'חלק עיקרי' NOT NULL,
	"name" text NOT NULL,
	"kind" text DEFAULT 'sets' NOT NULL,
	"sets" integer DEFAULT 3 NOT NULL,
	"reps" text DEFAULT '' NOT NULL,
	"pair" text,
	"tip" text,
	"default_weight" numeric,
	"position" integer DEFAULT 0 NOT NULL,
	"archived" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"workout_id" integer NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "set_logs" (
	"session_id" integer NOT NULL,
	"exercise_id" integer NOT NULL,
	"set_index" integer NOT NULL,
	"done_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "set_logs_session_id_exercise_id_set_index_pk" PRIMARY KEY("session_id","exercise_id","set_index")
);
--> statement-breakpoint
CREATE TABLE "weight_logs" (
	"session_id" integer NOT NULL,
	"exercise_id" integer NOT NULL,
	"weight" numeric NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "weight_logs_session_id_exercise_id_pk" PRIMARY KEY("session_id","exercise_id")
);
--> statement-breakpoint
CREATE TABLE "workouts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"day_of_week" integer,
	"note" text,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_workout_id_workouts_id_fk" FOREIGN KEY ("workout_id") REFERENCES "public"."workouts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_workout_id_workouts_id_fk" FOREIGN KEY ("workout_id") REFERENCES "public"."workouts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "set_logs" ADD CONSTRAINT "set_logs_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "set_logs" ADD CONSTRAINT "set_logs_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weight_logs" ADD CONSTRAINT "weight_logs_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weight_logs" ADD CONSTRAINT "weight_logs_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "exercises_workout_idx" ON "exercises" USING btree ("workout_id");--> statement-breakpoint
CREATE INDEX "sessions_workout_idx" ON "sessions" USING btree ("workout_id");