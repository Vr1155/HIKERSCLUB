const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review");

// We have defined ImageSchema separately,
// so that we can use virtual property for thumbnail.
// virtual properties in mongoose are those properties
// which can derived from other properties.
// virtual properties are not stored in MongoDB.
// They only exist logically and not written into documents collection.

// Here we want to define thumbnail as virtual property.

// This is the sample link for normal image size:

// https://res.cloudinary.com/dp5xnsncr/image/upload/v1675939545/YelpCamp/fklzhsco9clpeacvtg2r.jpg

// This is the sample link for thumbnail image of width 200px:

// https://res.cloudinary.com/dp5xnsncr/image/upload/w_200/v1675939545/YelpCamp/fklzhsco9clpeacvtg2r.jpg

// only difference is "w_200" after "upload"

const ImageSchema = new Schema({
  url: String,
  filename: String
});

// Now lets create virtual property using virtual() for our ImageSchema:

// Note that virtuals are not stored on mongoDB, they are computed properties on documents.

// To show thumbnail of images in edit page:
ImageSchema.virtual("thumbnail").get(function () {
  // make sure you return otherwise, it wont work!
  // The new string needs to be returned:
  return this.url.replace("/upload", "/upload/w_200");
});

// creating and exporting campground schema with mongoose:

// Imp Note: Mongoose does not include virtuals when you convert a document to JSON.
// In order to get virtual properties along with other properties, you need to specify an option: {virtuals: true}
// We will need virtual properties like popUpText for our cluster map.
// see docs: https://mongoosejs.com/docs/tutorials/virtuals.html#virtuals-in-json
const opts = { toJSON: { virtuals: true } };

const CampgroundSchema = new Schema(
  {
    title: String,
    price: Number,
    // for external image urls:
    // image: String,

    // since we are using cloudinary:
    // we need to make image into an array (multiple uploads),
    // and we will store filepath and image url of each image.
    // Notice that here we are using ImageSchema so we can use virtual property for thumbnail:
    images: [ImageSchema],

    // for geocoding,
    // instead of having latitude and longitude,
    // we can have a geometry obj,
    // which will have map pointer type and coordinates.
    // Mongoose supports this see docs: https://mongoosejs.com/docs/geojson.html
    // MongoDB also supports various geospatial data and queries, see docs: https://www.mongodb.com/docs/manual/geospatial-queries/

    geometry: {
      type: {
        type: String, // Don't do `{ location: { type: String } }`
        enum: ["Point"], // 'location.type' must be 'Point'
        required: true
      },
      coordinates: {
        type: [Number],
        required: true
      }
    },

    description: String,
    location: String,
    // one to many relationship
    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: "Review"
      }
    ],
    // one to one relationship, but still using ref,
    // so we do not have to store the data here.
    // curly bracket because we dont need an array, there can be only 1 campground author.
    author: {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  },
  opts // options for our schema
);

// Now lets create virtual property using virtual() for our CampgroundSchema:

// Note that virtuals are not stored on mongoDB, they are computed properties on documents.

// For feeding data to our cluster map:
CampgroundSchema.virtual("properties.popUpMarkup").get(function () {
  // make sure you return otherwise, it wont work!
  // The new html element that needs to be returned:
  return `<strong><a href="/campgrounds/${this._id}">${this.title}</a></strong>
  <p>${this.description.substring(0, 30)}...</p>`;
});

// "findByIdAndDelete" calls "findOneAndDelete" which supports post middleware!
// we can use this to delete all reviews of a particular camp whenever we delete that camp!

CampgroundSchema.post("findOneAndDelete", async camp => {
  if (camp) {
    // if the camp exists, we delete all its reviews, for that we will use $in operato,
    // The $in operator selects the documents or values,
    // where the value of a field equals any value in the specified array.

    // delete all reviews related to this campground.

    await Review.deleteMany({ _id: { $in: camp.reviews } });
  }
});

// exporting schema:
module.exports = mongoose.model("Campground", CampgroundSchema);
