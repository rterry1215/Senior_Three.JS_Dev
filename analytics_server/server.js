var express = require("express");
var bodyParser = require("body-parser");
var http = require("http");
var { Pool } = require('pg')
var { performance } = require("perf_hooks");

var pool = process.env.DATABASE_URL? new Pool({
  connectionString: process.env.DATABASE_URL
}) : new Pool();

var tableName = process.env.TABLE_NAME;

if (!tableName){
  throw new Error("Table name is not defined via TABLE_NAME env variable.");
}

app = express();

app.use(bodyParser.text());
app.use(bodyParser.json({
  parameterLimit: 1000000,
  limit: '500mb',
  extended: true
}));

var onlineClients = {};

app.post("/hello", (req, res) => {
  var body = JSON.parse(req.body);
  var id = body.id;

  if (!id){
    res.sendStatus(204);
    return;
  }

  onlineClients[id] = {
    timeSpent: performance.now(),
    totalLoadTime: body.totalLoadTime,
    shaderLoadTime: body.shaderLoadTime,
    applicationJSONLoadTime: body.applicationJSONLoadTime,
    modeSwitchTime: body.modeSwitchTime,
    firstRendertime: body.firstRendertime,
    isMobile: body.isMobile,
    isIOS: body.isIOS,
    highPrecisionSupported: body.highPrecisionSupported,
    browser: body.browser
  };

  res.sendStatus(204);
});

app.post("/bye", (req, res) => {
  var body = JSON.parse(req.body);
  var id = body.id;
  var clientInfo = onlineClients[id];
  if (!clientInfo){
    return;
  }

  delete onlineClients[id];
  clientInfo.timeSpent = performance.now() - clientInfo.timeSpent;
  clientInfo.avgFPS = body.avgFPS;

  writeToDatabase(id, clientInfo);

  res.sendStatus(204);
});

app.use(express.static("public"));
server = http.Server(app);
var port = process.env.PORT || 8099;
server.listen(port);

console.log("Server listening port", port);

async function writeToDatabase(id, info){
  try {
    var insertQuery = "INSERT INTO @@X (id, total_load_time, shader_load_time, application_json_load_time, mode_switch_time, first_render_time, is_mobile, is_ios, highp_precision_supported, browser, time_spent, avg_fps) VALUES ('@@A', @@B, @@C, @@D, @@E, @@F, '@@G', '@@H', '@@I', '@@J', @@K, @@L);"
    insertQuery = insertQuery.replace("@@X", tableName)
                             .replace("@@A", id)
                             .replace("@@B", info.totalLoadTime || 0)
                             .replace("@@C", info.shaderLoadTime || 0)
                             .replace("@@D", info.applicationJSONLoadTime || 0)
                             .replace("@@E", info.modeSwitchTime || 0)
                             .replace("@@F", info.firstRendertime || 0)
                             .replace("@@G", info.isMobile? "T": "F")
                             .replace("@@H", info.isIOS? "T": "F")
                             .replace("@@I", info.highPrecisionSupported? "T": "F")
                             .replace("@@J", info.browser || "")
                             .replace("@@K", info.timeSpent || 0)
                             .replace("@@L", info.avgFPS || 0)
    await pool.query(insertQuery);
  }catch (err){
    console.log("DB ERR", err);
  }
}
