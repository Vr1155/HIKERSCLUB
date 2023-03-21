const express = require("express");

const router = express.Router({ mergeParams: true });
const reviewControl = require("../controllers/review");
const {
  isloggedIn,
  reviewSchmemaValidator,
  isReviewAuthor
} = require("../authMiddleware");

const asyncCatcher = require("../utilities/asyncCatcher");

router.post(
  "/",
  isloggedIn,
  reviewSchmemaValidator,
  asyncCatcher(reviewControl.createReview)
);

router.delete(
  "/:reviewId",
  isloggedIn,
  isReviewAuthor,
  asyncCatcher(reviewControl.deleteReview)
);

module.exports = router;
