const User = require("../models/user");

module.exports.showRegister = (req, res) => {
  res.render("users/register");
};

module.exports.register = async (req, res, next) => {
  try {
    const { username, password, email } = req.body;
    const user = new User({
      email,
      username
    });
    const newUser = await User.register(user, password);

    req.login(newUser, err => {
      if (err) {
        return next(err);
      }
      req.flash("success", "Registeration Successful! Welcome to HikersClub!");
      res.redirect("/campgrounds");
    });
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("register");
  }
};

module.exports.showLogin = (req, res) => {
  res.render("users/login");
};

module.exports.login = (req, res) => {
  req.flash("success", "Login Successful! Welcome back!");

  const redirectUrl = req.session.returnTo || "/campgrounds";
  console.log(`redirect URL: ${redirectUrl}`);
  delete req.session.returnTo;
  res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
  req.logout(err => {
    if (err) {
      next(err);
    }
    req.flash("success", "Logout successful! Goodbye!");
    res.redirect("/campgrounds");
  });
};
