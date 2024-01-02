import { validationResult } from 'express-validator';
import { ApiError } from './ApiError.js';

const validate = (validations) => async (req, res, next) => {
  await Promise.all(validations.map((validation) => validation.run(req)));

  const errors = validationResult(req);

  if (errors.isEmpty()) {
    next();
  } else {
    res
      .status(400).json(new ApiError(401, errors.array()[0].msg, errors.array()));
  }
};

export default validate;
