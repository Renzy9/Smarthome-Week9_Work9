-- Classroom sample data. Only a new home receives seed devices.
START TRANSACTION;
SET @figuro_new_home := NOT EXISTS (SELECT 1 FROM gateways WHERE id = 1);
INSERT IGNORE INTO gateways (id, name, connected) VALUES (1, 'Home gateway', TRUE);
INSERT INTO devices (id, gateway_id, name, room, type, status, online) SELECT 1, 1, 'Pendant light', 'Living room', 'light', TRUE, TRUE WHERE @figuro_new_home;
INSERT INTO devices (id, gateway_id, name, room, type, status, online) SELECT 2, 1, 'Ceiling fan', 'Bedroom', 'fan', FALSE, TRUE WHERE @figuro_new_home;
INSERT INTO devices (id, gateway_id, name, room, type, status, online) SELECT 3, 1, 'Front door', 'Entrance', 'lock', TRUE, TRUE WHERE @figuro_new_home;
INSERT INTO devices (id, gateway_id, name, room, type, status, online) SELECT 4, 1, 'Desk lamp', 'Study', 'light', FALSE, TRUE WHERE @figuro_new_home;
INSERT INTO devices (id, gateway_id, name, room, type, status, online) SELECT 5, 1, 'Coffee maker', 'Kitchen', 'outlet', FALSE, TRUE WHERE @figuro_new_home;
INSERT INTO sensor_readings (gateway_id, temperature, humidity, light_level, recorded_at)
SELECT 1, 26.4, 62, 680, UTC_TIMESTAMP(3)
WHERE NOT EXISTS (SELECT 1 FROM sensor_readings WHERE gateway_id = 1);
COMMIT;
