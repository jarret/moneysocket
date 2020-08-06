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
const RequestInvoice = require(
    "./moneysocket/core/message/request/invoice.js").RequestInvoice;
const RequestPay = require(
    "./moneysocket/core/message/request/pay.js").RequestPay;



///////////////////////////////////////////////////////////////////////////////

const MODES = new Set(["BOTH_DISCONNECTED",
                       "MY_WALLET_DISCONNECTED",
                       "SELLER_DISCONNECTED",
                       "OPERATE",
                      ]);

const GOOD_OPINIONS = new Set(["Bullish",
                               "Bearish",
                              ]);


class BuyerUi {
    constructor(div, app) {
        this.parent_div = div;
        this.app = app;
        this.my_div = null;
        this.mode = null;
        this.balance_div = null;
        this.start_stop_div = null;
        this.log = null;

        this.available_msats = 0;
        this.seller_consumer_connected = false;
        this.my_seller_connected = false;
        this.buying_running = false;
    }

    draw(style) {
        this.my_div = document.createElement("div");
        this.my_div.setAttribute("class", style)

        this.buyer_mode_div = DomUtl.emptyDiv(this.my_div);
        this.buyer_mode_div.setAttribute("class", "app-mode-output");

        this.seller_ui = new DownstreamStatusUi(this.my_div, "Seller");
        this.seller_ui.draw('downstream-status-left');
        this.my_ui = new DownstreamStatusUi(this.my_div, "My Wallet");
        this.my_ui.draw('downstream-status-right');

        this.switchMode("BOTH_DISCONNECTED");

        this.parent_div.appendChild(this.my_div);
    }

    switchMode(new_mode) {
        console.assert(MODES.has(new_mode));
        if (this.mode == new_mode) {
            return;
        }
        this.mode = new_mode;
        DomUtl.deleteChildren(this.buyer_mode_div);
        console.log("new mode");
        if (new_mode == "BOTH_DISCONNECTED") {
            var t = DomUtl.drawText(this.buyer_mode_div,
                "Please connect to downstream Moneysocket wallet provider.");
            t.setAttribute("style", "padding:5px;");
        } else if (new_mode == "SELLER_DISCONNECTED") {
            this.balance_div = DomUtl.emptyDiv(this.buyer_mode_div);
            DomUtl.drawBigBalance(this.balance_div, this.available_msats);
            DomUtl.drawBr(this.buyer_mode_div);
            DomUtl.drawBr(this.buyer_mode_div);
            var t = DomUtl.drawText(this.buyer_mode_div,
                "Connect to upstream seller app provider");
            t.setAttribute("style", "padding:5px;");
        } else if (new_mode == "MY_WALLET_DISCONNECTED") {
            var t = DomUtl.drawText(this.buyer_mode_div,
                "Connect to downstream provider");
            t.setAttribute("style", "padding:5px;");
        } else if (new_mode == "OPERATE") {
            this.balance_div = DomUtl.emptyDiv(this.buyer_mode_div);
            DomUtl.drawBigBalance(this.balance_div, this.available_msats);

            this.start_stop_div = DomUtl.emptyDiv(this.buyer_mode_div);
            DomUtl.drawButton(this.start_stop_div, "Start",
                (function() {
                    this.startBuyingOpinions()
                }).bind(this));
            DomUtl.drawBr(this.buyer_mode_div);
            //DomUtl.drawButton(this.buyer_mode_div, "Stop",
            //    (function() {this.stopBuyingOpinions()}).bind(this));

            this.log = DomUtl.drawLog(this.buyer_mode_div);

        } else {
            console.error("unhandled mode");
        }
    }

    switchToRightMode() {
        if (! this.seller_consumer_connected && ! this.my_consumer_connected) {
            this.switchMode("BOTH_DISCONNECTED");
        } else if (! this.seller_consumer_connected &&
                   this.my_consumer_connected) {
            this.switchMode("SELLER_DISCONNECTED");
        } else if (this.seller_consumer_connected &&
                   ! this.my_consumer_connected) {
            this.switchMode("MY_WALLET_DISCONNECTED");
        } else if (this.seller_consumer_connected &&
                   this.my_consumer_connected) {
            this.switchMode("OPERATE");
        }
    }

    buyOpinion() {
        if (! this.buying_running) {
            return;
        }
        this.logPrint("buying opinion for 10 sats");
        this.app.sendRequestInvoice("seller_consumer", 10000);
    }

    scheduleBuyOpinion() {
        setTimeout(function() { this.buyOpinion(); }.bind(this), 3000);
    }

    startBuyingOpinions() {
        this.logPrint("starting");
        this.buying_running = true;
        this.scheduleBuyOpinion();
        DomUtl.deleteChildren(this.start_stop_div);
        DomUtl.drawButton(this.start_stop_div, "Stop",
            (function() {
                this.stopBuyingOpinions()
            }).bind(this));
    }

    stopBuyingOpinions() {
        this.logPrint("stopping");
        this.buying_running = false;
        DomUtl.deleteChildren(this.start_stop_div);
        DomUtl.drawButton(this.start_stop_div, "Start",
            (function() {
                this.startBuyingOpinions()
            }).bind(this));
    }

    sellerConsumerConnected() {
        this.seller_ui.updateConnected();
        this.seller_consumer_connected = true;
        this.switchToRightMode();
    }
    sellerConsumerDisconnected() {
        this.buying_running = false;
        this.seller_ui.updateDisconnected();
        this.seller_consumer_connected = false;
        this.switchToRightMode();
    }

    updateSellerConsumerPing(ping_time) {
        this.seller_ui.updatePingTime(ping_time);
    }

    myConsumerConnected() {
        this.my_ui.updateConnected();
        this.my_consumer_connected = true;
        this.switchToRightMode();
    }

    myConsumerDisconnected() {
        this.buying_running = false;
        this.my_ui.updateDisconnected();
        this.my_consumer_connected = false;
        this.switchToRightMode();
    }

    updateMyConsumerPing(ping_time) {
        this.my_ui.updatePingTime(ping_time);
    }

    updateMyConsumerMsats(msats) {
        this.available_msats = msats;
        this.my_ui.updateProviderMsats(msats);
        DomUtl.deleteChildren(this.balance_div);
        DomUtl.drawBigBalance(this.balance_div, this.available_msats);
    }

    postOpinion(opinion) {
        console.log("opinion: " + opinion);
        console.log("has: " + GOOD_OPINIONS.has(opinion));
        if ((opinion == null) || (! GOOD_OPINIONS.has(opinion))) {
            this.logPrint("got nonsense opinion. stopping.");
            this.stopBuyingOpinions();
            return;
        }
        this.logPrint("got opinion: " + opinion);
        this.scheduleBuyOpinion();
    }

    logPrint(text) {
        var d = new Date();
        var line = d.toLocaleString() + "> " + text;
        this.log.innerHTML += line + '\n';
        this.log.scrollTop = this.log.scrollHeight;
    }
}

class BuyerApp {
    constructor() {
        this.parent_div = document.getElementById("ui");
        this.my_div = null;
        this.buyer_ui = null;
        this.my_consumer_ui = null;
        this.seller_consumer_ui = null;

        this.my_consumer_socket = null;
        this.seller_consumer_socket = null;

        this.wi = new WebsocketInterconnect(this);

        this.seller_ping_interval = null;
        this.my_ping_interval = null;
        this.outstanding_pings = {};
    }


    drawBuyerUi() {
        this.my_div = document.createElement("div");
        this.my_div.setAttribute("class", "bordered");
        DomUtl.drawTitle(this.my_div, "Opinion Buyer App", "h2");

        this.buyer_ui = new BuyerUi(this.my_div, this);
        this.buyer_ui.draw("center");
        DomUtl.drawBr(this.my_div);

        this.seller_consumer_ui = new BeaconUi(this.my_div,
            "Connect to a Downstream Opinion Seller", this, "seller_consumer");
        this.seller_consumer_ui.draw("left");

        this.my_consumer_ui = new BeaconUi(this.my_div,
            "Connect to my Downstream Moneysocket Provider", this,
            "my_consumer");
        this.my_consumer_ui.draw("right");
        DomUtl.drawBr(this.my_div);

        DomUtl.drawBr(this.my_div);

        this.parent_div.appendChild(this.my_div);
    }


 //////////////////////////////////////////////////////////////////////////
    sendRequestInvoice(role_name, msats) {
        if (role_name == "seller_consumer") {
            if ((this.seller_consumer_role != null) &&
                (this.seller_consumer_role.state != "ROLE_OPERATE"))
            {
                console.log("can't pay - seller not ready")
                return;
            }
            var msg = new RequestInvoice(msats);
            this.seller_consumer_role.socket.write(msg);
        } else {
            console.error("cannot request invoice from my wallet");
        }
    }

    sendPing(role_name) {
        //console.log("ping");
        var msg;
        if (role_name == "seller_consumer") {
            msg = this.seller_consumer_role.sendPing();
        } else if (role_name == "my_consumer") {
            msg = this.my_consumer_role.sendPing();
        } else {
            console.error("unknown role");
        }
        var req_ref_uuid = msg['request_uuid'];
        var timestamp = Timestamp.getNowTimestamp();
        this.outstanding_pings[req_ref_uuid] = {'role_name': role_name,
                                                'timestamp': timestamp};
    }

    handlePong(msg) {
        var req_ref_uuid = msg['request_reference_uuid'];
        if (! (req_ref_uuid in this.outstanding_pings)) {
            console.error("got pong with unknown request uuid");
            return;
        }
        var start_time = this.outstanding_pings[req_ref_uuid]['timestamp'];
        var role_name = this.outstanding_pings[req_ref_uuid]['role_name'];
        var ping_time = (Timestamp.getNowTimestamp() - start_time) * 1000;
        if (role_name == "seller_consumer") {
            console.log("pong seller");
            this.buyer_ui.updateSellerConsumerPing(Math.round(ping_time));
        } else if (role_name == "my_consumer") {
            console.log("pong my");
            this.buyer_ui.updateMyConsumerPing(Math.round(ping_time));
        }
    }

    startPinging(role_name) {
        console.log("ping starting");
        if (role_name == "seller_consumer") {
            if (this.seller_ping_interval != null) {
                return;
            }
            this.seller_ping_interval = setInterval(
                function() {
                    this.sendPing(role_name);
                }.bind(this), 3000);
        } else if (role_name == "my_consumer") {
            if (this.my_ping_interval != null) {
                return;
            }
            this.my_ping_interval = setInterval(
                function() {
                    this.sendPing(role_name);
                }.bind(this), 3000);
        }
        this.sendPing(role_name);
    }

    stopPinging(role_name) {
        if (role_name == "seller_consumer") {
            if (this.seller_ping_interval == null) {
                return;
            }
            console.log("seller ping stopping");
            clearInterval(this.seller_ping_interval);
            this.seller_ping_interval = null;
        } else if (role_name == "my_consumer") {
            if (this.my_ping_interval == null) {
                return;
            }
            console.log("my ping stopping");
            clearInterval(this.my_ping_interval);
            this.my_ping_interval = null;
        }
    }

    //////////////////////////////////////////////////////////////////////////
    // Role callbacks:
    //////////////////////////////////////////////////////////////////////////

    notifyPongHook(msg, role) {
        this.handlePong(msg);
    }

    notifyRendezvousBecomingReadyHook(msg, role) {
        console.log("becoming ready");
        if (role.name == "seller_consumer") {
            console.log("becoming ready 1");
            this.seller_consumer_ui.switchMode("WAITING_FOR_RENDEZVOUS");
            this.buyer_ui.sellerConsumerDisconnected();
            this.stopPinging("seller_consumer");
        } else if (role.name == "my_consumer") {
            console.log("becoming ready 2");
            this.my_consumer_ui.switchMode("WAITING_FOR_RENDEZVOUS");
            this.buyer_ui.myConsumerDisconnected();
            this.stopPinging("my_consumer");
        } else {
            console.log("unknown cb param");
        }
    }

    notifyRendezvousHook(msg, role) {
        if (role.name == "seller_consumer") {
            this.seller_consumer_ui.switchMode("REQUESTING_PROVIDER");
            role.socket.write(new RequestProvider());
        } else if (role.name == "my_consumer") {
            this.my_consumer_ui.switchMode("REQUESTING_PROVIDER");
            role.socket.write(new RequestProvider());
        } else {
            console.log("unknown role");
        }
    }

    notifyProviderBecomingReadyHook(msg, role) {
        if (role.name == "seller_consumer") {
            this.seller_consumer_ui.switchMode("WAITING_FOR_PROVIDER");
            this.buyer_ui.sellerConsumerDisconnected();
            this.stopPinging("seller_consumer")
            role.setState("PROVIDER_SETUP")
        } else if (role.name == "my_consumer") {
            this.my_consumer_ui.switchMode("WAITING_FOR_PROVIDER");
            this.buyer_ui.myConsumerDisconnected();
            this.stopPinging("my_consumer")
            role.setState("PROVIDER_SETUP")
        } else {
            console.log("unknown role");
        }
    }

    notifyProviderHook(msg, role) {
        if (role.name == "seller_consumer") {
            this.seller_consumer_ui.switchMode("CONNECTED");
            this.buyer_ui.sellerConsumerConnected();
            this.startPinging("seller_consumer");
        } else if (role.name == "my_consumer") {
            this.my_consumer_ui.switchMode("CONNECTED");
            this.buyer_ui.myConsumerConnected();
            this.buyer_ui.updateMyConsumerMsats(msg['msats']);
            this.startPinging("my_consumer");
        } else {
            console.log("unknown role");
        }
    }

    notifyInvoiceHook(msg, role) {
        // if we are buying and if rom seller consumer, pass along to be paid
        if (role.name == "seller_consumer") {
            if ((this.my_consumer_role != null) &&
                (this.my_consumer_role.state != "ROLE_OPERATE"))
            {
                console.log("can't pay - don't have wallet")
                return;
            }
            var msg = new RequestPay(msg['bolt11']);
            this.my_consumer_role.socket.write(msg);
        } else if (role.name == "my_consumer") {
            console.log("got invoice from my wallet?: " + msg['bolt11']);
        } else {
            console.log("unknown role");
        }
    }

    notifyPreimageHook(msg, role) {
        if (role.name == "seller_consumer") {
            var ext = msg['ext'];
            this.buyer_ui.postOpinion(ext);
        } else if (role.name == "my_consumer") {
            console.log("got preimage from my wallet?: " + msg['preimage']);
            return;
        } else {
            console.log("unknown role");
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
            'NOTIFY_INVOICE': function (msg) {
                console.log("notify invoice stub");
                this.notifyInvoiceHook(msg, role);
            }.bind(this),
            'NOTIFY_PREIMAGE': function (msg) {
                console.log("notify preimage stub");
                this.notifyPreimageHook(msg, role);
            }.bind(this),
            'REQUEST_PROVIDER': function (msg) {
                return this.requestProviderHook(msg, role);
            }.bind(this),
            'REQUEST_INVOICE': function (msg) {
                // should not get
                console.log("request invoice to buyer?");
                return null;
            }.bind(this),
            'REQUEST_PAY': function (msg) {
                // should not get
                console.log("request pay to buyer?");
                return null;
            }.bind(this),
        }
        role.registerAppHooks(hooks);
    }

    newSocket(socket, cb_param) {
        // interconnect announcing new socket
        console.log("got new socket: " + socket.toString());
        console.log("cb_param: " + cb_param);

        var role_info = cb_param;
        var beacon = role_info['beacon']
        var rid = beacon.shared_seed.deriveRendezvousId();
        socket.registerSharedSeed(beacon.shared_seed);

        if (role_info['role'] == "seller_consumer") {
            this.seller_consumer_socket = socket;

            this.seller_consumer_ui.switchMode("REQUESTING_RENDEZVOUS");

            this.seller_consumer_role = new Role("seller_consumer");
            this.seller_consumer_role.addSocket(socket);
            this.registerHooks(this.seller_consumer_role);
            this.seller_consumer_role.startRendezvous(rid);
        } else if (role_info['role'] == "my_consumer") {
            this.my_consumer_socket = socket;
            this.my_consumer_ui.switchMode("REQUESTING_RENDEZVOUS");

            this.my_consumer_role = new Role("my_consumer");
            this.my_consumer_role.addSocket(socket);
            //this.consumer_role.registerAppHook(this, "service");
            this.registerHooks(this.my_consumer_role);
            this.my_consumer_role.startRendezvous(rid);
        } else {
            console.log("unknown cb param");
        }
    }

    socketClose(socket) {
        if ((this.seller_consumer_socket != null) &&
            (socket.uuid == this.seller_consumer_socket.uuid))
        {
            this.seller_consumer_socket = null;
            this.seller_consumer_role = null;
            this.seller_consumer_ui.switchMode(
                this.seller_consumer_ui.return_mode);
            this.buyer_ui.sellerConsumerDisconnected();
            this.stopPinging("seller_consumer")
        }
        else if ((this.my_consumer_socket != null) &&
                 (socket.uuid == this.my_consumer_socket.uuid))
        {
            this.my_consumer_socket = null;
            this.my_consumer_role = null;
            this.my_consumer_ui.switchMode(
                this.my_consumer_ui.return_mode);
            this.buyer_ui.myConsumerDisconnected();
            this.stopPinging("my_consumer");
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
        if (cb_param == "seller_consumer") {
            if (! (location instanceof WebsocketLocation)) {
                this.seller_consumer_ui.switchMode("CONNECTION_FAILED");
                return;
            }
            var url = location.toWsUrl();
            var role_info = {'role':   'seller_consumer',
                             'beacon': beacon};
            this.seller_consumer_ui.switchMode("CONNECTING_WEBSOCKET");
            this.wi.connect(location, role_info);
        } else if (cb_param == "my_consumer") {
            if (! (location instanceof WebsocketLocation)) {
                this.my_consumer_ui.switchMode("CONNECTION_FAILED");
                return;
            }
            var role_info = {'role':   'my_consumer',
                             'beacon': beacon};
            var url = location.toWsUrl();
            this.my_consumer_ui.switchMode("CONNECTING_WEBSOCKET");
            this.wi.connect(location, role_info);
        } else {
            console.log("unknown cb_param: " + cb_param);
        }
    }

    disconnect(cb_param) {
        if (cb_param == "seller_consumer") {
            if (this.seller_consumer_socket != null) {
                this.seller_consumer_socket.close();
            }
        } else if (cb_param == "my_consumer") {
            if (this.my_consumer_socket != null) {
                this.my_consumer_socket.close();
            }
        } else {
            console.log("unknown cb_param: " + cb_param);
        }
    }
}

window.app = new BuyerApp();

function drawFirstUi() {
    window.app.drawBuyerUi()
}

window.addEventListener("load", drawFirstUi());
