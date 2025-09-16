import express from 'express';
import path from 'path';
import { config } from 'dotenv';
import cors from 'cors';

import { createServer } from "http";
import Server from "socket.io";
import { socketOrderDelivery } from './Sockets/SocketOrderDelivery';
import { errorHandler } from './Middleware/ErrorHandler';

import routeAuth from './Router/Auth.routes';
import routerUser from './Router/User.routes';
import routerProduct from './Router/Product.routes';
import routerCategory from './Router/Category.routes';
import routerOrder from './Router/Order.routes';


config();

const app = express();

app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-token']
}));

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
socketOrderDelivery(io);

// Middleware para parsear JSON y URL encoded
app.use( express.json({ limit: '50mb' }) );
app.use( express.urlencoded({ extended: false, limit: '50mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        resp: true,
        msg: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api', routeAuth);
app.use('/api', routerUser);
app.use('/api', routerProduct);
app.use('/api', routerCategory);
app.use('/api', routerOrder);

// Static files
app.use( express.static( path.join( __dirname, 'Uploads/Profile' )));
app.use( express.static( path.join( __dirname, 'Uploads/Products' )));

// Error handling middleware (debe ir al final)
app.use(errorHandler);

export default httpServer;
