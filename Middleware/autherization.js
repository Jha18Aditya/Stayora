const Listing=require("../models/Listing.js");
const Reviews=require("../models/reviews.js");

module.exports.isOwner= async(req,res,next)=>{
  let { id } = req.params;
  let listing= await Listing.findById(id);
  if(!listing || !listing.owner || !req.user || !listing.owner.equals(req.user._id)){
    req.flash("error","You are not the owner of this listing");
    return res.redirect(`/listing/${id}`);
  }
  next();
};

module.exports.isReviewAuthor= async(req,res,next)=>{
  const { id, reviewId } = req.params;
  const [listing, review] = await Promise.all([
    Listing.findById(id).select("reviews"),
    Reviews.findById(reviewId),
  ]);
  const belongsToListing = listing?.reviews.some((listingReviewId) =>
    listingReviewId.equals(reviewId),
  );
  if(!listing || !review || !belongsToListing || !review.author || !req.user || !review.author.equals(req.user._id)){
    req.flash("error","You are not the Author of this review");
    return res.redirect(`/listing/${id}`);
  }
  next();
};