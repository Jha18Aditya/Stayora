# Stayora

Stayora is an Airbnb-style vacation-rental web application built with
Node.js, Express, MongoDB, and EJS. Users can browse and search listings,
filter listings by category, view listing details, submit reviews, save
listings, and manage listings when they are the owner.

## Features

- Listing browsing, search, and category filtering
- Listing creation, editing, and deletion
- Image uploads through Cloudinary
- Map locations through Mapbox
- User registration and login with Passport
- MongoDB-backed sessions with `connect-mongo`
- Guest reviews with ratings, comments, authors, and dates
- Flash messages and validation feedback
- Responsive EJS views and client-side interactions
- Health-check endpoint for deployment monitoring

## Requirements

- Node.js 18 or newer
- MongoDB Atlas or a local MongoDB server
- Cloudinary account for image uploads
- Mapbox access token for listing maps

## Installation

```bash
npm install
```

Create a `.env` file in the project root. Do not commit this file.

```env
ATLASDB_URL=mongodb+srv://username:password@cluster.mongodb.net/airbnb?retryWrites=true&w=majority
SESSION_SECRET=replace-with-a-long-random-secret
CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
MAPBOX_ACCESS_TOKEN=your-mapbox-access-token
PORT=8080
```

If a MongoDB password contains reserved URL characters, encode it before
placing it in the connection string.

## Running locally

Start the application:

```bash
npm start
```

The application runs on `http://localhost:8080` by default. Set `PORT` to
use another port.

The deployment health endpoint is:

```text
GET /health
```

It returns:

```json
{"status":"ok"}
```

## Database

The application uses the `airbnb` database and stores listings, users,
reviews, and sessions in MongoDB. Ensure the Atlas database user has the
required permissions and that the deployment server's IP address is allowed
in Atlas Network Access.

## Deployment

Configure the environment variables in the hosting provider rather than
committing `.env`. In production, set both `ATLASDB_URL` and
`SESSION_SECRET`; the application refuses to start without them.

Run the production application with:

```bash
npm start
```

Use `/health` as the service health-check path.

## Project structure

```text
controller/   Request handlers
models/       Mongoose models
routes/       Express routes
views/        EJS templates
public/       CSS, JavaScript, and static assets
Middleware/   Authentication, authorization, and validation
utils/        Shared application utilities
```

## Security notes

- Never commit `.env` or production credentials.
- Use a strong, unique `SESSION_SECRET` in production.
- Restrict MongoDB Atlas Network Access to trusted addresses where possible.
- Review dependency audit findings before production release.
