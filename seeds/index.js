const cities = require("./cities");
const { places, descriptors } = require("./seedHelpers");

const mongoose = require("mongoose");
const Campground = require("../models/campground");

mongoose.connect("mongodb://localhost:27017/yelp-camp", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Database connected");
});

const seedDB = async () => {
  await Campground.deleteMany({});

  const randomElemFromArr = Arr => Arr[Math.floor(Math.random() * Arr.length)];

  for (let i = 0; i < 300; i++) {
    const random1000 = Math.floor(Math.random() * 1000);
    const camp = new Campground({
      location: `${cities[random1000].city}, ${cities[random1000].state}`,
      title: `${randomElemFromArr(descriptors)} ${randomElemFromArr(places)}`,
      price: (random1000 % 20) + 10,
      geometry: {
        type: "Point",
        coordinates: [cities[random1000].longitude, cities[random1000].latitude]
      },
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
