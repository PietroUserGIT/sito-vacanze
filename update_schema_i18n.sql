-- Aggiornamento tabella Properties per supporto multilingua
ALTER TABLE properties 
ADD COLUMN name_en TEXT,
ADD COLUMN name_fr TEXT,
ADD COLUMN name_de TEXT,
ADD COLUMN description_en TEXT,
ADD COLUMN description_fr TEXT,
ADD COLUMN description_de TEXT;

-- Aggiornamento dati esistenti con traduzioni
UPDATE properties 
SET 
  name_en = 'Sea View Apartment',
  description_en = 'Beautiful two-room apartment with a window over the ocean.',
  name_fr = 'Appartement Vue sur Mer',
  description_fr = 'Splendide appartement de deux pièces avec vue sur l''océan.',
  name_de = 'Apartment mit Meerblick',
  description_de = 'Wunderschöne Zweizimmerwohnung mit Blick auf den Ozean.'
WHERE name = 'Appartamento Vista Mare';

UPDATE properties 
SET 
  name_en = 'Suite in the Woods',
  description_en = 'Immersed in greenery, equipped with jacuzzi and fireplace.',
  name_fr = 'Suite dans le Bois',
  description_fr = 'Immergé dans la verdure, équipé d''un jacuzzi et d''une cheminée.',
  name_de = 'Suite im Wald',
  description_de = 'Mitten im Grünen, ausgestattet mit Whirlpool und Kamin.'
WHERE name = 'Suite nel Bosco';
