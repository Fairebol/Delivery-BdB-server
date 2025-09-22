import mysql from 'mysql2';
import { promisify } from 'util';

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: "",
    database: 'delivery'
});

pool.getConnection((err, connection) => {

    if( err ){
        if( err.code === 'PROTOCOL_CONNECTION_LOST' ) {
            console.log('DATABASE CONNECTION WAS CLOSED');
            console.error('Error details:', err);
        }
        if( err.code === 'ER_CON_COUNT_ERROR' ) {
            console.log('DATABASE HAS TO MANY CONNECTIONS');
            console.error('Error details:', err);
        }
        if( err.code === 'ECONNREFUSED' ) {
            console.log('DATABASE CONNECTION WAS REFUSED - Make sure MySQL is running');
            console.error('Error details:', err);
        }
        console.error('Database connection failed:', err);
        return;
    }

    if( connection ) {
        connection.release();
        console.log('DataBase is connected to '+ process.env.DB_DATABASE);
    }
    
    return;
});

pool.query = promisify( pool.query );


export default pool;
