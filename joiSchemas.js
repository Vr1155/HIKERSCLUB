const BaseJoi = require("joi");
const sanitizeHtml = require("sanitize-html");

// Writing our own escape html validator for escaping HTML inputs by hackers:

const extension = joi => ({
  // basic syntax for joi's user-defined validator is a mild nightmare:
  type: "string",
  base: joi.string(),
  messages: {
    "string.escapeHTML": "{{#label}} must not include HTML!"
  },
  rules: {
    // here is our function that validates html:
    escapeHTML: {
      validate(value, helpers) {
        const clean = sanitizeHtml(value, {
          // specifying what is allowed:
          // in this case, no html is allowed:
          allowedTags: [],
          allowedAttributes: {}
        });

        // if original input differs from the sanitized input,
        // return helpers.error which has the error message:
        if (clean !== value)
          return helpers.error("string.escapeHTML", { value });

        // else return the original input/sanitized input
        return clean;
      }
    }
  }
});

// extending joi with a user defined html sanitizer:
const Joi = BaseJoi.extend(extension);

// exporting joi schema for Server side data validation :

module.exports.campgroundSchemaJoi = Joi.object({
  campground: Joi.object({
    title: Joi.string().required().escapeHTML(),
    price: Joi.number().required().min(0),
    // image: Joi.string().required(),
    description: Joi.string().required().escapeHTML(),
    location: Joi.string().required().escapeHTML()
  }).required(),
  deleteImages: Joi.array()
});

module.exports.reviewSchemaJoi = Joi.object({
  review: Joi.object({
    rating: Joi.number().required().min(1).max(5),
    body: Joi.string().required().escapeHTML()
  }).required()
});
