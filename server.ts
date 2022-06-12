var express = require("express");
var http = require("http");
var path = require("path");
var uuid = require("uuid");
var jwt = require("jsonwebtoken");
var dotenv = require("dotenv");
var cors = require("cors");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// app.use("/static", express.static(`${__dirname}/static`));

const server = http.createServer(app);

// starting index
app.locals.index = 100000000000;

app.get("/getRoomId", (req: any, res: any) => {
  app.locals.index++;
  let id = app.locals.index.toString(36);
  // res.redirect(`/${id}`);
  res.header("Access-Control-Allow-Origin", "*");

  console.log(id);
  res.send({
    id,
  });
});

app.get("/:roomId", (req: any, res: any) => {
  // res.sendFile(path.join(__dirname, "static/index.html"));
  // console.log(res);
});

let clients = {} as any;
let channels = {} as any;

app.get("/connect", auth, (req: any, res: any) => {
  if (req.headers.accept !== "text/event-stream") {
    return res.sendStatus(404);
  }

  // write the event stream headers
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders();

  // setup a client
  let client = {
    id: req.user.id,
    user: req.user,
    emit: (event: any, data: any) => {
      res.write(`id: ${uuid.v4()}\n`);
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    },
  };

  clients[client.id] = client;
  console.log(client);
  // emit the connected state
  client.emit("connected", { user: req.user });

  req.on("close", () => {
    disconnected(client);
    console.log("disconnected");
  });
});

function auth(req: any, res: any, next: any) {
  let token;
  if (req.headers.authorization) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.query.token) {
    token = req.query.token;
  }
  if (typeof token !== "string") {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.TOKEN_SECRET, (err: any, user: any) => {
    if (err) {
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
}

app.post("/access", (req: any, res: any) => {
  if (!req.body.username) {
    return res.sendStatus(403);
  }
  const user = {
    id: uuid.v4(),
    username: req.body.username,
  };

  const token = jwt.sign(user, process.env.TOKEN_SECRET, {
    expiresIn: "3600s",
  });
  return res.json(token);
});

app.post("/:roomId/join", (req: any, res: any) => {
  let roomId = req.params.roomId;
  console.log(roomId);
  if (channels[roomId] && channels[roomId][req.user.id]) {
    return res.sendStatus(200);
  }
  if (!channels[roomId]) {
    channels[roomId] = {};
  }
  console.log(channels);
  console.log(clients);

  for (let peerId in channels) {
    if (clients[peerId] && clients[req.user.id]) {
      clients[peerId].emit("add-peer", {
        peer: req.user,
        roomId,
        offer: false,
      });
      clients[req.user.id].emit("add-peer", {
        peer: clients[peerId].user,
        roomId,
        offer: true,
      });
    }
  }

  channels[roomId][req.user.id] = true;
  return res.sendStatus(200);
});

app.post("/relay/:peerId/:event", auth, (req: any, res: any) => {
  let peerId = req.params.peerId;
  if (clients[peerId]) {
    clients[peerId].emit(req.params.event, { peer: req.user, data: req.body });
  }
  return res.sendStatus(200);
});

function disconnected(client: any) {
  delete clients[client.id];
  for (let roomId in channels) {
    let channel = channels[roomId];
    if (channel[client.id]) {
      for (let peerId in channel) {
        channel[peerId].emit("remove-peer", { peer: client.user, roomId });
      }
      delete channel[client.id];
    }
    if (Object.keys(channel).length === 0) {
      delete channels[roomId];
    }
  }
}

server.listen(process.env.PORT || 8081, () => {
  console.log(`Started server on port ${server.address().port}`);
});
