# Figuro SmartHomeApp — WEEK9_WORK9

This project keeps the existing simple Figuro frontend and adds a Node.js API with a MySQL database named **figuro_smarthome**. Device additions, switch states, and removals are saved in MySQL. The UI and navigation are unchanged.

## What is included

| Location | Purpose |
| --- | --- |
| `src/` | Existing Expo / React Native frontend |
| `server/` | Backend API using the MySQL2 driver |
| `database/figuro_smarthome.sql` | Complete MySQL import: database, tables, and sample data |
| `database/schema.sql` | Three table definitions |
| `database/seed.sql` | Initial gateway, five devices, and one sample sensor reading |

The flow is: **Figuro app → API → MySQL**. The mobile app does not connect directly to MySQL or contain database passwords.

## Requirements

- Node.js 22.13 or newer.
- A running MySQL 8.0.16+ server; MySQL 8.4 is supported and was used for verification.
- Your MySQL username, password, and port. MySQL Workbench is an optional interface; it does not replace the MySQL server.

## 1. Set up the database and backend

Open a terminal in the extracted project folder:

```powershell
cd server
npm ci
Copy-Item .env.example .env
```

Edit `server/.env` and set `DB_HOST`, `DB_PORT`, `DB_USER`, and `DB_PASSWORD` to your MySQL connection details. Keep `DB_DATABASE=figuro_smarthome`.

Then run:

```powershell
npm run db:setup
npm start
```

The setup creates the database and seeds the sample home. It does not drop tables, reset switches, or restore previously deleted sample devices when run again. The setup account needs permission to create the database and tables. The API runs at `http://127.0.0.1:3001` by default.

**Alternative import:** Open `database/figuro_smarthome.sql` in MySQL Workbench and execute it, or run it with the MySQL client. If you import it manually, skip `npm run db:setup`, but still configure `server/.env` and start the backend. This is the same schema and sample data.

## 2. Run the frontend

Leave the backend terminal open. Open a second terminal in the project root:

```powershell
npm ci
Copy-Item .env.example .env.local
npm run web
```

The frontend example points to `http://127.0.0.1:3001`. Restart Expo after changing it. If your web preview uses a different origin/port, add that origin to `CORS_ORIGINS` in `server/.env`, then restart the backend. Default origins include `http://localhost:8081` and `http://127.0.0.1:8081`.

For a physical phone, use your computer's LAN IP in `EXPO_PUBLIC_API_URL`, and set `HOST=0.0.0.0` in the backend environment so the phone can reach it. Keep all MySQL credentials only in `server/.env`. The blank `EXPO_PUBLIC_API_URL` still enables the original frontend demo; demo changes do not go into MySQL.

## Database tables

- **gateways:** the home gateway's name and stored connection flag.
- **devices:** device name, room, type, power/lock state, online flag, and gateway link.
- **sensor_readings:** temperature in Celsius, humidity percentage, light in lux, UTC timestamp, and gateway link. The API returns the latest stored reading.

Sample data is for classroom demonstration. Gateway/online flags are stored statuses; the backend saves device commands but does not discover, pair, or operate physical IoT hardware. Sensor values change when new readings are inserted into MySQL, rather than randomly changing on refresh. Home name, appearance, Fahrenheit choice, and automatic refresh remain local frontend preferences. Recent UI activity remains session-only.

Example: insert another sensor reading in MySQL and refresh Sensors in the app:

```sql
USE figuro_smarthome;
INSERT INTO sensor_readings (gateway_id, temperature, humidity, light_level)
VALUES (1, 27.5, 64, 700);
```

## Existing API contract

Responses are direct JSON values; there is no `data` wrapper.

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/gateway` | Gateway connection status |
| GET | `/devices` | Stored device list |
| GET | `/sensors` | Latest sensor reading |
| POST | `/devices` | Add `{ "name": "Desk lamp", "room": "Study", "type": "light" }` |
| PATCH | `/devices/:id` | Save `{ "status": true }` |
| DELETE | `/devices/:id` | Remove device; returns HTTP 204 |

Types are `light`, `fan`, `lock`, and `outlet`. `status: true` means on, or locked for a lock. JSON booleans and camelCase sensor fields match the existing frontend. The local classroom API has no sign-in/authentication and binds to loopback by default. The frontend's future token-provider hook remains unchanged.

## Validation

Frontend, from the project root:

```powershell
npm run typecheck
node --test --test-isolation=none tests/service.test.cjs tests/presentation.test.cjs
```

Backend, from `server/`:

```powershell
npm test
npm run test:mysql
```

The MySQL integration test uses your configured server credentials but creates and removes its own uniquely named temporary database. It does not modify `figuro_smarthome`; the account needs permission to create/drop that temporary database.

Verified on October 9, 2026: frontend type check, 11 frontend tests, 6 backend tests, real MySQL 8.4.11 integration (schema, import, seed safety, CRUD, persistence, SQL placeholders, offline restrictions, timestamps, and database constraints), and web export. Physical Android/iOS hardware was not tested in this database update.

References: [MySQL](https://dev.mysql.com/doc/refman/8.4/en/), [MySQL2](https://sidorares.github.io/node-mysql2/docs), [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/).
