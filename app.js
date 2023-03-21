// if we are not in production environment,
// then use the .env file for configuring the required cloud services account credentials and access tokens
// so we are storing secret stuff like api keys or passwords in .env file.
// if you make a new account,
// make sure you update creds in .env file as well
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// your environment variables are now available:
// console.log(`your secret: ${process.env.secret}`);

// In production,
// There is another way of storing api keys,
// we dont store them in a file but in the environment itself.

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");

// importing helmet for express.js security using HTTP headers:
const helmet = require("helmet");

// importing models
// importing "User" model as well (which has the plugin passport-local-mongoose):
const User = require("./models/user");

// importing express mongo sanitizer middleware to sanitize all inputs to our endpoints:
const mongoSanitize = require("express-mongo-sanitize");

// importing routes:
const campgroundRoutes = require("./routes/campground");
const reviewRoutes = require("./routes/review");
const userRoutes = require("./routes/user");

// importing other dependencies:
const methodOverride = require("method-override");
const morgan = require("morgan");
const ejsMate = require("ejs-mate");
const session = require("express-session");

// We will use mongoDB for session storage using connect-mongo:

const MongoStore = require("connect-mongo");
const flash = require("connect-flash");

// importing passport dependencies for authentication:
const passport = require("passport");
const localStrategy = require("passport-local");

// Other dependencies for error handling:
const ExpressError = require("./utilities/ExpressError");

// This is the api endpoint for our database:
const dbUrl = process.env.DB_URL || "mongodb://localhost:27017/yelp-camp";

// creating/connecting to a database called yelp-camp:
mongoose.connect(dbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// useCreateIndex is no longer necessary in newer versions:
// mongoose.set("useCreateIndex", true);

// suppress deprecation warning where, strictQuery option will be switched to false by default.
mongoose.set("strictQuery", true);

const db = mongoose.connection;

// To handle errors after initial connection was established,
// you should listen for error events on the connection
// here we are listening to error events on connection:
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Database connected");
});

const app = express();

// setting view engine as ejs for SSR:
app.set("view engine", "ejs");
// this allows us to use nodemon app.js from anywhere and still access views.
// basically set path for views relative to this file.
app.set("views", path.join(__dirname, "views"));

app.engine("ejs", ejsMate);

// using middlewares here:

// helps in parsing req body which might be in json format.
// note that "application/x-www-form-urlencoded" is the default type of every HTML form.
// but this is not good enough for image/file uploads.
app.use(
  express.urlencoded({
    extended: true
  })
);
// method override (for http methods other than get and post in html forms)
app.use(methodOverride("_method"));

// using morgan middleware for logging, Using a predefined format string by passing "dev" to morgan.
app.use(morgan("dev"));
// you can also define your own format or build your own middleware (see different branch for middleware).

app.use(express.static(path.join(__dirname, "public")));
// used path.join so that we can access static assets from public folder from anywhere,
// (just like in views).

// using express mongo sanitizer middleware to sanitize input queries,
// for eg: localhost:3000/?$gt=svfav
// gives us input queries like: { '$gt': 'svfav' }
// options like replaceWith: '_' will append '_' to the start of first unsanitary input queries.
// i.e, we get: {"_gt": "vdnsfv"}, which can be safely ignored.
// having no options will simply remove the first unsanitary input queries.
// i.e, we get: {}, which can be safely ignored.
// note that second or third input queries will stay,
// for eg: localhost:3000/?$gt=svfav&agvaew=sgaesgr
// will give: { agvaew: 'sgaesgr', _gt: 'svfav' }

app.use(
  mongoSanitize({
    replaceWith: "_"
  })
);

// Using all of middlewares provided by helmet.
// see docs: https://helmetjs.github.io/
// Each header and its usage is described in docs.

// using helmet middlewares for security using HTTP headers:
app.use(helmet());

// note that content security policy middleware causes some cdn scripts to fail (like mapbox and bootstrap).
// This is because it trys to mitigate cross-site scripting attacks, among other things.
// See MDN's introductory article on Content Security Policy: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP

// default policy is as follows:

// default-src 'self';
// base-uri 'self';
// font-src 'self' https: data:;
// form-action 'self';
// frame-ancestors 'self';
// img-src 'self' data:;
// object-src 'none';
// script-src 'self';
// script-src-attr 'none';
// style-src 'self' https: 'unsafe-inline';
// upgrade-insecure-requests

// However, you can specify a list of acceptable sources which can overwrite the default policy.

// We have done this as follows:

// https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css

// These are all the urls we want to allow:
const scriptSrcUrls = [
  "https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/",
  "https://stackpath.bootstrapcdn.com/",
  "https://api.tiles.mapbox.com/",
  "https://api.mapbox.com/",
  "https://kit.fontawesome.com/",
  "https://cdnjs.cloudflare.com/",
  "https://cdn.jsdelivr.net"
];
const styleSrcUrls = [
  "https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/",
  "https://kit-free.fontawesome.com/",
  "https://stackpath.bootstrapcdn.com/",
  "https://api.mapbox.com/",
  "https://api.tiles.mapbox.com/",
  "https://fonts.googleapis.com/",
  "https://use.fontawesome.com/"
];
const connectSrcUrls = [
  "https://api.mapbox.com/",
  "https://a.tiles.mapbox.com/",
  "https://b.tiles.mapbox.com/",
  "https://events.mapbox.com/"
];
const fontSrcUrls = [];
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", "blob:"],
      objectSrc: [],
      // images allows from these urls:
      imgSrc: [
        "'self'",
        "blob:",
        "data:",
        "https://res.cloudinary.com/dp5xnsncr/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT!
        "https://images.unsplash.com/"
      ],
      fontSrc: ["'self'", ...fontSrcUrls]
    }
  })
);

const store = MongoStore.create({
  // database api endpoint is going to be the same as mongoDB:
  mongoUrl: dbUrl,
  secret: process.env.SECRET || "thisshouldbeabettersecret",
  // If you are using express-session >= 1.10.0 and
  // don't want to resave all the session on database every single time that the user refresh the page,
  // you can lazy update the session, by limiting a period of time.
  touchAfter: 24 * 60 * 60 // update everyday (time is in seconds).
});

// Setting up express session Here:
const sessionConfig = {
  // using mongoDB for session storage:
  store,

  // it is recommended to not use default name since,
  // hackers can write a script to scrape your cookies by default name:
  name: "session",

  // By default, connect-mongo uses MongoDB's TTL collection feature (2.2+) to have mongod automatically remove expired sessions.
  // But you can change this behavior.

  // server's secret key that should be stored very securely:
  secret: "thisshouldbeabettersecret",
  // There are only to make deprecation warnings to go away:
  resave: false,
  saveUninitialized: false,
  // cookie configurations:
  cookie: {
    // An HttpOnly Cookie is a tag added to a browser cookie that prevents client-side scripts from accessing data.
    // It provides a gate that prevents the specialized cookie from being accessed by anything other than the server.
    // As a result, even if a cross-site scripting (XSS) flaw exists, and a user accidentally accesses a link that exploits the flaw, the browser will not reveal the cookie to the third-party.
    // Here’s an example – let’s say a browser detects a cookie containing the HttpOnly flag.  If the client-side code attempts to read the cookie, the browser will return an empty string as a result.  This helps prevent malicious (usually cross-site scripting (XSS)) code from sending the data to an attacker’s website.
    httpOnly: true,

    // Make cookie work (changed/configured) only on HTTPS connections,
    // This will not work on localhost,
    // but make sure it is enabled on production:
    // secure: true,

    // This cookie will expire in a week from now:
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
};

// using sessions with our predefined configs:
app.use(session(sessionConfig));

// Brief intro about flash:
// The flash is a special area of the session used for storing messages.
// Messages are written to the flash and cleared after being displayed to the user.
// The flash is typically used in combination with redirects,
// ensuring that the message is available to the next page that is to be rendered.

// using flash messages:
app.use(flash());

// Setting up passport middlewares for authentication:

// Note that passport uses express-session for auth.
// So make sure you use passport.session() after session handling middleware:

// To use Passport in an Express or Connect-based application,
// configure it with the required passport.initialize() middleware.
// If your application uses persistent login sessions (recommended, but not required),
// passport.session() middleware must also be used.
app.use(passport.initialize());
app.use(passport.session());

// There different authentication strategies in passport,
// Here, we are using "local" strategy with "passport-local"
// (basically it means basic auth using username and password),
// also note that we had already attached passport-local-mongoose plugin to "User" model,
// see models/user.js for more details.
// Which means that the "User" model already has new methods provided by that plugin
// So we will use authentication strategy provided by plugin to our "User" model,
// for our "local" strategy.

passport.use(new localStrategy(User.authenticate()));

// serializeUser basically deals with how do we store a user in a session,
// deserializeUser basically deals with how do we get a user out of a session.

// here again, passport-local-mongoose comes to our help with its static methods from plugin.
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// ========================

// All calls should go through this middleware.
// This part had to be moved down since we are using "req.user" which is set up by passport.js
// using req.user we can deserialize user info from a logged in user and store it in res.locals variable,
// so it can be accessed by any ejs template.
// This allows us to show ui components that only logged in user can see for eg. "logout" button.

// Middleware for handling flash messages or data stored in locals (whereever they are used in the app):
app.use((req, res, next) => {
  // just for testing:
  console.log(req.query);

  // we will have access to current user (which has logged in successfully) everywhere in our app.
  // This important for showing extra functionality like "logout" for already logged in users,
  // and functionality like "login/register" incase noone has logged in.
  // Also useful for some other functionality where, user authorization is needed:
  res.locals.currentUser = req.user;

  // notice that res.locals are available everywhere,
  // whereever res is used (including res.redirect),
  // so whatever was stored in flash("success") by any routes by using req.flash("success"),
  // it will be stored in res.locals.success,
  // with help of this middleware.
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

// ========================

// Importing all Routes Here:

// "/campgrounds" routes:
app.use("/campgrounds", campgroundRoutes);
// "/campgrounds/:id/reviews" aka review routes:
app.use("/campgrounds/:id/reviews", reviewRoutes);
// user routes should be public initially other subroutes like
// "/login", "/register" are specified inside userRoutes
app.use("/", userRoutes);
// notice how we need id in our review route,
// but express router handles params differently,
// thankfully we can use mergeParams option in our review route so we can still get id,
// from here into our review route.

// ALL GET REQUESTS:

app.get("/", (req, res) => {
  res.render("home");
});

// simple get route to check "User" authentication with passport.js:
// app.get("/fakeuserauth", async (req, res) => {
//   // Check whether our dummy inputs are according to "User" schema,
//   // Notice that we are also passing username even though we didnt specify it in our model,
//   // Now that is something that is handled by "passport-local-mongoose" plugin.
//   // This will create a new User object which has the plugin methods and functionality:
//   const user = new User({
//     email: "sam@gmail.com",
//     username: "sammy"
//   });

//   // register() is a static method provided by "passport-local-mongoose",
//   // we pass the user object and a password to register() fn to create all necessary fields,
//   // which are needed for auth, then saves all necessary field in our db:
//   const newUser = await User.register(user, "password");

//   // Finally send the newly registered and saved user obj:
//   res.send(newUser);

//   // we get the following output:

//   //  {
//   //   email: "sam@gmail.com",
//   //   _id: "6387a027e238df602b01a728",
//   //   username: "sammy",
//   //   salt: "732571c97cf2bff0688b89f8837509fb1a60a59a877951e818067093d90a3950",
//   //   hash: "ce7eb1b7982f506cc032c9a6f02a93311e8f48570c30efb3da0281e0a39abb240b3cc79b8f4206f8b37428b40a7774eb85e6058d2ba2c084063d1b28b02edda8cbea99347ca60cb56a5702e45a3c9ee7b24b5ffc517f13ec972b4c6b06a7820952787d92bd4b8f7da95c925cdab85493b891c4987879c3a77bd1595e6f4eda6ecd0ac334beb8c41f9c55e2c3f78a3e689b0bca8e1cb97fdac5059f31c30a7ad5cde4facfd95e6896de2b215f0c840f8c83e2d4f2cb5672283b80152704d396a96e6da202d75f2cbeda175bf51c9bbddcd592bf5158c36273d0b4fd42ea2b9498b8577b27665da7dc299ad3dcfaf1c71bf864adef8583afcc0d88432b9df1c4e0a4b5141a9aa8e84b813ff06a17cd0f4640f7bcba8f27a916dca83818b29d51a2012ba75f207ed0d327fba52bca13ce05a1eb65393adb131cc8fa565fe593b704902294f0ec16ab1c2031c7bfe650ff0e7da62c07e90545f0583d0481427bf52f352310024b7b1ffa57849de873cf2e2919f7b0b157ae73158892ed86b63ec1460e8a54be5b9d40e548208d6839283318453f47faf7c64266a7d91dec3e7697e66c277ea57be6bdd622bb043edc302214798d14072039fe73de361d96bc30da3be9db76701c96f11fe8de2660e485d944a3f65274fcd17ef5a76e93e25ea6b062e4b2959d680430f35c6ec3316c0459a13af125e7596bf7460454a3d7cfcc6e2f",
//   //   __v: 0
//   // };

//   // notice how salt and hash, were created by "passport-local-mongoose" plugin methods.
//   // It uses pbkdf2 hashing algorithm, because its platform independent.
// });

// 404 handling route:
app.all("*", (req, res, next) => {
  next(new ExpressError("404, page not found!", 404));
});

// Error handling middleware, that will catch errors:
app.use((err, req, res, next) => {
  // displaying the error view along with error msg and stack trace:

  const { statusCode = 500 } = err;
  if (!err.message) err.message = "Oh no! Something went wrong!";

  res.status(statusCode).render("error", { err });
});

app.listen(3000, () => {
  console.log("serving on http://localhost:3000");
});
