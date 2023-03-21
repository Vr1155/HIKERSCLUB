// Importing model:
const Campground = require("../models/campground");

// Importing mapbox sdk for geocoding api:
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
// get the access token saved in some .env file:
const mapBoxToken = process.env.MAPBOX_TOKEN;
// verify and authenticate the access token:
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });
// geocoder has 2 methods we want: forward and reverse geocode.
// we only want forward geocode (i.e. convert location in words to gps coordinates).

// Importing cloudinary npm package:
const { cloudinary } = require("../cloudinary");

module.exports.indexCampground = async (req, res) => {
  // finding all campgrounds will take time so you need await here:
  const campgrounds = await Campground.find({});

  // just for testing image links from seeds:
  // campgrounds.forEach((img, i) => {
  //   console.log(img.images[0].url);
  // });

  res.render("campgrounds/index", { campgrounds });
};

module.exports.newCampgroundPage = (req, res) => {
  const campground = {};
  res.render("campgrounds/new", { campground });
};

module.exports.showCampgroundPage = async (req, res) => {
  // finding campground with that specific id using findById(),
  // it will always return 1 record since ids are unique.
  // Notice that reviews and author are stored as reference in Campground model,
  // so we need to populate them by getting the author data from User model into Campground model where it was referenced.
  // Also we need to populate Review model with its own review authors (which were stored as User obj ids),
  // this is done with nested populate as shown below,
  // which populates reviews with review authors:
  const campground = await Campground.findById(req.params.id)
    .populate({ path: "reviews", populate: { path: "author" } }) // nested populate
    .populate("author");

  // now review and author data is in Campground.
  // console.log(campground);

  // if campground is not found, flash error and go to index:
  if (!campground) {
    req.flash("error", "Cannot find that Campground");
    res.redirect("/campgrounds");
  }

  // populate with reviews according to their objectid so we can show them on details page!
  // notice that we have to write the name of the key which has value as array of objectids.
  // in this case, "reviews" was the key which had stored the array of objectids which we want to populate with object values!
  res.render("campgrounds/show", { campground });
};

module.exports.editCampgroundPage = async (req, res) => {
  const { id } = req.params;
  const campground = await Campground.findById(id);

  if (!campground) {
    req.flash("error", "Cannot find that Campground");
    res.redirect("/campgrounds");
  }

  res.render("campgrounds/edit", { campground });
};

module.exports.createCampground = async (req, res, next) => {
  // Testing mapbox-sdk api:
  // forwardGeocode() converts location in words to gps coordinates.
  // There can be many responses to a single location especially if vague (i.e. Mumbai),
  // limit helps us get only top n best matching coordinates.

  // notice that req.body.campground.location contains
  // a string which user inputs as exact location of camgpround.

  // just for testing you can put query as:
  // query: "Yosemite, CA",
  const geoData = await geocoder
    .forwardGeocode({
      query: req.body.campground.location,
      limit: 1
    })
    .send();

  // geoData now contains the response from mapbox api geocoding service.

  // console.log(geoData.body.features[0].geometry.coordinates);
  // the following gets logged into the console:
  // [-119.571615, 37.737363];
  // notice that it is longitude first and latitude second.
  // since mapbox treats map like cartesian plane,
  // (i.e. x and y coordinates)
  // In google maps you have to search with latitude first and longitude second.
  // see for more details :
  // https://docs.mapbox.com/api/search/geocoding/

  const campground = new Campground(req.body.campground);

  // setting those coordinates (contained in geoData.body.features[0].geometry),
  // as values to geometry key in campground obj:
  campground.geometry = geoData.body.features[0].geometry;

  // note that if you are using multer with cloudinary,
  // multer will create req.files for you which contains multiple images,
  // req.files will be in following format:
  // [
  //   {
  //     fieldname: "image",
  //     originalname: "1.jpg",
  //     encoding: "7bit",
  //     mimetype: "image/jpeg",
  //     path: "https://res.cloudinary.com/random_number/image/upload/other_random_number/YelpCamp/random_image_id.jpg",
  //     size: 108773,
  //     filename: "YelpCamp/random_image_id"
  //   }
  // ];

  // we need to extract path and filename from here,
  // and store it in mongodb.

  // we can use map (which returns an array) since req.files is also an array:

  campground.images = req.files.map(f => ({
    url: f.path,
    filename: f.filename
  }));

  // since we are storing campground authors as ids,
  // user._id is provided by passport,
  // we will set reference to author (which is done with that user's object id):
  campground.author = req.user._id;

  // note that campground is now in a schema that we want, so we can call save on it:
  await campground.save();

  // just for testing:
  // console.log("This was saved in mongodb :", campground);

  // Show flash message on the screen:
  req.flash("success", "Successfully created a new campground!");

  // now campground is a record in our database, we can access its id, so we can redirect:
  res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.modifyCampground = async (req, res, next) => {
  const { id } = req.params;
  const campground = await Campground.findByIdAndUpdate(id, {
    ...req.body.campground
  });

  // just like we did in create campground,
  // we need to get an array which contains 2 strings,
  // which will contain cloudinary urls and filenames of additional images which were uploaded by user when edit page was submitted.
  // However, we simply want to add these images to the already exisiting ones and not overwrite anything.
  // for this we will create a variable "img" and use ellipsis "..." when pushing array elements into another array.

  // note that req.files is created by multer middleware.
  const imgs = req.files.map(f => ({
    url: f.path,
    filename: f.filename
  }));

  // using ellipsis to pass array elements into another array:
  campground.images.push(...imgs);

  // saving added image urls and filenames to mongodb:
  await campground.save();

  // check if there are any images to delete from mongodb and cloudinary:
  if (req.body.deleteImages) {
    // first delete from cloudinary using cloudinary.uploader.destroy() method provided by cloudinary npm package:
    for (let filename of req.body.deleteImages) {
      await cloudinary.uploader.destroy(filename);
    }

    // then we will use $pull and $in operator in mongodb,
    // The $pull operator removes from an existing array all instances of a value or values that match a specified condition
    // in this case, "images" inside campground object is an array of urls and filenames,
    // and we need to delete filenames specified in "from our req.body.deleteImages".
    // we will use $in to find objects with matching filenames from our "req.body.deleteImages" array and "images".

    await campground.updateOne({
      $pull: { images: { filename: { $in: req.body.deleteImages } } }
    });

    console.log(campground);
  }

  campground.images = req.flash(
    "success",
    "Successfully edited the campground!"
  );

  res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.deleteCampground = async (req, res) => {
  const { id } = req.params;

  const campground = await Campground.findByIdAndDelete(id);

  req.flash("success", "Successfully deleted the campground!");

  res.redirect("/campgrounds");
};
