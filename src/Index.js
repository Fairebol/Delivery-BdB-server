import http from './App';


http.listen( process.env.APP_PORT, '0.0.0.0',() => console.log('Server on port ' + process.env.APP_PORT));