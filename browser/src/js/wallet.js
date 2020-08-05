// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const DomUtl = require('./ui/domutl.js').DomUtl;
const Timestamp = require('./moneysocket/utl/timestamp.js').Timestamp;
const WebsocketInterconnect = require(
    './moneysocket/socket/websocket.js').WebsocketInterconnect;
const WebsocketLocation = require(
    './moneysocket/beacon/location/websocket.js').WebsocketLocation;
const BeaconUi = require('./ui/beacon.js').BeaconUi;
const Role = require('./moneysocket/core/role.js').Role;

const UpstreamStatusUi = require('./ui/upstream_status.js').UpstreamStatusUi;
const DownstreamStatusUi = require(
    './ui/downstream_status.js').DownstreamStatusUi;
const RequestProvider = require(
    "./moneysocket/core/message/request/provider.js").RequestProvider;


///////////////////////////////////////////////////////////////////////////////

const MODES = new Set(["DISCONNECTED",
                       "MAIN",
                       "SEND",
                       "RECEIVE",
                      ]);


class WalletUi {
    constructor(div) {
        this.parent_div = div;
        this.my_div = null;
        this.spendable_div = null;
        this.provider_role_div = null;
        this.consumer_role_div = null;
        this.provider_counterpart_div = null;
        this.mode = null;

        this.upstream_ui = null;
        this.downstream_ui = null;

        this.provider_msats = 1000000;
        this.provide_msats = 500000;


        this.balance_div = null;
        this.slider_input = null;

        this.send_input_div = null;

    }

    draw(style) {
        this.my_div = document.createElement("div");
        this.my_div.setAttribute("class", style);

        this.wallet_mode_div = DomUtl.emptyDiv(this.my_div);
        this.wallet_mode_div.setAttribute("class", "wallet-mode-output");

        DomUtl.drawBr(this.my_div);
        this.upstream_ui = new UpstreamStatusUi(this.my_div, "Upstream");
        this.upstream_ui.draw("upstream-status-left");
        this.downstream_ui = new DownstreamStatusUi(this.my_div, "Downstream");
        this.downstream_ui.draw("downstream-status-right");

        this.switchMode("MAIN");

        this.parent_div.appendChild(this.my_div);
    }

    switchMode(new_mode) {
        console.assert(MODES.has(new_mode));
        this.mode = new_mode;
        DomUtl.deleteChildren(this.wallet_mode_div);

        if (new_mode == "DISCONNECTED") {
            var t = DomUtl.drawText(this.wallet_mode_div,
                "Please connect to downstream Moneysocket wallet provider.");
            t.setAttribute("style", "padding:5px;");
        } else if (new_mode == "MAIN") {
            this.balance_div = DomUtl.emptyDiv(this.wallet_mode_div);
            DomUtl.drawBigBalance(this.balance_div, this.provide_msats);
            DomUtl.drawBr(this.wallet_mode_div);
            DomUtl.drawButton(this.wallet_mode_div, "Manual Send",
                (function() {
                    this.switchMode("SEND");
                }).bind(this));
            DomUtl.drawBr(this.wallet_mode_div);
            DomUtl.drawBr(this.wallet_mode_div);
            DomUtl.drawButton(this.wallet_mode_div, "Manual Receive",
                (function() {
                    this.switchMode("RECEIVE");
                }).bind(this));
            DomUtl.drawBr(this.wallet_mode_div);
            DomUtl.drawBr(this.wallet_mode_div);
            var t = DomUtl.drawText(this.wallet_mode_div,
                                    "Provide Upstream Balance:");
            t.setAttribute("style", "padding:5px;");
            var s = DomUtl.drawSlider(this.wallet_mode_div);
            DomUtl.drawBr(this.wallet_mode_div);
            this.slider_input = s.firstChild;
            this.slider_input.oninput = (function () {
                this.updateProvideMsats();
            }.bind(this));
        } else if (new_mode == "SEND") {
            this.balance_div = DomUtl.emptyDiv(this.wallet_mode_div);
            DomUtl.drawBigBalance(this.balance_div, this.provide_msats);
            DomUtl.drawBr(this.wallet_mode_div);

            var t = DomUtl.drawText(this.wallet_mode_div, "Provide Bolt11");
            t.setAttribute("style", "padding:5px;");
            this.input_div = DomUtl.drawTextInput(this.wallet_mode_div, "");
            DomUtl.drawButton(this.wallet_mode_div, "Scan QR",
                (function() {
                    console.log("qr scan not implemented yet");
                }).bind(this));
            DomUtl.drawBr(this.wallet_mode_div);
            DomUtl.drawBr(this.wallet_mode_div);
            DomUtl.drawButton(this.wallet_mode_div, "Back",
                (function() {
                    this.switchMode("MAIN");
                }).bind(this));

        } else if (new_mode == "RECEIVE") {
            this.balance_div = DomUtl.emptyDiv(this.wallet_mode_div);
            DomUtl.drawBigBalance(this.balance_div, this.provide_msats);
            DomUtl.drawBr(this.wallet_mode_div);
            var t = DomUtl.drawText(this.wallet_mode_div, "Request sats:");
            t.setAttribute("style", "padding:5px;");
            this.input_div = DomUtl.drawTextInput(this.wallet_mode_div, "0");
            this.input_div.firstChild.setAttribute("size", "8");
            DomUtl.drawBr(this.wallet_mode_div);
            DomUtl.drawButton(this.wallet_mode_div, "Back",
                (function() {
                    this.switchMode("MAIN");
                }).bind(this));
        }
    }

    updateProvideMsats() {
        var slider_val = this.slider_input.value;
        this.provide_msats = this.provider_msats * (slider_val / 100);
        DomUtl.deleteChildren(this.balance_div);
        DomUtl.drawBigBalance(this.balance_div, this.provide_msats);
    }

    ///////////////////////////////////////////////////////////////////////////

    updateProviderPing(ping_time) {
        this.downstream_ui.updatePingTime(ping_time);
    }

    updateProviderMsats(msats) {
        this.provider_msats = msats;
        this.updateProvideMsats();
        this.downstream_ui.updateProviderMsats(msats);
    }

    ///////////////////////////////////////////////////////////////////////////

    providerConnected() {
        this.upstream_ui.updateConnected();
    }
    providerDisconnected() {
        this.upstream_ui.updateDisconnected();
    }

    consumerConnected() {
        this.downstream_ui.updateConnected();
    }
    consumerDisconnected() {
        this.downstream_ui.updateDisconnected();
    }
}

///////////////////////////////////////////////////////////////////////////////

class WebWalletApp {
    constructor() {
        this.parent_div = document.getElementById("ui");
        this.my_div = null;
        this.wallet_ui = null;
        this.provider_ui = null;
        this.consumer_ui = null;

        this.provider_role = null;
        this.consumer_role = null;

        this.provider_socket = null;
        this.consumer_socket = null;

        this.ping_interval = null;
        this.outstanding_pings = {};

        this.wi = new WebsocketInterconnect(this);
    }

    drawWalletAppUi() {
        this.my_div = document.createElement("div");
        this.my_div.setAttribute("class", "bordered");
        DomUtl.drawTitle(this.my_div, "Moneysocket Web Wallet", "h2");

        this.wallet_ui = new WalletUi(this.my_div);
        this.wallet_ui.draw("center");

        DomUtl.drawBr(this.my_div);
        var wtitle = "Connect to an Upstream Moneysocket Consumer";
        this.provider_ui = new BeaconUi(this.my_div, wtitle, this, "provider");
        this.provider_ui.draw("left");

        var stitle = "Connect to my Downstream Moneysocket Provider";
        this.consumer_ui = new BeaconUi(this.my_div, stitle, this, "consumer");
        this.consumer_ui.draw("right");
        DomUtl.drawBr(this.my_div);
        DomUtl.drawBr(this.my_div);

        this.parent_div.appendChild(this.my_div);
    }

    //////////////////////////////////////////////////////////////////////////

    sendPing() {
        console.log("ping");
        var msg = this.consumer_role.sendPing();
        var req_ref_uuid = msg['request_uuid'];
        this.outstanding_pings[req_ref_uuid] = Timestamp.getNowTimestamp();
    }

    handlePong(msg) {
        var req_ref_uuid = msg['request_reference_uuid'];
        if (! (req_ref_uuid in this.outstanding_pings)) {
            console.error("got pong with unknown request uuid");
            return;
        }
        var start_time = this.outstanding_pings[req_ref_uuid];
        var ping_time = (Timestamp.getNowTimestamp() - start_time) * 1000;
        this.wallet_ui.updateProviderPing(Math.round(ping_time));
    }

    startPinging() {
        console.log("ping starting");
        this.ping_interval = setInterval(
            function() {
                this.sendPing();
            }.bind(this), 3000);
        this.sendPing();
    }

    stopPinging() {
        if (this.ping_interval == null) {
            return;
        }
        console.log("ping stopping");
        clearInterval(this.ping_interval);
        this.ping_interval == null;
    }

    //////////////////////////////////////////////////////////////////////////
    // Role callbacks:
    //////////////////////////////////////////////////////////////////////////

    notifyPongHook(msg, role) {
        this.handlePong(msg);
    }

    notifyRendezvousBecomingReadyHook(msg, role) {
        console.log("becoming ready");
        if (role.name == "provider") {
            console.log("becoming ready 1");
            this.provider_ui.switchMode("WAITING_FOR_RENDEZVOUS");
            this.wallet_ui.providerDisconnected();
        } else if (role.name == "consumer") {
            console.log("becoming ready 2");
            this.consumer_ui.switchMode("WAITING_FOR_RENDEZVOUS");
            this.wallet_ui.consumerDisconnected();
            this.stopPinging()
        } else {
            console.log("unknown cb param");
        }
    }

    notifyRendezvousHook(msg, role) {
        if (role.name == "provider") {
            //this.provider_ui.switchMode("CONNECTED");
            //this.wallet_ui.providerConnected();
            this.provider_ui.switchMode("WAITING_FOR_CONSUMER");
        } else if (role.name == "consumer") {
            //this.consumer_ui.switchMode("CONNECTED");
            //this.wallet_ui.consumerConnected();
            this.startPinging();
            // TODO request provider
            this.provider_ui.switchMode("REQUESTING_PROVIDER");
            role.socket.write(RequestProvider());
        } else {
            console.log("unknown cb param");
        }
    }

    notifyProviderBecomingReadyHook(msg, role) {
        if (role.name == "provider") {
            return;
        } else if (role.name == "consumer") {
            this.consumer_ui.switchMode("WAITING_FOR_PROVIDER");
            //this.wallet_ui.consumerConnected();
            //this.startPinging();
        } else {
            console.log("unknown cb param");
        }
    }

    notifyProviderHook(msg, role) {
        if (role.name == "provider") {
            return;
        } else if (role.name == "consumer") {
            this.consumer_ui.switchMode("CONNECTED");
            this.wallet_ui.consumerConnected();
            this.startPinging();
        } else {
            console.log("unknown cb param");
        }
    }

    requestProviderHook(msg, role) {
        var req_ref_uuid = msg['request_uuid'];
        if (role.name == "provider") {

            // if cnsumer is connected, notify provider
            // TODO
            return NotifyProvider( );
            // else notifiy becoming ready

        } else if (role.name == "consumer") {
            return NotifyError("no provider here", req_ref_uuid);
        } else {
            console.log("unknown cb param");
        }
    }


    registerHooks(role) {
        console.log("REGISTERING");
        var hooks = {
            'NOTIFY_RENDEZVOUS': function (msg) {
                this.notifyRendezvousHook(msg, role);
            }.bind(this),
            'NOTIFY_RENDEZVOUS_BECOMING_READY': function (msg) {
                this.notifyRendezvousBecomingReadyHook(msg, role);
            }.bind(this),
            'NOTIFY_PONG': function (msg) {
                this.notifyPongHook(msg, role);
            }.bind(this),
            'NOTIFY_PROVIDER': function (msg) {
                this.notifyProviderHook(msg, role);
            }.bind(this),
            'NOTIFY_PROVIDER_BECOMING_READY': function (msg) {
                this.notifyProviderBecomingReadyHook(msg, role);
            }.bind(this),
            'REQUEST_PROVIDER': function (msg) {
                this.notifyProviderHook(msg, role);
            }.bind(this),
        }
        role.registerAppHooks(hooks);
    }

    //////////////////////////////////////////////////////////////////////////
    // WebsocketInterconnect callbacks:
    //////////////////////////////////////////////////////////////////////////

    newSocket(socket, cb_param) {
        // interconnect announcing new socket
        console.log("got new socket: " + socket.toString());
        console.log("cb_param: " + cb_param);

        var role_info = cb_param;
        var beacon = role_info['beacon']
        var rid = beacon.shared_seed.deriveRendezvousId();
        socket.registerSharedSeed(beacon.shared_seed);

        if (role_info['role'] == "provider") {
            this.provider_socket = socket;
            this.provider_ui.switchMode("REQUESTING_RENDEZVOUS");
            this.provider_role = new Role("provider");
            this.provider_role.addSocket(socket);
            this.registerHooks(this.provider_role);
            this.provider_role.startRendezvous(rid);
        } else if (role_info['role'] == "consumer") {
            this.consumer_socket = socket;
            this.consumer_ui.switchMode("REQUESTING_RENDEZVOUS");
            this.consumer_role = new Role("consumer");
            this.consumer_role.addSocket(socket);
            this.registerHooks(this.consumer_role);
            this.consumer_role.startRendezvous(rid);
        } else {
            console.log("unknown cb param");
        }
    }

    socketClose(socket) {
        console.log("got socket close: " + socket.toString());
        if ((this.provider_socket != null) &&
            (socket.uuid == this.provider_socket.uuid))
        {
            this.provider_socket = null;
            this.provider_role = null;
            this.provider_ui.switchMode(this.provider_ui.return_mode);
            this.wallet_ui.providerDisconnected();
            this.stopPinging()
        }
        else if ((this.consumer_socket != null) &&
                 (socket.uuid == this.consumer_socket.uuid))
        {
            this.consumer_socket = null;
            this.consumer_role = null;
            this.consumer_ui.switchMode(this.consumer_ui.return_mode);
            this.wallet_ui.consumerDisconnected();
            this.stopPinging()
        } else {
            console.log("got unknown socket closed");
        }
    }

    //////////////////////////////////////////////////////////////////////////
    // BeaconUI callbacks:
    //////////////////////////////////////////////////////////////////////////

    connect(beacon, cb_param) {
        // BeaconUi calling in to initiate connection

        var location = beacon.locations[0];
        if (cb_param == "provider") {
            if (! (location instanceof WebsocketLocation)) {
                this.provider_ui.switchMode("CONNECTION_FAILED");
                return;
            }
            var url = location.toWsUrl();
            var role_info = {'role':   'provider',
                             'beacon': beacon};
            console.log("connect provider: " + url);
            this.provider_ui.switchMode("CONNECTING_WEBSOCKET");
            this.wi.connect(location, role_info);
        } else if (cb_param == "consumer") {
            if (! (location instanceof WebsocketLocation)) {
                this.consumer_ui.switchMode("CONNECTION_FAILED");
                return;
            }
            var role_info = {'role':   'consumer',
                             'beacon': beacon};
            var url = location.toWsUrl();
            console.log("connect consumer: " + url);
            this.consumer_ui.switchMode("CONNECTING_WEBSOCKET");
            this.wi.connect(location, role_info);
        } else {
            console.log("unknown cb_param: " + cb_param);
        }
    }

    disconnect(cb_param) {
        if (cb_param == "provider") {
            console.log("disconnect provider");
            if (this.provider_socket != null) {
                this.provider_socket.close();
            }
        } else if (cb_param == "consumer") {
            console.log("disconnect consumer");
            if (this.consumer_socket != null) {
                this.consumer_socket.close();
            }
        } else {
            console.log("unknown cb_param: " + cb_param);
        }
    }
}

window.app = new WebWalletApp();


//////////////////////////////////////////////////////////////////////////
// some random test stuff:
//////////////////////////////////////////////////////////////////////////

const SharedSeed = require('./moneysocket/beacon/shared_seed.js').SharedSeed;
const  RequestRendezvous = require(
    './moneysocket/core/message/request/rendezvous.js').RequestRendezvous;
const  RequestPing = require(
    './moneysocket/core/message/request/ping.js').RequestPing;
const  MessageReceiver = require(
    './moneysocket/core/message/receiver.js').MessageReceiver;
const  MoneysocketCrypt = require(
    './moneysocket/core/message/crypt.js').MoneysocketCrypt;
const BinUtl = require('./moneysocket/utl/bin.js').BinUtl;

function smokeTest() {
    var ss = new SharedSeed();
    var rid = ss.deriveRendezvousIdHex();
    var rr = new RequestRendezvous(rid);
    var rrj = rr.toJson();
    console.log("rrj: " + rrj);
    var [rr2, err] = MessageReceiver.fromText(rrj);
    console.log("err: " + err);
    console.log("rr2: " + rr2);
    var rr2j = rr2.toJson();
    console.log("rr2j: " + rr2j);

    var rp = new RequestPing();
    var rpj = rp.toJson();
    console.log("rpj: " + rrj);
    var [rp2, err] = MessageReceiver.fromText(rpj);
    console.log("err: " + err);
    console.log("rp2: " + rp2);
    var rp2j = rp2.toJson();
    console.log("rp2j: " + rp2j);

    var encoded = MoneysocketCrypt.wireEncode(rp, ss);
    console.log("rp encoded: " + BinUtl.b2h(encoded));

    var [dm, err] = MoneysocketCrypt.wireDecode(encoded, ss);
    console.log("err: " + err);
    console.log("dm: " + dm);



    var pyss = SharedSeed.fromHexStr("47598990672ba514d473d72af4549e1c");
    var pytxt = "0eae9d39b1d1a8d2dc48a1bb662d0f3e0a5cd472494206e3fb6b3726f07ea1ae1f1914221e57efc7501a7d77a9c1f19cbd229d6c966c883076fa203889a41911cbbe8385afb204f602d1cba50c7546cb96dc058e2b87cab503161958bb8787ea2c324f99a5dd549d984a048d7a3f5066203bb68eb9906314a1679a9cf1de8b2ce78d289a93b9ec2c17954ac0eebd44eb988e1e0581256878be88d331bd93558cda0002bfc199edf0c66dcf3cb1d2c8a5014a2eec816be35dcfbb6e13e4130c1a7bd4c75da067fcde2956752c863d0f756636a7f3ab29bc212ef8c2599a4541bb";

    var pybin = BinUtl.h2b(pytxt);
    var [dm, err] = MoneysocketCrypt.wireDecode(pybin, pyss);
    console.log("py err: " + err);
    console.log("pydm: " + dm.toJson());

}

function drawFirstUi() {
    window.app.drawWalletAppUi()

    //smokeTest();
}

window.addEventListener("load", drawFirstUi());
