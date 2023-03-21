const express = require("express");

// for routing:
const router = express.Router();

// Importing controller (which contains the business logic):
const campgroundControl = require("../controllers/campground");

// some other dependencies updated for this route:

// importing the required authMiddleware for protecting/validating campground routes:
// for regular image urls:
const {
  isloggedIn,
  schemaValidatorJoi,
  isAuthor
} = require("../authMiddleware");

// multer middleware for parsing form body which has image uploads.
// Multer adds a body object and a file or files object to the request object.
// The body object contains the values of the text fields of the form,
// the file or files object contains the files uploaded via the form.
const multer = require("multer");

// This is how to specify a local folder, but ideally it should be in the cloud:
// const upload = multer({ dest: "uploads/" });

// In order to store in cloud like cloudinary:
// pass in the required packages which we configed in cloudinary folder:
const { storage } = require("../cloudinary");
const upload = multer({ storage });

// for catching async errors:
const asyncCatcher = require("../utilities/asyncCatcher");

// ==================

// All routes :

// We can use router.route() to group all different types of routes to a specific endpoint:

router
  .route("/")
  // async get request for displaying all campgrounds:
  .get(asyncCatcher(campgroundControl.indexCampground))
  // create new campground (with only external img urls and no image/file uploads):
  // .post(
  //   isloggedIn, // need to login to create new campground
  //   schemaValidatorJoi, // does the server side data validations before running the post route
  //   asyncCatcher(campgroundControl.createCampground)
  // );

  // create new campground (multiple image/file uploads to cloudinary):
  .post(
    isloggedIn, // need to login to create new campground
    // note that here, we are using multer parsing middleware,
    // which is represented by upload.array("image"),
    // and schemaValidatorJoi needs req.body parsed for it to validate the data.
    // for this reason, we will use multer first and then joi validator,
    // a downside will be that, images will be uploaded by multer to cloudinary,
    // however, in production, you need to find a way to do data validation before image uploads cdn/cloud.
    upload.array("image"),
    schemaValidatorJoi, // does the server side data validations before running the post route
    asyncCatcher(campgroundControl.createCampground)
  );

// create new campground (with single image/file upload),
// just for testing:
// .post(
//   upload.single("image"), // single() helps parse a form which has single image upload
//   (req, res) => {
//     console.log(req.body, req.file); // req.file is created by multer for single file upload.
//     res.send("It worked");
//   }
// );

// create new campground (with multiple image/file uploads):
// just for testing image uploads to cloudinary:
// .post(
//   upload.array("image"), // array() helps parse a form which has multiple image/file upload
//   (req, res) => {
//     console.log(req.body, req.files); // req.files is created by multer for multiple file uploads.

//     // This console.log should output "req.files" like as follows:
//     // [
//     //   {
//     //     fieldname: "image",
//     //     originalname: "1.jpg",
//     //     encoding: "7bit",
//     //     mimetype: "image/jpeg",
//     //     path: "https://res.cloudinary.com/random_number/image/upload/other_random_number/YelpCamp/random_image_id.jpg",
//     //     size: 108773,
//     //     filename: "YelpCamp/random_image_id"
//     //   }
//     // ];

//     // notice that it is an array of objects since mutiple images are possible.

//     res.send("It worked");
//   }
// );

// notice why this route has to be placed before "/:id".
// so that "new" is not considered as id.
router.get("/new", isloggedIn, campgroundControl.newCampgroundPage);

router
  .route("/:id")
  // show details of individual campground using campground id:
  .get(asyncCatcher(campgroundControl.showCampgroundPage))
  .delete(
    isloggedIn, // need to login to delete campground
    isAuthor, // check if user is authorized
    asyncCatcher(campgroundControl.deleteCampground)
  );

router
  .route("/:id/edit")
  // go to edit page of a campground:
  .get(
    isloggedIn, // need to login to edit campground,
    isAuthor, // check if user is authorized
    asyncCatcher(campgroundControl.editCampgroundPage)
  )
  // edit campground details into db:
  .put(
    isloggedIn, // need to login to edit campground
    isAuthor, // check if user is authorized
    upload.array("image"), // if user is okay, then use multer middleware for parsing form data with multiple images and uploading to cloudinary.
    schemaValidatorJoi, // does the server side data validations before running the put route
    asyncCatcher(campgroundControl.modifyCampground)
  );

module.exports = router;
