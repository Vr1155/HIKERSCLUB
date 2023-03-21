// importing joi schema for server side data validation:
// destructuring so that you can scale by having different schemas!
const { campgroundSchemaJoi, reviewSchemaJoi } = require("./joiSchemas");

const ExpressError = require("./utilities/ExpressError");

// Importing models:
const Campground = require("./models/campground");
const Review = require("./models/review");

module.exports.isloggedIn = (req, res, next) => {
  // also notice that we are storing a signed in user in a session,
  // which can be accessed in req.user (which is setup by passport.js)
  // console.log("Current user: ", req.user);
  // This outputs:
  // {
  //   _id: new ObjectId("63b3e524e132042ab49d933f"),
  //   email: 'emailid@emailprovider.com',
  //   username: 'name_of_user',
  //   __v: 0
  // }

  // now that we are using passport,
  // if a user is logged in, isAuthenticated() return true and false if not logged in.
  if (!req.isAuthenticated()) {
    // also note that incase user was trying to do something before logging in,
    // we want to redirect them to that url once they've logged in,
    // For that we will use req.session to store the original url which was in req.originalUrl

    // for eg. if user clicks on new campground button without logging:
    // console.log("origin paths: ", req.path, req.originalUrl);
    // This will return: "/new /campgrounds/new"
    // we will use req.originalUrl here and store it in req.session.returnTo.

    req.session.returnTo = req.originalUrl;

    req.flash("error", "You need to login first!");
    return res.redirect("/login");
  }
  next();
};

// This middleware function will do server side data validation using joi schema:
module.exports.schemaValidatorJoi = (req, res, next) => {
  // body contains a json object as a value which had a key of "campground"
  // {"campground":{"title":"camp","location":"location"}}

  // simple error throwing:
  // if "campground" key is not present in the payload, throw an error:
  // if (!req.body.campground)
  //   throw new ExpressError("Invalid/Insufficent data", 400);

  // as you can see this is tedious and quite difficult to scale.
  // But here will use joi schema to make our job easier!

  // validate() checks whether body is matching our Joi schema!
  // result of validate(req.body) will be of following format:
  // {
  //   value: {
  // original res.body
  //          },
  //   error: [Error [ValidationError]: "campground" is required]
  //        {
  //          _original: {},
  //          details: [ [Object] ]
  //        }
  // }

  const { error } = campgroundSchemaJoi.validate(req.body);

  // notice that error.details is an array.

  // if error exists, then throw expressError with all details joined by ",":
  if (error) {
    const msg = error.details.map(err => err.message).join(",");
    next(new ExpressError(msg));
  } else {
    next();
  }
};

// Joi Schema Validator for review model:
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

  // =========
  // This piece of code is for authorization:
  // first find the campground,
  const campground = await Campground.findById(id);
  // then check whether currentUser is authorized or not:
  if (!campground.author.equals(req.user._id)) {
    // if user is not authorized, show error and RETURN after redirecting to show page:
    req.flash("error", "You do not have the permission to do that!");
    return res.redirect(`/campgrounds/${campground._id}`);
  }
  // if correct user is logged in, then continue:
  next();
  // =========
};

module.exports.isReviewAuthor = async (req, res, next) => {
  // getting reviewId and campgroundId from the params:
  const { id, reviewId } = req.params;

  // =========
  // This piece of code is for authorization:
  // first find the review,
  const review = await Review.findById(reviewId);
  // then check whether currentUser is authorized or not:
  if (!review.author.equals(req.user._id)) {
    // if user is not authorized, show error and RETURN after redirecting to show page:
    req.flash("error", "You do not have the permission to do that!");
    return res.redirect(`/campgrounds/${id}`);
  }
  // if correct user is logged in, then continue:
  next();
  // =========
};
