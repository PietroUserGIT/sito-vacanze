-- Tabella Appartamenti
CREATE TABLE properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_per_night DECIMAL NOT NULL,
  capacity INTEGER NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella Prenotazioni
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id),
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  total_price DECIMAL NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, confirmed, cancelled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserimento dati d'esempio
INSERT INTO properties (name, description, price_per_night, capacity, image_url)
VALUES 
('Appartamento Vista Mare', 'Splendido bilocale con finestra sull''oceano.', 120.00, 4, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'),
('Suite nel Bosco', 'Immersa nel verde, dotata di jacuzzi e camino.', 90.00, 2, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688');
