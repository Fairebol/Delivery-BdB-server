import { response } from 'express';
import bcrypt from 'bcrypt';
import pool from '../Database/mysql2';
import { generateJsonWebToken } from '../Lib/JwToken';

export const loginController = async ( req, res = response ) => {

    try {

        const { email, password } = req.body;
        console.log(req.body);
        const validatedEmail = await pool.query('SELECT email FROM users WHERE email = ?', [ email ]);

        if( validatedEmail.length == 0 ){
            return res.status(400).json({
                resp: false,
                msg : 'Wrong Credentials'
            });
        }

        const userdb = await pool.query(`
            SELECT id, users, email, password, rol_id, notification_token 
            FROM users WHERE email = ?
        `, [email]);

        const user = userdb[0];

        if( !await bcrypt.compareSync( password, user.password )){
            return res.status(401).json({
                resp: false,
                msg : 'Wrong Credentials'
            }); 
        }

        let token = await generateJsonWebToken( user.id );

        res.json({
            resp: true,
            msg : 'Bienvenido a bien de barrio',
            user: {
                uid: user.id,
                username: user.users,
                email: user.email,
                rol_id: user.rol_id,
                notification_token: user.notification_token
            },
            token
        });


    } catch (e) {
        return res.status(500).json({
            resp: false,
            msg : e
        });
    }


}


export const renewTokenLogin = async ( req, res = response ) => {

    try {

        const token = await generateJsonWebToken( req.uid );

        const userdb = await pool.query(`CALL SP_RENEWTOKENLOGIN(?);`, [ req.uid ]);

        const user = userdb[0][0];
        
        res.json({
            resp: true,
            msg : 'Bienvenido a Bien de Barrio',
            user: {
                uid: user.id,
                username: user.users,
                email: user.email,
                rol_id: user.rol_id,
                notification_token: user.notification_token
            },
            token
        });
        
    } catch (e) {
        res.status(500).json({
            resp: false,
            msg : e
        });
    }

}
