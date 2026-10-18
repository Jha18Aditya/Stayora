const isProduction = process.env.NODE_ENV === "production";

if (!isProduction) {
  require("dotenv").config();
}
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const listingController = require("./controller/listings.js");
const ExpressError = require("./utils/ExpressError.js");

const crypt = require("crypto");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const cokkieParser = require("cookie-parser");
const flash = require("connect-flash");

const passport = require("passport");
const LocalPassport = require("passport-local");
const User = require("./models/User.js");

const ListingRoute = require("./routes/listing.js");
const ReviewsRoute = require("./routes/reviews.js");
const UserRoute = require("./routes/user.js");

app.set("view engine", "ejs");
app.engine("ejs", ejsMate);
app.set("views", path.join(__dirname, "/views"));
app.use(express.static(path.join(__dirname, "/public")));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

const dbURL = process.env.ATLASDB_URL;
const sessionSecret =
  process.env.SESSION_SECRET ||
  (isProduction ? undefined : "stayora-local-development-secret");
const port = Number(process.env.PORT) || 8080;

if (!dbURL) {
  throw new Error("ATLASDB_URL is required.");
}

if (!sessionSecret) {
  throw new Error("SESSION_SECRET is required in production.");
}

const sessionOptions = {
  secret: sessionSecret,
  resave: false,
  saveUninitialized: true,
  proxy: isProduction,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    maxAge: 14 * 24 * 60 * 60 * 1000,
  },
  store: MongoStore.create({
    mongoUrl: dbURL,
    collectionName: "sessions",
    ttl: 14 * 24 * 60 * 60,
  }),
};

if (isProduction) {
  app.set("trust proxy", 1);
}

app.use(session(sessionOptions));
app.use(cokkieParser(crypt.randomUUID()));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalPassport(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.errorMsg = req.flash("error");
  res.locals.successMsg = req.flash("success");
  res.locals.isUser = Boolean(req.user);
  res.locals.currentUser = req.user;
  next();
});

//root page
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/", listingController.index);

app.use("/listing", ListingRoute);
app.use("/listing/:id/reviews", ReviewsRoute);
app.use("/", UserRoute);

app.all("/{*splat}", (req, res, next) => {
  return next(new ExpressError(404, "Page Not Found"));
});

app.use((err, req, res, next) => {
  console.error(err);
  const statusCode = err.statusCode || 500;
  const message =
    statusCode === 500 && isProduction
      ? "Something went wrong. Please try again."
      : err.message || "Something went wrong.";
  res.status(statusCode).render("err", { statusCode, message });
});

async function startServer() {
  await mongoose.connect(dbURL);
  console.log("connection established");
  app.listen(port, () => {
    console.log(`server is started on ${port}`);
  });
}

startServer().catch((err) => {
  console.error("Unable to start server:", err);
  process.exitCode = 1;
});
