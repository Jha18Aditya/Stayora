const User = require("../models/User.js");
const Listing = require("../models/Listing.js");

module.exports.signupForm = (req, res) => {
  const authIntent = req.query.intent === "host"
    || String(req.session.redirectUrl || "").includes("intent=host");
  if (authIntent && !req.session.redirectUrl) req.session.redirectUrl = "/listing/new?intent=host";
  res.render("user/signup.ejs", { authIntent: authIntent ? "host" : null });
};

module.exports.signup = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const newUser = new User({ username, email });
    let newU = await User.register(newUser, password);
    req.logIn(newU, (e) => {
      if (e) {
        return next(e);
      }
      req.flash("success", "Welcome!");
      const Url = res.locals.redirectUrl || "/";
      delete req.session.redirectUrl;
      res.redirect(Url);
    });
  } catch (e) {
    console.error("Signup failed:", e);
    req.flash("error", "Unable to create your account. Please try again.");
    res.redirect("/signup");
  }
};

module.exports.loginForm = (req, res) => {
  const authIntent = req.query.intent === "host"
    || String(req.session.redirectUrl || "").includes("intent=host");
  if (authIntent && !req.session.redirectUrl) req.session.redirectUrl = "/listing/new?intent=host";
  const loginMessage = req.query.message === "save"
    ? "Log in or create an account to save this place."
    : authIntent
      ? "Create an account or log in to start hosting your place."
      : null;
  res.render("user/login.ejs", { loginMessage, authIntent: authIntent ? "host" : null });
};

module.exports.dashboard = async (req, res) => {
  const listings = await Listing.find({ owner: req.user._id }).populate("reviews");
  const savedListings = await Listing.find({
    _id: { $in: req.user.savedListings || [] },
  }).populate("reviews");

  const addReviewStats = (listing) => {
    const ratings = listing.reviews.map((review) => review.rating).filter(Boolean);
    listing.averageRating = ratings.length
      ? (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(2)
      : null;
    listing.reviewCount = listing.reviews.length;
  };

  listings.forEach((listing) => {
    addReviewStats(listing);
  });
  savedListings.forEach((listing) => {
    addReviewStats(listing);
  });
  res.render("user/dashboard", { listings, savedListings });
};

module.exports.login = (req, res) => {
  req.flash("success", "Welcome back!");
  const Url = res.locals.redirectUrl || "/";
  delete req.session.redirectUrl;
  res.redirect(Url);
};


module.exports.logOut=(req, res, next) => {
  req.logOut((err) => {
    if (err) {
      return next(err);
    }
    req.flash("success", "Logged out successfully.");
    res.redirect("/");
  });
};
