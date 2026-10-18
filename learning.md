# Backend Learning Notes

These notes explain the main backend ideas used in this Airbnb project. The
examples use Node.js, Express, MongoDB, Mongoose, EJS, Passport, and Joi.

## Contents

1. [MongoDB and Mongoose queries](#mongodb-and-mongoose-queries)
2. [Mongoose update methods](#mongoose-update-methods)
3. [Mongoose schema validation](#mongoose-schema-validation)
4. [Express middleware and errors](#express-middleware-and-errors)
5. [TanStack Query and RTK Query](#tanstack-query-and-rtk-query)
6. [EJS Mate](#ejs-mate)
7. [Client-side validation](#client-side-validation)
8. [Server-side validation with Joi](#server-side-validation-with-joi)
9. [Mongoose middleware and related deletion](#mongoose-middleware-and-related-deletion)
10. [Cookies](#cookies)
11. [Sessions](#sessions)
12. [Flash messages](#flash-messages)
13. [Authentication and authorization](#authentication-and-authorization)
14. [Passport authentication](#passport-authentication)
15. [MVC and Express routing](#mvc-and-express-routing)

---

## MongoDB and Mongoose queries

MongoDB stores data as documents. A collection is similar to a table, and a
document is similar to a row, but MongoDB documents use JSON-like objects.

Mongoose is an ODM (Object Data Modeling) library. It gives MongoDB schemas,
models, validation, and convenient query methods.

### Common query operators

- `$in`: the field matches one of the values in a list.
- `$nin`: the field matches none of the values in a list.
- `$or`: at least one condition is true.
- `$and`: every condition is true. Multiple fields in one object are already
  treated as an AND in MongoDB.
- `$nor`: none of the supplied conditions is true.
- `$not`: reverses a condition for one field.

```js
const listings = await Listing.find({
  $or: [
    { country: { $in: ["India", "Nepal"] } },
    { price: { $lt: 1000 } },
  ],
});
```

This finds listings in India or Nepal, or listings whose price is less than
1000.

### Query, promise, and cursor

The returned value depends on the library and method:

| Operation | Returned value | What to do |
| --- | --- | --- |
| MongoDB driver's `find()` | Cursor | Call `.toArray()` |
| MongoDB driver's `insertOne()` or `updateOne()` | Promise | Use `await` |
| Mongoose `find()` or `updateOne()` | Query | Use `await` to execute it |
| Mongoose `create()`, `save()`, or `insertMany()` | Promise | Use `await` |

Mongoose queries can be built first and executed later:

```js
const query = Listing.find({ country: "India" })
  .sort({ price: 1 })
  .skip(10)
  .limit(5);

const listings = await query;
```

- `.sort({ price: 1 })` sorts from low to high.
- `.sort({ price: -1 })` sorts from high to low.
- `.skip(10)` skips the first 10 documents.
- `.limit(5)` returns at most 5 documents.

With the native MongoDB driver, finish the cursor with `.toArray()`:

```js
const listings = await db.collection("listings")
  .find({ country: "India" })
  .sort({ price: 1 })
  .skip(10)
  .limit(5)
  .toArray();
```

---

## Mongoose update methods

### Main update methods

- `updateOne()`: updates the first matching document.
- `updateMany()`: updates every matching document.
- `replaceOne()`: replaces the complete document.
- `findByIdAndUpdate()`: finds a document by `_id` and updates it.

For normal changes, use update operators:

| Operator | Purpose |
| --- | --- |
| `$set` | Set or replace a field |
| `$unset` | Remove a field |
| `$inc` | Increase or decrease a number |
| `$mul` | Multiply a number |
| `$rename` | Rename a field |
| `$min` / `$max` | Update only if the new value is smaller or larger |
| `$push` | Add an item to an array |
| `$pull` | Remove matching items from an array |
| `$addToSet` | Add an item only if it is not already in the array |
| `$pop` | Remove the first or last array item |

```js
await Listing.updateOne(
  { _id: listingId },
  { $set: { price: 2500 }, $inc: { views: 1 } },
);
```

### Useful update options

`upsert: true` creates a document if no document matches the filter:

```js
await User.updateOne(
  { email: "user@example.com" },
  { $set: { name: "Asha" } },
  { upsert: true },
);
```

Update methods do not run Mongoose validators by default. Use
`runValidators: true` when the update must follow the schema:

```js
const listing = await Listing.findByIdAndUpdate(
  listingId,
  { $set: req.body.listing },
  { runValidators: true, new: true },
);
```

`new: true` returns the updated document. Without it, methods such as
`findByIdAndUpdate()` normally return the old document.

---

## Mongoose schema validation

Schema validation protects the database from invalid data. Common validators
include:

- `required`
- `min` and `max` for numbers
- `minlength` and `maxlength` for strings
- `enum` for allowed values
- `match` for a regular expression
- `validate` for custom rules

```js
const userSchema = new mongoose.Schema({
  age: {
    type: Number,
    min: 18,
    validate: {
      validator: (value) => Number.isInteger(value),
      message: "Age must be a whole number",
    },
  },
});
```

Validation runs automatically with `create()` and `save()`. It does not run
automatically for most update methods, so use `{ runValidators: true }`.

If several fields are invalid, Mongoose puts their details in `err.errors`.
The error name is usually `ValidationError`.

---

## Express middleware and errors

Middleware is a function with this shape:

```js
(req, res, next) => {
  // do something
  next();
}
```

Middleware can:

- run code,
- change `req` or `res`,
- end the response, or
- call `next()` to continue.

Middleware runs from top to bottom, so order matters. If it neither sends a
response nor calls `next()`, the request stays pending.

### Error middleware

Calling `next(error)` skips normal middleware and goes to error middleware.
Error middleware has exactly four parameters:

```js
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).send(err.message || "Something went wrong");
});
```

This project's `ExpressError` constructor expects the status code first:

```js
throw new ExpressError(404, "Page not found");
```

Do not reverse the arguments:

```js
// Wrong for this project's ExpressError class
new ExpressError("Page not found", 404);
```

### Async route errors

In Express 5, a rejected promise from an async route is forwarded to the error
middleware:

```js
app.get("/listing/:id", async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  res.json(listing);
});
```

Errors inside separate callbacks, such as `setTimeout`, still need their own
error handling. Express 4 requires a `try/catch` or an async wrapper for async
route handlers.

Common Mongoose errors:

- `ValidationError`: schema validation failed.
- `CastError`: a value could not be converted to the expected type, often an
  invalid MongoDB ID.

---

## TanStack Query and RTK Query

Both libraries help a frontend fetch and cache server data. They manage loading
states, errors, caching, and refetching. They do not replace the backend API.

### TanStack Query

```js
const { data, isPending, isError, error } = useQuery({
  queryKey: ["listings", filters],
  queryFn: () =>
    fetch("/api/listings").then((response) => {
      if (!response.ok) throw new Error("Failed to fetch listings");
      return response.json();
    }),
});
```

`queryKey` identifies the cached result. Include every value that changes the
result, such as filters or an ID. Use `useMutation()` for create, update, and
delete operations, then invalidate related queries after success.

### RTK Query

RTK Query is part of the Redux Toolkit ecosystem. It defines an API service and
generates React hooks:

```js
const listingsApi = createApi({
  reducerPath: "listingsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  endpoints: (builder) => ({
    getListings: builder.query({
      query: (filters) => ({ url: "listings", params: filters }),
    }),
  }),
});

export const { useGetListingsQuery } = listingsApi;
```

Use TanStack Query when you want standalone server-state management. Use RTK
Query when your application already uses Redux. Avoid using both for the same
resource without a clear reason because they create separate caches.

---

## EJS Mate

EJS Mate adds layouts and reusable partials to EJS. This prevents repeating the
same HTML in every page.

### Escaped and unescaped output

Use `<%= ... %>` for normal values. It escapes HTML and is safer for
user-provided text:

```ejs
<p><%= userComment %></p>
```

Use `<%- ... %>` for trusted HTML or an include:

```ejs
<%- include("../includes/navbar.ejs") %>
```

Do not render untrusted user input with `<%- ... %>`, because it can create an
XSS vulnerability.

### Layouts

```ejs
<% layout("layouts/boilerplate.ejs") %>
```

The layout contains common HTML such as the `<head>`, navbar, flash messages,
and footer. The current view supplies the page body.

---

## Client-side validation

Client-side validation gives fast feedback in the browser. It improves the
user experience, but it is not security. A user can disable it or send a
request manually, so validate again on the server.

### Basic steps

1. Add `class="needs-validation"` and `novalidate` to the form.
2. Add HTML rules such as `required`, `minlength`, `min`, `max`, and
   `type="email"`.
3. Add an `.invalid-feedback` element near each input.
4. On submit, call `form.checkValidity()`.
5. Stop submission and show errors when the form is invalid.

```ejs
<form class="needs-validation" novalidate>
  <label for="title">Title</label>
  <input id="title" name="listing[title]" minlength="3" required>
  <div class="invalid-feedback">
    Enter a title with at least 3 characters.
  </div>
</form>
```

The browser's `required` rule checks that a value exists. `minlength` checks
the length, `type="email"` checks the general email format, and `type="url"`
checks the general URL format.

---

## Server-side validation with Joi

Joi validates request data on the server. It is required even when the form
has client-side validation.

### Define a schema

This project sends listing fields inside `req.body.listing`, so the Joi schema
must have the same shape:

```js
const Joi = require("joi");

const listingSchema = Joi.object({
  listing: Joi.object({
    title: Joi.string().trim().min(3).max(100).required(),
    description: Joi.string().trim().max(1000).required(),
    price: Joi.number().min(1).max(10000000).required(),
    location: Joi.string().trim().min(2).max(100).required(),
    country: Joi.string().trim().min(2).max(100).required(),
  }).required(),
}).required();
```

### Create validation middleware

```js
const validateListing = (req, res, next) => {
  const { error, value } = listingSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    const message = error.details
      .map((detail) => detail.message)
      .join(", ");
    throw new ExpressError(400, message);
  }

  req.body = value;
  next();
};
```

`abortEarly: false` collects all errors instead of stopping at the first one.
The `value` returned by Joi contains the validated and cleaned data.

### Use the middleware before the route

```js
app.post("/listing", validateListing, async (req, res) => {
  await Listing.create(req.body.listing);
  res.redirect("/listing");
});

app.put("/listing/:id", validateListing, async (req, res) => {
  await Listing.findByIdAndUpdate(
    req.params.id,
    req.body.listing,
    { runValidators: true },
  );
  res.redirect(`/listing/${req.params.id}`);
});
```

Reviews need a separate schema because their fields are inside
`req.body.data`, for example `data[rating]` and `data[comments]`.

---

## Mongoose middleware and related deletion

Related deletion means deleting dependent documents when their parent is
deleted. For example, deleting a listing may also require deleting its
reviews. Otherwise, orphaned reviews remain in the database.

### References

A child document can store the parent's ID:

```js
const reviewSchema = new mongoose.Schema({
  comment: String,
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Listing",
  },
});
```

MongoDB does not automatically delete referenced documents. The application
must perform that cleanup.

### Middleware types

- `pre` middleware runs before an operation.
- `post` middleware runs after an operation.
- Document middleware runs on a document, such as `document.deleteOne()`.
- Query middleware runs on a query, such as `findOneAndDelete()`.

The hook must match the operation used by the route. A
`pre("remove")` hook does not automatically run for `findByIdAndDelete()`.

### Example cleanup hook

`findByIdAndDelete()` uses a `findOneAndDelete` query, so this query hook can
remove related reviews:

```js
listingSchema.pre("findOneAndDelete", async function () {
  const listing = await this.model.findOne(this.getFilter());

  if (listing) {
    await Review.deleteMany({ listing: listing._id });
  }
});
```

The route can then delete the listing:

```js
app.delete("/listing/:id", async (req, res) => {
  await Listing.findByIdAndDelete(req.params.id);
  res.redirect("/listing");
});
```

For important multi-document operations, consider a MongoDB transaction so
parent and child deletion succeed or fail together.

---

## Cookies

Cookies are small name-value pairs stored by the browser and sent with later
requests. They can store preferences or identifiers. A cookie should not hold
large data or a password. Browsers usually limit an individual cookie to about
4 KB.

### Configure cookie-parser

```js
const cookieParser = require("cookie-parser");

app.use(cookieParser(process.env.COOKIE_SECRET));
```

The secret should come from an environment variable in a real application.

### Read cookies

```js
app.get("/", (req, res) => {
  console.log(req.cookies);
  console.log(req.signedCookies);
  res.send("Cookies read");
});
```

Normal cookies are in `req.cookies`. Signed cookies are in
`req.signedCookies`.

Signing detects changes; it does not encrypt or hide the value.

### Set cookies

```js
app.get("/set-cookies", (req, res) => {
  res.cookie("location", "india");
  res.cookie("sessionId", "example-id", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 1000,
    signed: true,
  });
  res.send("Cookies set");
});
```

`httpOnly` prevents browser JavaScript from reading the cookie. `secure` sends
it only over HTTPS. `sameSite` helps reduce cross-site request attacks.

---

## Sessions

HTTP is stateless: each request is independent. A session lets the server
recognize the same browser across several requests. The browser stores a
session ID, while the session data is stored on the server or in a session
store.

### Configure express-session

```js
const session = require("express-session");

const sessionOptions = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
};

app.use(session(sessionOptions));
```

- `secret` signs the session ID cookie.
- `resave: false` avoids saving an unchanged session.
- `saveUninitialized: false` avoids creating empty sessions.

Register the session middleware before routes that use `req.session`.

The default in-memory store is for development only. Use a persistent store in
production.

### Store and read session data

```js
req.session.username = "Asha";
```

```js
app.get("/profile", (req, res) => {
  res.send(`Welcome, ${req.session.username}`);
});
```

Passport uses a session to remember that a user has logged in.

---

## Flash messages

Flash messages are short-lived messages stored in the session. They are useful
after a redirect:

```js
req.flash("success", "Your listing was added successfully.");
res.redirect("/listing");
```

The message is normally read once on the next request.

### Configure connect-flash

`connect-flash` needs a session, so it must be registered after
`express-session`:

```js
const flash = require("connect-flash");

app.use(session(sessionOptions));
app.use(flash());
```

`cookie-parser` is separate. It reads cookies but does not store flash
messages.

### Make messages available to EJS

```js
app.use((req, res, next) => {
  res.locals.errorMsg = req.flash("error");
  res.locals.successMsg = req.flash("success");
  next();
});
```

Then a view can display them:

```ejs
<% if (successMsg && successMsg.length) { %>
  <div class="alert alert-success">
    <%= successMsg %>
  </div>
<% } %>
```

Use different keys, such as `success` and `error`, so the view can use the
correct style.

---

## Authentication and authorization

### Authentication vs authorization

- **Authentication** asks: "Who are you?"
- **Authorization** asks: "What are you allowed to do?"

For example, logging in is authentication. Checking whether the logged-in user
owns a listing is authorization.

### Never store plain-text passwords

Never save a user's actual password in MongoDB. If the database is leaked,
plain-text passwords immediately expose user accounts.

Instead, a password is processed by a password-hashing algorithm:

```text
password + salt -> password hash
```

During login, the password is checked against the saved hash. The original
password is not recovered from the hash.

### Important properties of password hashing

1. The same input and same salt produce the same result.
2. A secure password hash is designed to be one-way.
3. A small input change creates a very different hash.
4. Password hashes are not encryption. Encryption is designed to be reversed
   with a key.
5. A slow, password-specific algorithm is better than a fast general-purpose
   hash.

Do not use MD4, CRC, or plain SHA-256 to store passwords. They are too fast for
password storage and make guessing attacks easier. Use a password-specific
algorithm such as Argon2, scrypt, or PBKDF2. Libraries such as
`passport-local-mongoose` handle password hashing and salting for this project.

### What is a salt?

A salt is a random value stored with the password hash. It makes the same
password produce different stored results for different users and makes
precomputed lookup tables less useful.

The salt does not need to be kept secret. The password hash and salt can be
stored in the database; the plain password must not be stored.

---

## Passport authentication

Passport is middleware that handles authentication strategies. It supports
local username/password authentication and many external strategies.

Install the packages used in this project:

```bash
npm install passport passport-local passport-local-mongoose
```

- `passport`: the main authentication middleware.
- `passport-local`: the username/password strategy.
- `passport-local-mongoose`: adds authentication methods to a Mongoose schema.

### Add Passport to the User model

```js
const mongoose = require("mongoose");
const passportLocalMongoose =
  require("passport-local-mongoose").default;

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
```

`passport-local-mongoose` adds fields and methods such as `username`,
`hash`, `salt`, `register()`, `authenticate()`, `serializeUser()`, and
`deserializeUser()`.

In this project, `require("passport-local-mongoose")` returns a module object
whose plugin function is inside the `default` property:

```js
{
  default: pluginFunction,
  errors: { ... },
}
```

Mongoose needs the function, not the wrapper object. Therefore this project
uses `.default`:

```js
const passportLocalMongoose =
  require("passport-local-mongoose").default;
```

Without `.default`, Mongoose receives an object and reports:

```text
First param to schema.plugin() must be a function, got "object"
```

### Configure Passport in app.js

Require the packages:

```js
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/User.js");
```

Session middleware must be registered before Passport's session middleware:

```js
app.use(session(sessionOptions));
app.use(passport.initialize());
app.use(passport.session());
```

`passport.initialize()` starts Passport for the request. `passport.session()`
restores a previously logged-in user from the session.

Register the local strategy:

```js
passport.use(new LocalStrategy(User.authenticate()));
```

`User.authenticate()` supplies the function that checks the submitted
username and password.

### Serialization and deserialization

```js
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
```

Serialization decides what small piece of user data is stored in the session,
usually the user's ID or username. Deserialization uses that stored value to
load the full user from MongoDB on a later request.

This avoids storing the complete user document in the session.

### Sign up

```js
router.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const user = new User({ username, email });

    await User.register(user, password);
    req.flash("success", "Welcome!");
    res.redirect("/");
  } catch (error) {
    req.flash("error", error.message);
    res.redirect("/signup");
  }
});
```

`User.register(user, password)` hashes the password, creates the salt, and
saves the user. It does not save the plain password.

### Log in

```js
router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (req, res) => {
    req.flash("success", "Welcome back!");
    res.redirect("/");
  },
);
```

The login form must submit to `/login`:

```ejs
<form method="POST" action="/login">
  <input name="username" autocomplete="username" required>
  <input name="password" type="password" autocomplete="current-password" required>
  <button type="submit">Login</button>
</form>
```

If the credentials are wrong, Passport redirects to `/login` and
`failureFlash: true` stores the error message. If they are correct, Passport
creates the login session and the next handler runs.

### `req.login()`: manually log in a user

`req.login()` is added to the request by Passport. It logs in a user and
creates the login session. After it succeeds, Passport serializes the user and
saves the serialized value in the session.

`passport.authenticate("local")` calls `req.login()` automatically after the
username and password are verified. Therefore, the normal login route does not
need to call it again.

You can call it yourself when a user is registered and should be logged in
immediately:

```js
router.post("/signup", async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const user = await User.register(new User({ username, email }), password);

    req.login(user, (error) => {
      if (error) return next(error);

      req.flash("success", "Welcome!");
      res.redirect("/");
    });
  } catch (error) {
    req.flash("error", error.message);
    res.redirect("/signup");
  }
});
```

The important points are:

1. `User.register()` creates the user and securely stores the password hash.
2. `req.login(user, callback)` starts the authenticated session.
3. Passport calls `serializeUser()` to store a small user identifier.
4. The callback runs after the login attempt finishes.
5. Always handle the callback error before sending a response.

The callback form is used because session saving can be asynchronous.

### `req.logout()`: log out a user

`req.logout()` removes the user from the current login session. It does not
delete the user from MongoDB and it does not change the user's password.

This project's logout route uses the callback form:

```js
router.get("/logout", (req, res, next) => {
  req.logout((error) => {
    if (error) return next(error);

    req.flash("success", "Logged out successfully.");
    res.redirect("/");
  });
});
```

After logout:

- `req.user` is no longer available for the logged-out request.
- `req.isAuthenticated()` returns `false`.
- The session no longer represents a logged-in user.
- Protected routes should redirect the visitor to `/login`.

Passport's method is named `req.logout()`. Some older code uses
`req.logOut()` with a capital `O`; the lowercase spelling is clearer and is
recommended for new code.

### Checking login status

Passport adds helper methods to every request:

```js
if (req.isAuthenticated()) {
  console.log("A user is logged in");
}

console.log(req.user); // the full user loaded by deserializeUser()
```

A reusable middleware can protect a route:

```js
const isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash("error", "Please log in to continue.");
    return res.redirect("/login");
  }

  next();
};
```

Use it before handlers that require a logged-in user:

```js
router.get("/new", isLoggedIn, (req, res) => {
  res.render("new");
});
```

### Create a demo user

```js
app.get("/demouser", async (req, res, next) => {
  try {
    const user = new User({
      email: "demo@example.com",
      username: "demo-user",
    });

    const newUser = await User.register(user, "password");
    res.send(newUser);
  } catch (error) {
    next(error);
  }
});
```

Use a demo route only during development. Remove it or protect it before
deploying, because anyone who can access it could create an account.

### Authorization example

Authentication tells us who `req.user` is. Authorization checks whether that
user may perform an action:

```js
if (!req.user || !listing.owner.equals(req.user._id)) {
  req.flash("error", "You do not have permission to do that.");
  return res.redirect(`/listing/${listing._id}`);
}
```

A real application should also use reusable middleware such as
`isLoggedIn` and `isOwner` to perform these checks consistently.



---

## MVC and Express routing

MVC separates an application into three responsibilities:

- **Model:** Defines data structures and database operations. In this project,
  models are in `models/`.
- **View:** Renders the user interface. In this project, EJS templates are in
  `views/`.
- **Controller:** Contains request-handling logic between the routes, models,
  and views. In this project, controllers are in `controller/`.

### `router.route(path)`

`router.route(path)` groups handlers for the same URL so the supported HTTP
methods are easy to see together:

```js
router
  .route("/:id")
  .get(controller.showListing)
  .put(isLoggedIn, isOwner, controller.updateListing)
  .delete(isLoggedIn, isOwner, controller.deleteListing);
```

This is equivalent to separate `router.get()`, `router.put()`, and
`router.delete()` declarations for the same path.

### File uploads

This project uses `multer` to parse `multipart/form-data` and Cloudinary to
store uploaded images. Install the packages with:

```bash
npm install cloudinary multer-storage-cloudinary
```

The form must use the multipart encoding type:

```html
<form method="POST" enctype="multipart/form-data">
  <input type="file" name="listing[image]">
</form>
```

`express.urlencoded()` parses normal form fields, but it does not parse file
uploads. Multer handles the multipart request, and the application stores the
Cloudinary URL in MongoDB instead of storing the image binary data.
