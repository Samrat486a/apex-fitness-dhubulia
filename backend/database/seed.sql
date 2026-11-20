-- Apex Fitness — starting data. Safe to re-run (upserts).
-- Prices are SAMPLE values: change them in /admin → Membership plans (or here) before going live.

SET NAMES utf8mb4;

INSERT INTO membership_plans (slug, name, duration_days, price, tagline, features, is_featured, is_active, sort_order) VALUES
('monthly',     'Monthly',     30,  1000.00, 'Start strong, no long commitment.',
  '["Full gym floor access","Cardio & strength zones","Locker room access","Free fitness assessment"]', 0, 1, 1),
('quarterly',   'Quarterly',   90,  3200.00, 'Our most popular way to build a habit.',
  '["Everything in Monthly","Personal workout plan","Monthly progress check-in","Group class access"]', 1, 1, 2),
('half-yearly', 'Half-Yearly', 180, 5800.00, 'Six months to transform your training.',
  '["Everything in Quarterly","2 personal training sessions","Nutrition guidance session","Priority class booking"]', 0, 1, 3),
('yearly',      'Yearly',      365, 9999.00, 'Best value for committed athletes.',
  '["Everything in Half-Yearly","6 personal training sessions","Quarterly body composition scan","Freeze up to 30 days"]', 0, 1, 4)
ON DUPLICATE KEY UPDATE name = VALUES(name), duration_days = VALUES(duration_days), tagline = VALUES(tagline),
  features = VALUES(features), is_featured = VALUES(is_featured), sort_order = VALUES(sort_order);

INSERT INTO settings (setting_key, setting_value) VALUES
('gym_name',             'Apex Fitness'),
('gym_tagline',          'Train Strong. Live Stronger.'),
('gym_address',          'Saratpally, Dhubulia, Dwipchandrapur, Nadia, West Bengal 741139'),
('gym_phone',            '+91 86170 96552'),
('gym_whatsapp',         '+91 93822 66803'),
('gym_email',            'hello@apexfitness.example'),
('gym_hours_weekdays',   '5:00 AM – 10:00 PM'),
('gym_hours_weekends',   '6:00 AM – 8:00 PM'),
('gym_map_url',          'https://www.google.com/maps/place/Apex+Fitness/@23.4881324,88.4374046,18z/data=!4m6!3m5!1s0x39f919488fe53249:0xfa7af03e705a74d2!8m2!3d23.4881324!4d88.4374046!16s%2Fg%2F11zynl4_0b'),
('gym_map_query',        'Apex Fitness, Dhubulia'),   -- what the embedded map shows: the Google Maps listing name (or "lat, lng")
('reminders_email',      '1'),
('reminders_whatsapp',   '1'),
('reminders_dashboard',  '1'),
('reminder_first_days',  '5'),
('reminder_second_days', '3')
ON DUPLICATE KEY UPDATE setting_key = setting_key;   -- never overwrite values staff already changed

-- First admin account: register normally on the website, then run (with your email):
--   UPDATE users SET role = 'admin', onboarding_status = 'not_member' WHERE email = 'you@example.com';
-- or from a terminal:  php backend/scripts/create-admin.php you@example.com "Your Name"
