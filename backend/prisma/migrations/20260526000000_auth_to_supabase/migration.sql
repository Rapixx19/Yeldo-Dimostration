-- Migrate from custom bcrypt+JWT auth to Supabase Auth.
--
-- Strategy: drop public.users (CUID) and recreate as UUID matching auth.users.id.
-- Investments are wiped here and re-seeded after; v1 only had demo data, so
-- this is safe for prod.

-- Drop the FK first so we can recreate users freely
ALTER TABLE "investments" DROP CONSTRAINT IF EXISTS "investments_userId_fkey";

-- Recreate users with UUID id matching auth.users(id)
DROP TABLE IF EXISTS "users" CASCADE;
CREATE TABLE "users" (
  "id"        UUID PRIMARY KEY,
  "email"     TEXT NOT NULL UNIQUE,
  "name"      TEXT NOT NULL,
  "avatarUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "users_auth_fk" FOREIGN KEY ("id") REFERENCES auth.users("id") ON DELETE CASCADE
);

-- Rebuild investments.userId as UUID and re-add FK
TRUNCATE TABLE "investments";
ALTER TABLE "investments" DROP COLUMN "userId";
ALTER TABLE "investments" ADD COLUMN "userId" UUID NOT NULL;
ALTER TABLE "investments" ADD CONSTRAINT "investments_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
CREATE INDEX "investments_userId_idx" ON "investments"("userId");

-- Trigger: every new auth.users row gets a matching public.users row.
-- Reads name from user_metadata.name | full_name (set on signup / OAuth),
-- avatar from user_metadata.avatar_url (set by Google OAuth).
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, "avatarUrl")
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- RLS: public.users — each user can read+update only their own row.
-- Service role (backend, seed) bypasses RLS by design.
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON "users"
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON "users"
  FOR UPDATE USING (auth.uid() = id);
