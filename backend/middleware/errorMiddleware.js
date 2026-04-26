const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);

    if (process.env.NODE_ENV !== 'production') {
        console.error(err.stack);
    }

    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
        statusCode = 400;
        const messages = Object.values(err.errors).map(val => val.message);
        return res.status(statusCode).json({
            message: messages.join(', '),
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }

    // Handle Mongoose duplicate key errors
    if (err.code === 11000) {
        statusCode = 400;
        const field = Object.keys(err.keyValue)[0];
        return res.status(statusCode).json({
            message: `Duplicate value for ${field}`,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }

    // Handle Mongoose CastError (invalid ObjectId)
    if (err.name === 'CastError') {
        statusCode = 400;
        return res.status(statusCode).json({
            message: `Invalid ${err.path}: ${err.value}`,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }

    res.status(statusCode).json({
        message: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

module.exports = { errorHandler };
