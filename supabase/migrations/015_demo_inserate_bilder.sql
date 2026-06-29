-- Demo-Objekte mit externen Stockbildern hinterlegen
-- Damit Karten/Details ohne Upload sofort Bilder anzeigen

UPDATE public.pastler_inserate
SET bild_url = CASE id
  WHEN '11111111-1111-1111-1111-111111111101' THEN 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1600'
  WHEN '11111111-1111-1111-1111-111111111102' THEN 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=1600'
  WHEN '11111111-1111-1111-1111-111111111103' THEN 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=1600'
  ELSE bild_url
END
WHERE id IN (
  '11111111-1111-1111-1111-111111111101',
  '11111111-1111-1111-1111-111111111102',
  '11111111-1111-1111-1111-111111111103'
);
