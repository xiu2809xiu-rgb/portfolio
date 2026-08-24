CREATE TABLE "bookings" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"reference" varchar(16) NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"duration_minutes" varchar(4) NOT NULL,
	"status" varchar(16) DEFAULT 'confirmed' NOT NULL,
	"attendee_name" varchar(120) NOT NULL,
	"attendee_email" varchar(254) NOT NULL,
	"attendee_timezone" varchar(64) NOT NULL,
	"topic" varchar(160),
	"note" text,
	"calendar_event_id" varchar(256),
	"meeting_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_reference_idx" ON "bookings" USING btree ("reference");--> statement-breakpoint
CREATE INDEX "bookings_window_idx" ON "bookings" USING btree ("starts_at","ends_at");--> statement-breakpoint
CREATE INDEX "bookings_status_idx" ON "bookings" USING btree ("status");