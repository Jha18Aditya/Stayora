const { reviewsSchema , listingSchema} = require("../Schema.js");

module.exports.validateListing = (req, res, next) => {
  if (req.files?.length) {
    req.body.listing = req.body.listing || {};
    req.body.listing.images = req.files.map((file) => ({
      filename: file.filename,
      url: file.path,
    }));
  }

  const { error, value } = listingSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    console.error("Listing validation failed:", error.details);
    req.flash("error", "Please check the form and enter valid information.");
    if (req.method === "PUT") {
      return res.redirect(`/listing/${req.params.id}/edit`);
    }
    return res.redirect("/listing/new");
  }
  req.body = value; // pass the sanitized data forward
  next();
};

module.exports.validatereviews = (req, res, next) => {
  const { error, value } = reviewsSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    console.error("Review validation failed:", error.details);
    req.flash("error", "Please check your review and enter valid information.");
    return res.redirect(`/listing/${req.params.id}`);
  }
  req.body = value; // pass the sanitized data forward
  next();
};
