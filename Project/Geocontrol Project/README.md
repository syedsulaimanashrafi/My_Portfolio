# GeoControl API

GeoControl API is a TypeScript/Express backend for managing monitoring networks, gateways, sensors, and the measurements they produce. It includes token-based authentication, role-based access control, measurement statistics, outlier detection, Swagger documentation, and automated tests.

## What This Project Does

The system models a simple hierarchy:

Network -> Gateway -> Sensor -> Measurement

Networks group devices logically, gateways represent physical collection points, sensors send readings, and the API stores and analyzes those readings over time. The Swagger spec in [doc/swagger_v1.yaml](doc/swagger_v1.yaml) describes the complete contract.

Main capabilities:

- Authenticate users and issue bearer tokens.
- Manage users, networks, gateways, and sensors.
- Store measurements and expose statistics such as mean, variance, and outliers.
- Serve API documentation through Swagger UI.
- Run unit, integration, and end-to-end tests with Jest.

## Tech Stack

- Node.js
- Express
- TypeScript
- TypeORM
- SQLite by default for local development
- MySQL when running through Docker Compose
- Jest and Supertest for testing

## Project Structure

- [src/](src/) contains the application code.
- [src/controllers/](src/controllers/) handles request flow.
- [src/services/](src/services/) contains business logic.
- [src/repositories/](src/repositories/) handles data access.
- [src/routes/](src/routes/) defines the API endpoints.
- [src/middlewares/](src/middlewares/) contains auth and error handling.
- [src/models/](src/models/) contains DAO, DTO, and error classes.
- [doc/](doc/) contains the OpenAPI spec and supporting documentation.
- [test/](test/) contains unit, integration, and e2e tests.
- [docker/](docker/) contains the Docker Compose setup and database init scripts.

## Run Locally

### Prerequisites

- Node.js LTS
- npm

### Install Dependencies

```sh
npm install
```

### Start the API

```sh
npm start
```

By default the server listens on `http://localhost:3000`. You can change the port by setting `PORT` before starting the app.

### Development Mode

```sh
npm run dev
```

This starts the server with hot reloading.

### Debug Mode

Windows:

```sh
npm run debug-win
```

Unix/Linux:

```sh
npm run debug-unix
```

### Create the Default Admin User

```sh
npm run create-root
```

This prepares the database and creates the default root user if it is missing.

### Build and Test

```sh
npm run build
npm test
```

`npm test` runs Jest with coverage.

## API Usage

The API is versioned under `/api/v1`.

Common route groups include:

- `/api/v1/auth`
- `/api/v1/users`
- `/api/v1/networks`
- `/api/v1/networks/:networkCode/gateways`
- `/api/v1/networks/:networkCode/gateways/:gatewayMac/sensors`
- measurement endpoints under networks and sensors

Authentication uses a bearer token. First call the login endpoint, then send the token in the `Authorization` header for protected routes.

Roles supported by the API:

- Admin: full access
- Operator: manages topology and measurements
- Viewer: read-only access

Swagger UI is available after startup at:

```text
http://localhost:3000/api/v1/doc
```

## Configuration

The app reads its runtime settings from environment variables.

Important ones:

- `PORT` sets the HTTP port.
- `DB_TYPE` selects the database type. The default is `sqlite`.
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, and `DB_NAME` are used for MySQL.
- `LOG_LEVEL` and `LOG_PATH` control application logging.

With the default local setup, the database is stored in `data/database.sqlite`.

## Docker

The [docker/](docker/) folder contains a Docker Compose setup for the backend, frontend, and MySQL database.

Run it from the `docker` folder:

```bash
docker compose up --build
```

Useful commands:

```bash
docker compose up
docker compose down
docker compose down -v
```

The compose file mounts [docker/db/init.sql](docker/db/init.sql) to initialize the database and uses [docker/frontend/env-vars.json](docker/frontend/env-vars.json) for frontend configuration.

## Testing

The test suite is organized into:

- unit tests
- integration tests
- end-to-end tests

For manual API testing, import [test/postman_collection/GeoControl API Full Test Suite.postman_collection.json](test/postman_collection/GeoControl%20API%20Full%20Test%20Suite.postman_collection.json) into Postman.

## Notes

- TypeScript path aliases are defined in `tsconfig.json` to keep imports readable.
- The Swagger spec is the best reference for request and response shapes.
- If you change the API contract, update the OpenAPI file and regenerate DTOs with `npm run generate-dto`.
