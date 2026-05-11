CREATE TABLE public.user_data (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own data"
ON public.user_data FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own data"
ON public.user_data FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own data"
ON public.user_data FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own data"
ON public.user_data FOR DELETE
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_user_data_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_user_data_updated_at
BEFORE UPDATE ON public.user_data
FOR EACH ROW
EXECUTE FUNCTION public.update_user_data_timestamp();