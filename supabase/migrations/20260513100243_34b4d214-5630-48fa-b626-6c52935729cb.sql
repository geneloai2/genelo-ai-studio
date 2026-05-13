
CREATE TABLE public.chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'New chat',
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own chats select" ON public.chats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own chats insert" ON public.chats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own chats update" ON public.chats FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own chats delete" ON public.chats FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "admin read chats" ON public.chats FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_chats_user_updated ON public.chats(user_id, updated_at DESC);
