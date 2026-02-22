-- Creazione della tabella per le impostazioni generali (inclusi i template email)
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Abilitazione RLS (Row Level Security)
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Policy: chiunque può leggere le impostazioni (opzionale, ma utile per il backend)
CREATE POLICY "Enable read access for all users" ON settings
FOR SELECT USING (true);

-- Policy: solo gli admin autenticati possono modificare le impostazioni
CREATE POLICY "Enable update for authenticated users" ON settings
FOR UPDATE USING (auth.role() = 'authenticated');

-- Inserimento template di default per Caparra e Saldo
INSERT INTO settings (id, value) VALUES 
('email_deposit_template', 'Gentile {{guest_name}},\n\nSiamo felici di confermarle che la sua prenotazione è stata APPROVATA!\n\nRiepilogo soggiorno:\n- Struttura: {{property_name}}\n- Check-in: {{check_in}}\n- Check-out: {{check_out}}\n\nPer confermare definitivamente le date sul calendario, le chiediamo di procedere al pagamento della CAPARRA:\n- Importo Caparra: €{{payment_amount}} su €{{total_price}} totali\n- Scadenza pagamento caparra: {{due_date}}\n\n- **Link Sicuro Stripe per la Caparra:** \n{{payment_link}}\n\nDopo il pagamento della caparra le sarà inviata un''ulteriore mail contenente il link per il pagamento del saldo.\n\nRimaniamo a disposizione.\nCordiali saluti,\nVacanze Mare'),
('email_balance_template', 'Gentile {{guest_name}},\n\nCi avviciniamo alla data del suo soggiorno!\nCome da precedenti accordi, le chiediamo di procedere al versamento del SALDO FINALE per la sua prenotazione.\n\nRiepilogo soggiorno:\n- Struttura: {{property_name}}\n- Check-in: {{check_in}}\n- Check-out: {{check_out}}\n\nDettagli Saldo:\n- Importo Saldo Restante: €{{payment_amount}}\n- Scadenza pagamento saldo: {{due_date}}\n\n- **Link Sicuro Stripe per il Saldo:** \n{{payment_link}}\n\nRimaniamo in attesa e le auguriamo un felice soggiorno!\nCordiali saluti,\nVacanze Mare')
ON CONFLICT (id) DO NOTHING;
