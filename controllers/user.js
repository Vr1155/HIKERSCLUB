// Importing model:
const User = require("../models/user");

module.exports.showRegister = (req, res) => {
  // show the register page:
  res.render("users/register");
};

module.exports.register = async (req, res, next) => {
  // just for debugging:
  // res.send(req.body);

  try {
    //extract username, password and email:
    const { username, password, email } = req.body;
    // create an obj if they are according to mongoose schema:
    const user = new User({
      email,
      username
    });
    // use static plugin method register() from "passport-local-mongoose" to register user:
    const newUser = await User.register(user, password);

    // If registeration details are submitted in db, we want to login.
    // we will use req.login,
    // this login function is provided by passport.js on req obj.
    // See old docs: https://web.archive.org/web/20211129111948/http://www.passportjs.org/docs/login/
    // see new docs: https://www.passportjs.org/tutorials/password/signup/
    // we have to use req.login here since we dont have user already stored in db.
    // Just another passport.js quirk.
    req.login(newUser, err => {
      if (err) {
        // let the error handlers handle the error:
        return next(err);
      }
      // display flash msg and redirect to all campgrounds:
      req.flash("success", "Registeration Successful! Welcome to YelpCamp!");
      res.redirect("/campgrounds");
    });
  } catch (e) {
    // if anything fails, display error flash msg and redirect back to register page:
    req.flash("error", e.message);
    res.redirect("register");
  }
};

module.exports.showLogin = (req, res) => {
  // show the login page:
  res.render("users/login");
};

module.exports.login = (req, res) => {
  // console.log("from login route: ", req.session);

  req.flash("success", "Login Successful! Welcome back!");

  // Incase user was trying to do something before logging in, we will redirect him back to it.
  const redirectUrl = req.session.returnTo || "/campgrounds";
  console.log(`redirect URL: ${redirectUrl}`);
  delete req.session.returnTo;
  res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
  // passport.js handles logout for us by deserializing/removing the user session.
  // apparently the newer version of passport.js requires us to pass a callback,
  // which executes after logging out.
  // we will throw an error is error occurs,
  // or else we will flash message and redirect to campgrounds:
  req.logout(err => {
    if (err) {
      next(err);
    }
    req.flash("success", "Logout successful! Goodbye!");
    res.redirect("/campgrounds");
  });
};
