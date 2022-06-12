// var express = require("express");
// var http = require("http");
// var ws = require("ws");
// var uuid = require("uuid");

// const app = express();

// app.locals.connections = [];

// const server = http.createServer(app);
// const wss = new ws.Server({ server });

// const broadcastConnections = () => {
//   let ids = app.locals.connections.map((c: any) => c._connId);
//   app.locals.connections.forEach((c: any) => {
//     c.send(JSON.stringify({ type: "ids", ids }));
//   });
// };

// wss.on("connection", (ws: any) => {
//   app.locals.connections.push(ws);
//   ws._connId = `conn-${uuid.v4()}`;

//   // send the local id for the connection
//   ws.send(JSON.stringify({ type: "connection", id: ws._connId }));

//   // send the list of connection ids
//   broadcastConnections();

//   ws.on("close", () => {
//     let index = app.locals.connections.indexOf(ws);
//     app.locals.connections.splice(index, 1);
//     ws.send(JSON.stringify({ type: "disconnect", id: ws._connId }));
//     // send the list of connection ids
//     broadcastConnections();
//   });

//   ws.on("message", (message: any) => {
//     for (let i = 0; i < app.locals.connections.length; i++) {
//       if (app.locals.connections[i] !== ws) {
//         app.locals.connections[i].send(message);
//       }
//     }
//   });
// });

// server.listen(process.env.PORT || 8081, () => {
//   console.log(`Started server on port ${server.address().port}`);
// });
