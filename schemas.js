const Joi = require('joi');


module.exports.UserSchema = Joi.object({
    User: Joi.object({
        username: Joi.string().min(3).max(30).required(),
        email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required(),
        password: Joi.string().min(3).max(20).required(),
        bio: Joi.string().required(),
        Status : Joi.string().required()
    }).required()
});

module.exports.reviewSchema = Joi.object({
    post_id: Joi.string().required(),
    review: Joi.object({
        message : Joi.string().required()
    }).required()
})
