DROP INDEX "bookings_live_slot_idx";--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "action_token" varchar(64) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "hold_expires_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_live_slot_idx" ON "bookings" USING btree ("starts_at") WHERE "bookings"."status" in ('pending', 'confirmed');