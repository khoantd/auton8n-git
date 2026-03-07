-- Create app.carousel_slides table for admin-managed carousel content.
-- Ad slides carry promotional copy; highlight slides reference a workflow by id.
-- Public can SELECT; only admins can INSERT / UPDATE / DELETE.

CREATE TABLE IF NOT EXISTS app.carousel_slides (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   timestamptz DEFAULT now() NOT NULL,
  slide_type   text        NOT NULL CHECK (slide_type IN ('ad', 'highlight')),
  sort_order   integer     DEFAULT 0 NOT NULL,

  -- Ad-slide fields (used when slide_type = 'ad')
  title        text,
  description  text,
  cta_label    text,
  cta_href     text,
  image_url    text,

  -- Highlight-slide field (used when slide_type = 'highlight')
  workflow_id  text
);

ALTER TABLE app.carousel_slides ENABLE ROW LEVEL SECURITY;

-- Anyone can read carousel slides (drives the public-facing carousel)
CREATE POLICY "Carousel slides are viewable by everyone"
  ON app.carousel_slides
  FOR SELECT
  USING (true);

-- Only admins can manage carousel slides
CREATE POLICY "Admins can manage carousel slides"
  ON app.carousel_slides
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM app.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM app.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
