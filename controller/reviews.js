const Listing = require("../models/Listing.js");
const Reviews = require("../models/reviews.js");

module.exports.add= async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listing");
  }
  const newReview = new Reviews(req.body.data);
  newReview.author=req.user._id;
  listing.reviews.push(newReview);
  await newReview.save();
  await listing.save();
  req.flash("success", "Review added successfully.");
  res.redirect(`/listing/${req.params.id}`);
};

module.exports.delete=async (req, res) => {
  const { id, reviewId } = req.params;
  const listing = await Listing.findById(id);
  const review = await Reviews.findById(reviewId);

  if (!listing || !review || !listing.reviews.some((listingReviewId) =>
    listingReviewId.equals(reviewId),
  )) {
    req.flash("error", "Review not found.");
    return res.redirect(`/listing/${id}`);
  }

  await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
  await Reviews.findByIdAndDelete(reviewId);
  req.flash("success", "Review deleted successfully.");
  res.redirect(`/listing/${id}`);
};