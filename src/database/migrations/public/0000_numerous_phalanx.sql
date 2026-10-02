CREATE TYPE "public"."tenant_status" AS ENUM('ACTIVE', 'SUSPENDED', 'PENDING', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."platform_user_role" AS ENUM('SUPER_ADMIN', 'SUPPORT', 'FINANCE', 'OPERATOR');--> statement-breakpoint
CREATE TYPE "public"."platform_user_status" AS ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED');--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"domain" varchar(255),
	"status" "tenant_status" DEFAULT 'ACTIVE' NOT NULL,
	"plan" varchar(50) DEFAULT 'FREE' NOT NULL,
	"schema_name" varchar(63) NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug"),
	CONSTRAINT "tenants_domain_unique" UNIQUE("domain"),
	CONSTRAINT "tenants_schema_name_unique" UNIQUE("schema_name")
);
--> statement-breakpoint
CREATE TABLE "platform_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"phone" varchar(30),
	"avatar_url" varchar(500),
	"role" "platform_user_role" DEFAULT 'SUPER_ADMIN' NOT NULL,
	"status" "platform_user_status" DEFAULT 'ACTIVE' NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "platform_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE INDEX "tenants_slug_idx" ON "tenants" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "tenants_domain_idx" ON "tenants" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "tenants_status_idx" ON "tenants" USING btree ("status");--> statement-breakpoint
CREATE INDEX "platform_users_email_idx" ON "platform_users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "platform_users_status_idx" ON "platform_users" USING btree ("status");