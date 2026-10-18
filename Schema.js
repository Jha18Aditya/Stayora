const Joi = require("joi");

const categoryOptions = [
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

module.exports.listingSchema = Joi.object({
  listing: Joi.object({
    title: Joi.string().trim().min(3).max(100).required(),
    description: Joi.string().trim().max(1000).required(),
    image: Joi.object({
      url: Joi.string()
        .trim()
        .uri({ scheme: ["http", "https"] })
    }).optional(),
    images: Joi.array()
      .items(
        Joi.object({
          filename: Joi.string().optional(),
          url: Joi.string().trim().uri({ scheme: ["http", "https"] }).required(),
        }),
      )
      .max(5)
      .optional(),
    category: Joi.string()
      .valid(...categoryOptions)
      .required(),
    price: Joi.number().min(1).max(10000000).required(),
    location: Joi.string().trim().min(2).max(100).required(),
    country: Joi.string().trim().min(3).max(100).required(),
  }).required(),
});

module.exports.reviewsSchema =Joi.object({
  data:Joi.object({
    rating:Joi.number().min(1).max(5).required(),
    comments:Joi.string().min(3).required(),
  }).required(),
})
