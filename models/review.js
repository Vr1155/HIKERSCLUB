const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// creating and exporting review schema with mongoose:

const reviewSchema = new Schema({
  body: String,
  rating: Number,
  // one to one relationship, but still using ref,
  // so we do not have to store the data here.
  // curly bracket because we dont need an array, there can be only 1 campground author.
  author: {
    type: Schema.Types.ObjectId,
    ref: "User"
  }
});

// exporting schema:
module.exports = mongoose.model("Review", reviewSchema);
