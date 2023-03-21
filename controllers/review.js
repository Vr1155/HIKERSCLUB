// Importing model:
const Campground = require("../models/campground");
const Review = require("../models/review");

module.exports.createReview = async (req, res) => {
  // only for debugging
  // res.send(req.body);

  // structure of review object:
  //{"review":{"rating":"2","body":"testing review"}}

  // notice that you have to await findById!
  // console.log(req.params.id);

  const campground = await Campground.findById(req.params.id);
  const review = new Review(req.body.review);
  // reviews will have reviewAuthors same way campgrounds have authors:
  review.author = req.user._id;

  campground.reviews.push(review);
  await review.save();
  await campground.save();

  req.flash("success", "Successfully created the review!");

  res.redirect(`/campgrounds/${req.params.id}`);
};

module.exports.deleteReview = async (req, res) => {
  const { id, reviewId } = req.params;

  //The $pull operator removes from an existing array all instances of a value or values that match a specified condition.
  const cammpground = await Campground.findByIdAndUpdate(id, {
    $pull: { reviews: reviewId }
  });
  const review = await Review.findByIdAndDelete(reviewId);

  req.flash("success", "Successfully deleted the review!");

  res.redirect(`/campgrounds/${id}`);
};
