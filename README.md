# Stayora

Stayora is an Airbnb-style vacation-rental web application. It allows users
to discover stays, view detailed property information, save listings, and
share their experiences through reviews and ratings.

## Features

- Browse vacation-rental listings
- Search listings by title, location, country, and description
- Filter listings by category
- View detailed listing pages with image galleries and maps
- Create, edit, and delete listings
- Upload listing images
- Register and log in as a user
- Save and unsave favorite listings
- Submit reviews with ratings and comments
- Display review authors and review dates
- Delete reviews created by the logged-in user
- Show flash messages and validation feedback
- Responsive user interface for desktop and mobile screens
- MongoDB-backed user sessions

## Technologies Used

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- Passport.js
- Passport Local
- Express Session
- Connect Mongo
- Joi

### Frontend

- EJS
- EJS Mate
- HTML
- CSS
- JavaScript
- Bootstrap

### External Services

- MongoDB Atlas for cloud database hosting
- Cloudinary for image storage and delivery
- Mapbox for listing location maps

### Application Structure

- `controller/` - Application request handlers
- `models/` - Mongoose database models
- `routes/` - Express route definitions
- `views/` - EJS page templates
- `public/` - Stylesheets, JavaScript, and static assets
- `Middleware/` - Authentication, authorization, and validation
- `utils/` - Shared application utilities
