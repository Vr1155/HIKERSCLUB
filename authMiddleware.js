const { campgroundSchemaJoi, reviewSchemaJoi } = require("./joiSchemas");

const ExpressError = require("./utilities/ExpressError");

const Campground = require("./models/campground");
const Review = require("./models/review");

module.exports.isloggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.returnTo = req.originalUrl;

    req.flash("error", "You need to login first!");
    return res.redirect("/login");
  }
  next();
};

module.exports.schemaValidatorJoi = (req, res, next) => {
  const { error } = campgroundSchemaJoi.validate(req.body);

  if (error) {
    const msg = error.details.map(err => err.message).join(",");
    next(new ExpressError(msg));
  } else {
    next();
  }
};

module.exports.reviewSchmemaValidator = (req, res, next) => {
  const { error } = reviewSchemaJoi.validate(req.body);
  if (error) {
    const msg = error.details.map(err => err.message).join(",");
    next(new ExpressError(msg));
  } else {
    next();
  }
};

module.exports.isAuthor = async (req, res, next) => {
  const { id } = req.params;

  const campground = await Campground.findById(id);
  if (!campground.author.equals(req.user._id)) {
    req.flash("error", "You do not have the permission to do that!");
    return res.redirect(`/campgrounds/${campground._id}`);
  }
  next();
};

module.exports.isReviewAuthor = async (req, res, next) => {
  const { id, reviewId } = req.params;

  const review = await Review.findById(reviewId);
  if (!review.author.equals(req.user._id)) {
    req.flash("error", "You do not have the permission to do that!");
    return res.redirect(`/campgrounds/${id}`);
  }
  next();
};
