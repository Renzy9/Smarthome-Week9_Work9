CREATE DATABASE IF NOT EXISTS figuro_smarthome CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE figuro_smarthome;

-- MySQL 8.0.16+ / 8.4. Tables for one Figuro home.
CREATE TABLE IF NOT EXISTS gateways (
    id INT UNSIGNED NOT NULL PRIMARY KEY,
    name VARCHAR(80) NOT NULL,
    connected BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT ck_gateway_connected CHECK (connected IN (0, 1))
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS devices (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    gateway_id INT UNSIGNED NOT NULL DEFAULT 1,
    name VARCHAR(60) NOT NULL,
    room VARCHAR(40) NOT NULL,
    type ENUM('light', 'fan', 'lock', 'outlet') NOT NULL,
    status BOOLEAN NOT NULL DEFAULT FALSE,
    online BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_device_gateway FOREIGN KEY (gateway_id) REFERENCES gateways(id),
    CONSTRAINT ck_device_status CHECK (status IN (0, 1)),
    CONSTRAINT ck_device_online CHECK (online IN (0, 1))
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sensor_readings (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    gateway_id INT UNSIGNED NOT NULL DEFAULT 1,
    temperature DECIMAL(6, 2) NOT NULL,
    humidity DECIMAL(5, 2) NOT NULL,
    light_level DECIMAL(10, 2) NOT NULL,
    recorded_at DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    CONSTRAINT fk_sensor_gateway FOREIGN KEY (gateway_id) REFERENCES gateways(id),
    CONSTRAINT ck_sensor_humidity CHECK (humidity BETWEEN 0 AND 100),
    CONSTRAINT ck_sensor_light CHECK (light_level >= 0),
    INDEX ix_latest_reading (gateway_id, recorded_at, id)
) ENGINE=InnoDB;

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
