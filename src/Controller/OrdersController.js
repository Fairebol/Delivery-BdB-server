import { response } from 'express';
import pool from '../Database/mysql';
import { Preference } from 'mercadopago';
import client from '../config/mercadopago';

export const addNewOrders = async (req, res = response ) => {
    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const { uidAddress, total, typePayment,  products } = req.body;

        const orderdb = await pool.query('INSERT INTO orders (client_id, address_id, amount, pay_type) VALUES (?,?,?,?)', [ req.uid, uidAddress, total, typePayment ]);

        const items = products.map(o => ({
            title: o.name || 'Producto',
            quantity: Number(o.quantity),
            unit_price: Number(o.price),
            currency_id: 'ARS',
        }));
        
        const preference = new Preference(client);
        const preferenceData = {
            body: {
                items: items,
                external_reference: orderdb.insertId.toString(),
                auto_return: 'all',
                notification_url: `${process.env.BACKEND_URL}/api/webhook/mercadopago`,
                payer: {
                    name: req.userName || 'Cliente',
                    email: req.userEmail || 'cliente@ejemplo.com',
                },
                metadata: {
                    order_id: orderdb.insertId,
                    user_id: req.uid
                }
            }
        };

        const preferenceResult = await preference.create(preferenceData);

        for (const o of products) {
            await connection.query(
                'INSERT INTO orderDetails (order_id, product_id, quantity, price) VALUES (?,?,?,?)',
                [orderdb.insertId, o.uidProduct, o.quantity, o.quantity * o.price]
            );
        }

        await connection.commit();

        res.json({
            resp: true,
            msg : 'Nueva Orden creada',
            preferenceId: preferenceResult.id,
            initPoint: preferenceResult.init_point
        });

    } catch (e) {
        if (connection) await connection.rollback();
        return res.status(500).json({
            resp: false,
            msg: e.message
        });
    } finally {
        if (connection) connection.release();
    }

}

export const getOrdersByStatus = async (req, res = response ) => {

    try {

        const ordersdb = await pool.query(`CALL SP_ALL_ORDERS_STATUS(?);`, [ req.params.statusOrder ]);

        res.json({
            resp: true,
            msg : 'Orders by ' + req.params.statusOrder,
            ordersResponse : ordersdb[0]
        });
        
    } catch (e) {
        return res.status(500).json({
            resp: false,
            msg : e
        });
    }

}

export const getDetailsOrderById = async ( req, res = response ) => {

    try {

        const detailOrderdb = await pool.query(`CALL SP_ORDER_DETAILS(?);`, [ req.params.idOrderDetails ]);

        res.json({
            resp: true,
            msg : 'Order details by ' + req.params.idOrderDetails,
            detailsOrder: detailOrderdb[0]
        });
        
    } catch (e) {
        return res.status(500).json({
            resp: false,
            msg : e
        });
    }

}

export const updateStatusToDispatched = async ( req, res = response ) => {

    try {

        const { idDelivery, idOrder } = req.body;

        await pool.query('UPDATE orders SET status = ?, delivery_id = ? WHERE id = ?', [ 'DISPATCHED', idDelivery, idOrder ]);

        res.json({
            resp: true,
            msg : 'Order DISPATCHED'
        });
        
    } catch (e) {
        return res.status(500).json({
            resp: false,
            msg : e
        });
    }

}

export const getOrdersByDelivery = async ( req, res = response ) => {

    try {

        const ordersDeliverydb = await pool.query(`CALL SP_ORDERS_BY_DELIVERY(?,?);`, [ req.uid, req.params.statusOrder ]);

        res.json({
            resp: true,
            msg : 'All Orders By Delivery',
            ordersResponse : ordersDeliverydb[0]
        });
        
    } catch (e) {
        return res.status(500).json({
            resp: false,
            msg : e
        });
    }

}

export const updateStatusToOntheWay = async ( req, res = response ) => {

    try {

        const { latitude, longitude } = req.body;

        await pool.query('UPDATE orders SET status = ?, latitude = ?, longitude = ? WHERE id = ?', ['ON WAY', latitude, longitude, req.params.idOrder ]);

        res.json({
            resp: true,
            msg : 'ON WAY'
        });
        
    } catch (e) {
        return res.status(500).json({
            resp: false,
            msg : e
        });
    }

}

export const updateStatusToDelivered = async ( req, res = response ) => {

    try {

        await pool.query('UPDATE orders SET status = ? WHERE id = ?', ['DELIVERED', req.params.idOrder ]);

        res.json({
            resp: true,
            msg : 'ORDER DELIVERED'
        });
        
    } catch (e) {
        return res.status(500).json({
            resp: false,
            msg : e
        });
    }

}

export const receiveWebhook = async (req, res = response) => {
    try {
        // MercadoPago envía los datos como query parameters
        const { topic, id } = req.query;
        
        if (topic === 'payment') {
            await connection.query(`UPDATE orders SET status = RECEIVED WHERE ${req.id} = ${req.uid};` );
            
            const paymentId = id;
            // Lógica para verificar el pago y actualizar la orden
            
            res.status(200).send('OK');
        } else {
            res.status(200).send('OK');
        }
    } catch (e) {
        console.error('Error en webhook:', e);
        res.status(500).send('Error');
    }

    
}

export const checkPaymentStatus = async (req, res = response) => {
    try {
        const { preferenceId } = req.params;
        
        // Aquí deberías consultar el estado del pago en MercadoPago
        // o verificar el estado en tu base de datos
        const orderdb = await pool.query('SELECT status FROM orders WHERE preference_id = ?', [preferenceId]);
        
        if (orderdb.length > 0) {
            res.json({
                resp: true,
                status: orderdb[0].status,
                preferenceId: preferenceId
            });
        } else {
            res.status(404).json({
                resp: false,
                msg: 'Orden no encontrada'
            });
        }
        
    } catch (e) {
        return res.status(500).json({
            resp: false,
            msg: e.message
        });
    }
}