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
