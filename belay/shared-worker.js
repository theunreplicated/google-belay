importScripts('lib/js/caps.js');


var station = undefined;

var workerInstID = newUUIDv4();
var workerServer = new CapServer(workerInstID);

var instToTunnel = Object.create(null);

function resolver(instID) {
  if (instID === workerInstID) { return workerServer.publicInterface; }
  if (instID in instToTunnel) { return instToTunnel[instID].sendInterface; }
  return null;
}

workerServer.setResolver(resolver);

var stationGenerator = workerServer.restore("http://localhost:9001/generate");

var pendingLaunches = Object.create(null);

function buildLauncher(openerCap) {
  return function(args) {
    var pending = {
      instID: args.instID,
      outpost: args.outpostData,
      isStation: args.isStation || false
    };
    var hash = '#' + newUUIDv4();
    pendingLaunches[hash] = pending;
    openerCap.post(args.url + hash);
  }
}

function launchStation(launchCap, openerCap) {
  launchCap.get(function(data) {
    buildLauncher(openerCap)({
      url: data.page.html,
      instID: newUUIDv4,
      outpostData: { info: data.info },
      isStation: true
    });
  });
}

self.addEventListener('connect', function(e) { 
  var iframeTunnel = new CapTunnel(e.ports[0]);
  iframeTunnel.setLocalResolver(resolver);
  iframeTunnel.setOutpostHandler(function(outpost) {
    instToTunnel[outpost.iframeInstID] = iframeTunnel;
    if (location.hash in pendingLaunches) {
      // client is an instance we are expecting
      var pending = pendingLaunches[location.hash];
      delete pendingLaunches[location.hash];
      if (pending.isStation) {
        pending.outpost.launch = buildLauncher(outpost.windowOpen);
        // note that this is the station
        // add a cap for launching from the station, closing over outpost.windowOpen
      }
      instToTunnel[pending.instID] = iframeTunnel;
      outpost.setUpClient.post(pending);
    }
    else {
      // client might want to become an instance or the station
      outpost.setUpClient.post({
        becomeInstance: workerServer.grant(function(launchCap) {
          stationCaps.newInstHandler.post({
            launchData: launchCap, // TODO(mzero): name?
            relaunch: workerServer.grant(buildLauncher(outpost.windowLocation))
          }) 
        }),
        becomeStation: workerServer.grant(function() {
          var openerCap = launch(outpost.windowLocation);
          outpost.localStorage.get(function(sto) {
            if (sto.stationLaunchCap) {
              launchStation(sto.stationLaunchCap, openerCap);
            }
            else {
              stationGenerator.get(function(launchCap) {
                sto.stationLaunchCap = launchCap;
                outpost.localStorage.put(sto, function() {
                  launchStation(sto.stationLaunchCap, openerCap);
                });
              });
            }
          });
        })
      })
    }
  });
});