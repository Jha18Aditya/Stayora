# New Learning Notes

These notes cover features added while building the Airbnb-style application.
They complement [learning.md](./learning.md), which contains the broader
backend concepts.

## Contents

1. [Rating stars](#rating-stars)
2. [Image uploads](#image-uploads)
3. [Environment variables](#environment-variables)
4. [Geocoding](#geocoding)
5. [Mapbox in this project](#mapbox-in-this-project)

---

## Rating stars

The rating input and display use CSS so each review can show a five-star
rating. The rating value is saved with the review and rendered by the review
partial.

Keep the stored rating numeric and validate its range on the server. Client
side controls improve the user experience, but they do not replace server-side
validation.

## Image uploads

An image upload has three parts:

1. The browser sends the file in a multipart form.
2. Multer parses the multipart request.
3. Cloudinary stores the image and returns a URL that is saved in MongoDB.

Add `enctype="multipart/form-data"` to the form:

```html
<form method="POST" enctype="multipart/form-data">
  <input type="file" name="listing[image]">
</form>
```

`express.urlencoded({ extended: true })` parses normal form fields, but it
does not parse uploaded files. Multer handles the multipart request and makes
the file available to the route or storage engine.

Install the packages used by this project:

```bash
npm install cloudinary multer multer-storage-cloudinary
```

The image itself is stored by Cloudinary. MongoDB stores the returned image
URL and any metadata needed to display it.

## Environment variables

Use `dotenv` to load local configuration from a `.env` file:

```js
require("dotenv").config();
```

Read a value from the environment with:

```js
const accessToken = process.env.MAPBOX_ACCESS_TOKEN;
```

Keep API keys and secrets in `.env`, never commit them to source control, and
provide a `.env.example` file when documenting required variable names.

## Geocoding

Geocoding converts a human-readable address into geographic coordinates:

```text
address -> latitude and longitude
```

Reverse geocoding performs the opposite conversion:

```text
latitude and longitude -> address
```

Coordinates can be used to place a marker on a map. Mapbox provides the
geocoding API used by this project.

## Mapbox in this project

The listing form sends a human-readable `location` and `country`. The
server-side listing controller uses Mapbox's geocoding SDK to convert them to
a GeoJSON point before saving the listing:

```js
const geocodingClient = mbxGeocoding({
  accessToken: process.env.MAPBOX_ACCESS_TOKEN,
});

const response = await geocodingClient.forwardGeocode({
  query: `${location}, ${country}`,
  limit: 1,
  autocomplete: false,
}).send();

const geometry = response.body.features[0].geometry;
```

GeoJSON coordinates always use `[longitude, latitude]`, not
`[latitude, longitude]`. The listing schema stores the result as:

```js
geometry: {
  type: {
    type: String,
    enum: ["Point"],
    required: true,
  },
  coordinates: {
    type: [Number],
    required: true,
  },
}
```

The detail page passes the stored coordinates to `public/js/map.js`. That
shared browser script centers the Mapbox map, adds a marker, and attaches a
popup containing the listing location. The map script is loaded by the main
layout, so the detail EJS file only needs the map container and its data.

To add coordinates to listings created before the `geometry` field was added,
run the one-time migration from the project root:

```bash
npm run geocode:listings
```

The migration finds listings without geometry, geocodes their saved
`location` and `country`, and stores the returned GeoJSON point. It does not
overwrite listings that already have coordinates. If a location cannot be
found, that listing is reported as failed and the remaining listings continue
to be processed.


mongoseesios strore instead of express session
npm i connect-mongo