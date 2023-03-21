const express = require("express");

const router = express.Router();

const campgroundControl = require("../controllers/campground");

const {
  isloggedIn,
  schemaValidatorJoi,
  isAuthor
} = require("../authMiddleware");

const multer = require("multer");

const { storage } = require("../cloudinary");
const upload = multer({ storage });

const asyncCatcher = require("../utilities/asyncCatcher");

router
  .route("/")
  .get(asyncCatcher(campgroundControl.indexCampground))
  .post(
    isloggedIn,
    upload.array("image"),
    schemaValidatorJoi,
    asyncCatcher(campgroundControl.createCampground)
  );

router.get("/new", isloggedIn, campgroundControl.newCampgroundPage);

router
  .route("/:id")
  .get(asyncCatcher(campgroundControl.showCampgroundPage))
  .delete(
    isloggedIn,
    isAuthor,
    asyncCatcher(campgroundControl.deleteCampground)
  );

router
  .route("/:id/edit")
  .get(isloggedIn, isAuthor, asyncCatcher(campgroundControl.editCampgroundPage))
  .put(
    isloggedIn,
    isAuthor,
    upload.array("image"),
    schemaValidatorJoi,
    asyncCatcher(campgroundControl.modifyCampground)
  );

module.exports = router;
