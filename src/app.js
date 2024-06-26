const express = require('express'),
    bodyParser = require('body-parser'),
    logger = require('./middlewares/api.request.logger.middleware'),
    cors = require('cors'),
    helmet = require('helmet'),
    rateLimit = require('express-rate-limit'),
    errorHandler = require('./utils/error.handler.util'),
    passport = require('passport'),
    session = require('express-session'),
    { sessionSecret } = require('./config/environment.variables.config'),
    { useGoogleStrategy } = require('./config/passport');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false
});

const app = express();

app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
}));

useGoogleStrategy();
app.use(passport.initialize());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({
    origin: 'http://localhost:3000'
}));
app.use(helmet());
app.use(limiter);

//Rules 
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );

    if (req.method == "OPTIONS") {
        res.header("Access-Control-Allow-Methods", "PUT, POST, DELETE, GET");
        return res.status(200).json({});
    }

    next();
});

// API Request Logger
app.use(logger);

//Routes
const authRoutes = require('./routes/auth.route'),
    taskRoutes = require('./routes/task.route');

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

//Error handler
app.use(errorHandler);

//Not found route 404
app.use((req, res) => {
    const error = new Error("Not found");

    res.status(404).json({
        message: error.message,
    });
});

module.exports = app;