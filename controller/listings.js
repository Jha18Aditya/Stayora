const Listing = require("../models/Listing.js");
const CATEGORY_OPTIONS = Listing.CATEGORY_OPTIONS;
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");

const geocodingClient = mbxGeocoding({
  accessToken: process.env.MAPBOX_ACCESS_TOKEN,
});

const geocodeListing = async (location, country) => {
  const response = await geocodingClient
    .forwardGeocode({
      query: `${location}, ${country}`,
      limit: 1,
      autocomplete: false,
    })
    .send();

  const feature = response.body.features[0];
  if (!feature) {
    throw new Error(`Could not find coordinates for "${location}, ${country}".`);
  }

  return feature.geometry;
};

module.exports.index = async (req, res) => {
  const selectedCategory = CATEGORY_OPTIONS.includes(req.query.category)
    ? req.query.category
    : "All";
  const query = {};
  if (selectedCategory !== "All") {
    query.$or = [
      { category: selectedCategory },
      ...(selectedCategory === "Trending" ? [{ category: { $exists: false } }] : []),
    ];
  }
  const searchQuery = String(req.query.q || "").trim();
  if (searchQuery) {
    query.$and = [
      ...(query.$or ? [{ $or: query.$or }] : []),
      {
        $or: [
          { title: { $regex: searchQuery, $options: "i" } },
          { location: { $regex: searchQuery, $options: "i" } },
          { country: { $regex: searchQuery, $options: "i" } },
          { description: { $regex: searchQuery, $options: "i" } },
        ],
      },
    ];
    delete query.$or;
  }
  const List = await Listing.find(query).populate("reviews");
  List.forEach((listing) => {
    const ratings = listing.reviews.map((review) => review.rating).filter(Boolean);
    listing.averageRating = ratings.length
      ? (ratings.reduce((total, rating) => total + rating, 0) / ratings.length).toFixed(2)
      : null;
    listing.reviewCount = ratings.length;
  });
  res.render("listings", {
    List,
    categories: CATEGORY_OPTIONS,
    selectedCategory,
    searchQuery,
    savedListingIds: new Set((req.user?.savedListings || []).map(String)),
  });
};

module.exports.newForm = (req, res) => {
  res.render("new", { categories: CATEGORY_OPTIONS });
};

module.exports.detailPage = async (req, res) => {
  let { id } = req.params;
  let item = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");
  if (!item) {
    req.flash("error", "Listing not found");
    return res.redirect("/listing");
  }
  res.render("detail", {
    item,
    mapboxAccessToken: process.env.MAPBOX_ACCESS_TOKEN,
  });
};

module.exports.addNewListing = async (req, res) => {
  if (!req.files?.length) {
    req.flash("error", "Please upload at least one image.");
    return res.redirect("/listing/new");
  }

  try {
    const { location, country } = req.body.listing;
    const geometry = await geocodeListing(location, country);
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.images = req.files.map((file) => ({
      filename: file.filename,
      url: file.path,
    }));
    newListing.image = newListing.images[0];
    newListing.geometry = geometry;
    await newListing.save();
  } catch (err) {
    req.flash("error", err.message);
    return res.redirect("/listing/new");
  }
  req.flash("success", "Your listing was added successfully.");
  res.redirect("/listing");
};

module.exports.editForm = async (req, res) => {
  let { id } = req.params;
  let item = await Listing.findById(id);
  if (!item) {
    req.flash("error", "This listing does not exist.");
    return res.redirect("/listing");
  }
  res.render("edit", { item, categories: CATEGORY_OPTIONS });
};

module.exports.editDb = async (req, res) => {
  let { id } = req.params;
  const update = { ...req.body.listing };

  try {
    update.geometry = await geocodeListing(update.location, update.country);

    if (req.files?.length) {
      update.images = req.files.map((file) => ({
        filename: file.filename,
        url: file.path,
      }));
      update.image = update.images[0];
    }

    await Listing.findByIdAndUpdate(id, update, {
      runValidators: true,
    });
  } catch (err) {
    req.flash("error", err.message);
    return res.redirect(`/listing/${id}/edit`);
  }
  req.flash("success", "Your listing was updated successfully.");
  res.redirect(`/listing/${id}`);
};

module.exports.delete = async (req, res) => {
  let { id } = req.params;
  await Listing.findByIdAndDelete(id);
  req.flash("success", "Your listing was deleted successfully.");
  res.redirect("/listing");
};

module.exports.reservationUnavailable = (req, res) => {
  const { checkIn, checkOut, guests } = req.body?.reservation || {};
  let reservation;

  if (checkIn && checkOut && guests) {
    const start = new Date(`${checkIn}T00:00:00`);
    const end = new Date(`${checkOut}T00:00:00`);
    const nights = Math.round((end - start) / (1000 * 60 * 60 * 24));
    const guestCount = Number(guests);

    if (
      !Number.isNaN(start.getTime()) &&
      !Number.isNaN(end.getTime()) &&
      nights > 0 &&
      Number.isInteger(guestCount) &&
      guestCount >= 1 &&
      guestCount <= 16
    ) {
      reservation = {
        checkIn,
        checkOut,
        guests: guestCount,
        nights,
      };
    }
  }

  res.render("unavailable", { listingId: req.params.id, reservation });
};

module.exports.saveListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).select("_id");
    if (!listing) return res.status(404).json({ error: "Listing not found." });

    const User = require("../models/User.js");
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { savedListings: listing._id } },
      { new: true, runValidators: true },
    ).select("savedListings");

    res.json({ saved: true, count: user.savedListings.length });
  } catch (err) {
    console.error("Saving listing failed:", err);
    res.status(500).json({ error: "Unable to save this listing." });
  }
};

module.exports.unsaveListing = async (req, res) => {
  try {
    const User = require("../models/User.js");
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { savedListings: req.params.id } },
      { new: true },
    ).select("savedListings");

    res.json({ saved: false, count: user?.savedListings.length || 0 });
  } catch (err) {
    console.error("Removing saved listing failed:", err);
    res.status(500).json({ error: "Unable to remove this saved listing." });
  }
};
