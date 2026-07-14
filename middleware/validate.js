function validate(schema, source = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => issue.message);
      return res.status(400).json({ error: errors.join(", ") });
    }
    req[source] = result.data;
    next();
  };
}

module.exports = validate;
