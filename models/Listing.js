const mongoose = require("mongoose");
const Reviews=require("./reviews.js")

const CATEGORY_OPTIONS = [
  "Trending",
  "Rooms",
  "Iconic Cities",
  "Mountains",
  "Castles",
  "Amazing Pools",
  "Camping",
  "Farms",
  "Arctic",
];

const listingSchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  image: {
    filename: { type: String, default: "listingimage" },
    url: {
      type: String,
      default:
        "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fGxha2V8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60",
      set: (v) =>
        v === ""
          ? "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fGxha2V8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60"
          : v,
    },
  },
  // Keep the original image field for existing documents. New uploads use images.
  images: {
    type: [
      {
        filename: { type: String, default: "listingimage" },
        url: { type: String, required: true },
      },
    ],
    default: [],
    validate: {
      validator: (images) => images.length <= 5,
      message: "A listing can have at most 5 images.",
    },
  },
  category: {
    type: String,
    enum: CATEGORY_OPTIONS,
    default: "Trending",
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
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
  },
  reviews:[
    {
      type:mongoose.Schema.Types.ObjectId,
      ref:"Reviews",
    },
  ],
  owner:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    required: true,
  }
});

listingSchema.post("findOneAndDelete", async(listing)=>{
  if(listing){
       await Reviews.deleteMany({_id:{$in:listing.reviews}});
  }
});

const Listing = mongoose.model("Listing", listingSchema);
Listing.CATEGORY_OPTIONS = CATEGORY_OPTIONS;
module.exports = Listing;
