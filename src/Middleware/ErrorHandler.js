export const errorHandler = (err, req, res, next) => {
    console.error('Error occurred:', err);
    
    // Database connection errors
    if (err.code === 'ECONNREFUSED') {
        return res.status(503).json({
            resp: false,
            msg: 'Database connection failed. Please try again later.'
        });
    }
    
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            resp: false,
            msg: 'Invalid token'
        });
    }
    
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            resp: false,
            msg: 'Token expired'
        });
    }
    
    // MySQL errors
    if (err.code === 'ER_NO_SUCH_TABLE') {
        return res.status(500).json({
            resp: false,
            msg: 'Database table not found'
        });
    }
    
    // Default error
    return res.status(500).json({
        resp: false,
        msg: 'Internal server error'
    });
};

export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
