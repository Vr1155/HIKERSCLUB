const asyncCatcher = func => {
  return (req, res, next) => {
    func(req, res, next).catch(next);
    // if any errors thrown by func,
    // it will be caught by catch block and its error obj will be passed to next function.
  };
};

module.exports = asyncCatcher;
