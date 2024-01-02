const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next))
      .catch(e => res.status(e.statusCode).json(e));
  };
};

export { asyncHandler };