// importing our seed dataset and helpers:

const cities = require("./cities");
const { places, descriptors } = require("./seedHelpers");

// Now importing mongoose and schema and setting up database connections:

const mongoose = require("mongoose");
// note that we are in seeds directory, so use ".."
const Campground = require("../models/campground");

mongoose.connect("mongodb://localhost:27017/yelp-camp", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;

// To handle errors after initial connection was established,
// you should listen for error events on the connection
// here we are listening to error events on connection:
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Database connected");
});

// this function contains the basic seed logic:

// const seedDB = async () => {
//   // delete everything that was there before:
//   await Campground.deleteMany({});
//   // create our new seed, for now just one 1 new instance:
//   const c = new Campground({ title: "purple field" });
//   // save it into our database:
//   await c.save();
// };

const seedDB = async () => {
  // delete everything that was there before:
  await Campground.deleteMany({});

  const randomElemFromArr = Arr => Arr[Math.floor(Math.random() * Arr.length)];

  // create our new seed using our dataset (we will make 50 such insertions):

  for (let i = 0; i < 300; i++) {
    // Math.random() returns any real num in interval [0,1).
    const random1000 = Math.floor(Math.random() * 1000);
    // picking a random city and state and generating a random title:
    const camp = new Campground({
      location: `${cities[random1000].city}, ${cities[random1000].state}`,
      title: `${randomElemFromArr(descriptors)} ${randomElemFromArr(places)}`,
      price: (random1000 % 20) + 10,
      // Default map coordinates are india's default coordinates:
      geometry: {
        type: "Point",
        coordinates: [cities[random1000].longitude, cities[random1000].latitude]
      },
      // Your user Id
      author: "63b3e524e132042ab49d933f",
      description:
        "Asymmetrical pabst irony whatever, iPhone kale chips wolf raw denim flannel tilde kinfolk Brooklyn listicle. Dreamcatcher cold-pressed cardigan fingerstache. VHS biodiesel hashtag, hot chicken subway tile shoreditch vexillologist listicle franzen 90's squid +1 af. Seitan chartreuse fashion axe, gatekeep pok pok messenger bag deep v. Retro trust fund typewriter fixie, bespoke four dollar toast bushwick vegan roof party succulents etsy echo park tumblr lo-fi cliche. Pour-over art party photo booth +1 leggings, yuccie etsy la croix fashion axe vice tilde. Slow-carb helvetica salvia pork belly live-edge locavore vibecession semiotics jean shorts cardigan you probably haven't heard of them street art.",
      images: [
        {
          url: "https://res.cloudinary.com/dp5xnsncr/image/upload/v1676701927/YelpCamp/a3guharenlkzk1qtshgo.jpg",
          filename: "YelpCamp/a3guharenlkzk1qtshgo"
        },
        {
          url: "https://res.cloudinary.com/dp5xnsncr/image/upload/v1676701927/YelpCamp/bzywbn9fhegtiq27xivr.jpg",
          filename: "YelpCamp/bzywbn9fhegtiq27xivr"
        }
      ]
    });

    await camp.save();
  }
};

seedDB().then(() => {
  mongoose.connection.close();
});
