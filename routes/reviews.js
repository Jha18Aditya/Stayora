const express = require("express");
const router = express.Router({ mergeParams: true });
const { isLogged } = require("../Middleware/authentication.js");
const {validatereviews}=require("../Middleware/validation.js");
const {isReviewAuthor}= require("../Middleware/autherization.js");
const reviewController= require("../controller/reviews.js")


//reviews add
router.post("/", isLogged, validatereviews, reviewController.add);

//reviews delete
router.delete("/:reviewId",isLogged,isReviewAuthor, reviewController.delete);

module.exports = router;
