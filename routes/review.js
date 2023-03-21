const express = require("express");

// for routing:
const router = express.Router({ mergeParams: true });
// we need to set mergeParams as true because express router handles params differently,
// so since we are using this route as "/campgrounds/:id/reviews" and we need id,
// for our joiSchema validation and storage in our db, we will use the option,
// called "mergeParams" to allow use to get params into this route
// from whereever this route was used. (In this case, this route was used in app.js).

// Importing controller (which contains the business logic):

const reviewControl = require("../controllers/review");

// some other dependencies updated for this route:

// importing authMiddleware for protecting new/delete review routes:
const {
  isloggedIn,
  reviewSchmemaValidator,
  isReviewAuthor
} = require("../authMiddleware");

// for catching async errors:
const asyncCatcher = require("../utilities/asyncCatcher");

// ===================

// All routes:

// All POST requests:

router.post(
  "/", // does server side validation for review post route
  isloggedIn,
  reviewSchmemaValidator,
  asyncCatcher(reviewControl.createReview)
);

// All DELETE requests:

router.delete(
  "/:reviewId",
  isloggedIn,
  isReviewAuthor,
  asyncCatcher(reviewControl.deleteReview)
);

module.exports = router;
