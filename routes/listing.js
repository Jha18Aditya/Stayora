const express = require('express');
const multer = require('multer');
const path = require('path');
const {storage}=require("../cloudConfig.js");
const upload = multer({
  storage,
  fileFilter: (req, file, callback) => {
    const extension = path.extname(file.originalname || "").toLowerCase();
    const validMime = ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.mimetype);
    const validExtension = [".jpg", ".jpeg", ".png", ".webp"].includes(extension);
    if (validMime || validExtension) return callback(null, true);
    return callback(new Error("Only JPG, JPEG, PNG, and WebP images are supported."));
  },
});
const router=express.Router({mergeParams:true});
const { isLogged } = require("../Middleware/authentication.js");
const {validateListing}=require("../Middleware/validation.js");
const {isOwner}= require("../Middleware/autherization.js")
const listingController=require("../controller/listings.js")

const uploadListingImages = (req, res, next) => {
  upload.array("listing[images]", 5)(req, res, (err) => {
    if (!err) return next();

    console.error("Listing image upload failed:", err);
    if (err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE") {
      req.flash("error", "Please upload no more than 5 images.");
    } else if (err.code === "LIMIT_FILE_SIZE") {
      req.flash("error", "Each image is too large. Please choose a smaller file.");
    } else if (err.message === "Only JPG, JPEG, PNG, and WebP images are supported.") {
      req.flash("error", err.message);
    } else {
      req.flash("error", "Image upload failed. Please use JPG, JPEG, PNG, or WebP images and try again.");
    }
    return res.redirect(req.method === "PUT" ? `/listing/${req.params.id}/edit` : "/listing/new");
  });
};


// listing (main page)     // adding new listing
router.route("/")
.get(listingController.index)
.post(isLogged, uploadListingImages, validateListing, listingController.addNewListing);
 


// new lsiting form
router.get("/new",isLogged,listingController.newForm);

// deatil of listing   // editing in db actulay   // delete
router.route("/:id")
.get(listingController.detailPage)
.put(
  isLogged,
  isOwner,
  uploadListingImages,
  validateListing,
  listingController.editDb
)
.delete(isLogged,isOwner,listingController.delete);

router.route("/:id/reserve")
  .get(listingController.reservationUnavailable)
  .post(listingController.reservationUnavailable);

router.route("/:id/save")
  .post(isLogged, listingController.saveListing)
  .delete(isLogged, listingController.unsaveListing);

// edit form
router.get("/:id/edit",isLogged,isOwner, listingController.editForm);


module.exports=router;
