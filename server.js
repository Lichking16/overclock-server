/* OVERCLOCK relay server — pairs two players in a room and forwards messages
   between them (the host's browser runs the game). It ALSO serves the game page
   itself, so players just open this server's URL — no file to send around.
   Start:  node server.js   (listens on process.env.PORT or 8080) */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { WebSocketServer } = require("ws");

const PORT = process.env.PORT || 8080;
const rooms = new Map(); // code -> { host, guest }

function newCode() {
  let c;
  do { c = Math.random().toString(36).slice(2, 7).toUpperCase(); } while (rooms.has(c));
  return c;
}
function peerOf(room, sock) { return sock === room.host ? room.guest : room.host; }
function send(sock, obj) { if (sock && sock.readyState === 1) sock.send(JSON.stringify(obj)); }

// load the game page once at startup (the bundled single-file build)
let GAME = "";
try { GAME = fs.readFileSync(path.join(__dirname, "game.htm"), "utf8"); }
catch (e) { console.log("note: game.htm not found next to server.js — serving status text only"); }

// --- optional global stats via Upstash Redis REST (set env vars to enable) ---
const U_URL = process.env.UPSTASH_REDIS_REST_URL, U_TOK = process.env.UPSTASH_REDIS_REST_TOKEN;
const FACS = new Set(["syn","swm","melt","bas","zd","sng","ren","mech","carn","dem","cult","prph"]);
async function upstash(cmds) {
  if (!U_URL || !U_TOK) return null;
  try {
    const r = await fetch(U_URL.replace(/\/$/, "") + "/pipeline", {
      method: "POST",
      headers: { Authorization: "Bearer " + U_TOK, "content-type": "application/json" },
      body: JSON.stringify(cmds)
    });
    if (!r.ok) return null; return await r.json();
  } catch (e) { return null; }
}
function cors(res){res.setHeader("Access-Control-Allow-Origin","*");res.setHeader("Access-Control-Allow-Methods","GET,POST,OPTIONS");res.setHeader("Access-Control-Allow-Headers","content-type");}
function readBody(req){return new Promise(r=>{let b="";req.on("data",c=>{b+=c;if(b.length>4000)req.destroy();});req.on("end",()=>r(b));});}
function hToObj(a){const o={};if(Array.isArray(a))for(let i=0;i<a.length;i+=2)o[a[i]]=a[i+1];return o;}

const server = http.createServer(async (req, res) => {
  const url = (req.url || "/").split("?")[0];
  if (req.method === "OPTIONS") { cors(res); res.writeHead(204); res.end(); return; }
  if (url === "/health" || url === "/status") {
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("OVERCLOCK relay running. Rooms: " + rooms.size);
    return;
  }
  if (url === "/stats" && req.method === "GET") {
    cors(res);
    const out = await upstash([["HGETALL","appear"],["HGETALL","win"],["HGETALL","matchup"],["GET","total"]]);
    const body = { appear:{}, win:{}, matchup:{}, total:0, enabled: !!(U_URL && U_TOK) };
    if (out && Array.isArray(out)) {
      body.appear = hToObj(out[0] && out[0].result);
      body.win = hToObj(out[1] && out[1].result);
      body.matchup = hToObj(out[2] && out[2].result);
      body.total = parseInt((out[3] && out[3].result) || "0", 10) || 0;
    }
    res.writeHead(200, { "content-type": "application/json" }); res.end(JSON.stringify(body)); return;
  }
  if (url === "/stat" && req.method === "POST") {
    cors(res);
    const raw = await readBody(req); let m; try { m = JSON.parse(raw); } catch (e) { m = null; }
    if (m && FACS.has(m.winner) && FACS.has(m.loser)) {
      await upstash([["HINCRBY","appear",m.winner,1],["HINCRBY","appear",m.loser,1],["HINCRBY","win",m.winner,1],["HINCRBY","matchup",m.winner+":"+m.loser,1],["INCR","total"]]);
      res.writeHead(200, { "content-type": "application/json" }); res.end('{"ok":true}');
    } else { res.writeHead(400, { "content-type": "application/json" }); res.end('{"ok":false}'); }
    return;
  }
  if (GAME) {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-cache" });
    res.end(GAME); return;
  }
  res.writeHead(200, { "content-type": "text/plain" });
  res.end("OVERCLOCK relay running (game file not found). Rooms: " + rooms.size);
});

const wss = new WebSocketServer({ server });

wss.on("connection", (sock) => {
  sock.code = null; sock.isAlive = true;
  sock.on("pong", () => { sock.isAlive = true; });

  sock.on("message", (data) => {
    let m; try { m = JSON.parse(data); } catch (e) { return; }

    if (m.t === "create") {
      const code = newCode();
      rooms.set(code, { host: sock, guest: null });
      sock.code = code; sock.role = "host";
      send(sock, { t: "created", code });

    } else if (m.t === "join") {
      const code = (m.code || "").toUpperCase();
      const room = rooms.get(code);
      if (!room) { send(sock, { t: "error", msg: "Room not found. Check the code." }); return; }
      if (room.guest) { send(sock, { t: "error", msg: "That room is already full." }); return; }
      room.guest = sock; sock.code = code; sock.role = "guest";
      send(sock, { t: "joined" });
      send(room.host, { t: "peer-joined" });

    } else if (m.t === "relay") {
      const room = rooms.get(sock.code); if (!room) return;
      send(peerOf(room, sock), { t: "msg", payload: m.payload });
    }
  });

  sock.on("close", () => {
    const room = rooms.get(sock.code); if (!room) return;
    send(peerOf(room, sock), { t: "peer-left" });
    rooms.delete(sock.code);
  });
});

setInterval(() => {
  wss.clients.forEach((c) => {
    if (c.isAlive === false) return c.terminate();
    c.isAlive = false; try { c.ping(); } catch (e) {}
  });
}, 30000);

server.listen(PORT, () => console.log("OVERCLOCK relay server listening on port " + PORT));
