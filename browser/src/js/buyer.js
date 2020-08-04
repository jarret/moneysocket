// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const DomUtl = require('./ui/domutl.js').DomUtl;
const WebsocketInterconnect = require(
    './moneysocket/socket/websocket.js').WebsocketInterconnect;
const WebsocketLocation = require(
    './moneysocket/beacon/location/websocket.js').WebsocketLocation;
const BeaconUi = require('./ui/beacon.js').BeaconUi;
const Role = require('./moneysocket/core/role.js').Role;
const UpstreamStatusUi = require('./ui/upstream_status.js').UpstreamStatusUi;
const DownstreamStatusUi = require(
    './ui/downstream_status.js').DownstreamStatusUi;



class BuyerUi {
    constructor(div) {
        this.parent_div = div;
        this.my_div = null;
        this.my_seller_role_div = null;
        this.seller_service_role_div = null;
        this.wallet_counterpart_div = null;
        this.opinion = "N/A";
    }

    draw(style) {
        this.my_div = document.createElement("div");
        this.my_div.setAttribute("class", style);

        this.opinion_div = DomUtl.emptyDiv(this.my_div);
        this.updateCurrentOpinion(this.opinion);

        DomUtl.drawBr(this.my_div);
        DomUtl.drawBr(this.my_div);

        DomUtl.drawButton(this.my_div, "Start",
            (function() {this.startBuyingOpinions()}).bind(this));
        DomUtl.drawBr(this.my_div);
        DomUtl.drawButton(this.my_div, "Stop",
            (function() {this.stopBuyingOpinions()}).bind(this));

        DomUtl.drawBr(this.my_div);
        DomUtl.drawBr(this.my_div);

        DomUtl.drawBr(this.my_div);
        this.upstream_ui = new UpstreamStatusUi(this.my_div);
        this.upstream_ui.draw();
        this.downstream_ui = new DownstreamStatusUi(this.my_div);
        this.downstream_ui.draw();

        DomUtl.drawBr(this.my_div);

        this.parent_div.appendChild(this.my_div);
    }

    startBuyingOpinions(opinion) {
        console.log("starting");
    }

    stopBuyingOpinions(opinion) {
        console.log("stopping");
    }

    updateCurrentOpinion(opinion) {
        this.opinion = opinion
        DomUtl.deleteChildren(this.opinion_div)
        DomUtl.drawText(this.opinion_div, "Purchased Opinion: ");
        DomUtl.drawBr(this.opinion_div);
        DomUtl.drawBigText(this.opinion_div, opinion);
    }

    sellerConsumerConnected() {
        this.upstream_ui.updateConnected();
    }
    sellerConsumerDisconnected() {
        this.upstream_ui.updateDisconnected();
    }

    myConsumerConnected() {
        this.downstream_ui.updateConnected();
    }
    myConsumerDisconnected() {
        this.downstream_ui.updateDisconnected();
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
    }


    drawBuyerUi() {
        this.my_div = document.createElement("div");
        this.my_div.setAttribute("class", "bordered");
        DomUtl.drawTitle(this.my_div, "Opinion Buyer App", "h1");

        this.buyer_ui = new BuyerUi(this.my_div);
        this.buyer_ui.draw("center");
        DomUtl.drawBr(this.my_div);

        this.seller_consumer_ui = new BeaconUi(this.my_div,
                                               "Connect to seller",
                                               this, "seller_consumer");
        this.seller_consumer_ui.draw("left");

        this.my_consumer_ui = new BeaconUi(this.my_div, "Connect to my wallet",
                                 this, "my_consumer");
        this.my_consumer_ui.draw("right");
        DomUtl.drawBr(this.my_div);

        DomUtl.drawBr(this.my_div);

        this.parent_div.appendChild(this.my_div);
    }


 //////////////////////////////////////////////////////////////////////////

    sendPing(role_name) {
        console.log("ping");
        if (role_name
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

    startPinging(role_name) {
        console.log("ping starting");
        this.ping_interval = setInterval(
            function() {
                this.sendPing(role_name);
            }.bind(this), 3000);
        this.sendPing(role_name);
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

    pongHook(msg, role) {
        this.handlePong(msg);
    }

    rendezvousBecomingReadyHook(msg, role) {
        console.log("becoming ready");
        if (role.name == "seller_consumer") {
            console.log("becoming ready 1");
            this.seller_consumer_ui.switchMode("WAITING_FOR_RENDEZVOUS");
            this.buyer_ui.sellerConsumerDisconnected();
        } else if (role.name == "my_consumer") {
            console.log("becoming ready 2");
            this.my_consumer_ui.switchMode("WAITING_FOR_RENDEZVOUS");
            this.buyer_ui.myConsumerDisconnected();
            this.stopPinging()
        } else {
            console.log("unknown cb param");
        }
    }

    rendezvousHook(msg, role) {
        if (role.name == "seller_consumer") {
            this.seller_consumer_ui.switchMode("CONNECTED");
            this.buyer_ui.sellerConsumerConnected();
        } else if (role.name == "my_consumer") {
            this.my_consumer_ui.switchMode("CONNECTED");
            this.buyer_ui.myConsumerConnected();
            this.startPinging(role.name);
        } else {
            console.log("unknown cb param");
        }
    }


    registerHooks(role) {
        console.log("REGISTERING");
        var hooks = {
            'NOTIFY_RENDEZVOUS': function (msg) {
                this.rendezvousHook(msg, role);
            }.bind(this),
            'NOTIFY_RENDEZVOUS_BECOMING_READY': function (msg) {
                this.rendezvousBecomingReadyHook(msg, role);
            }.bind(this),
            'NOTIFY_PONG': function (msg) {
                this.pongHook(msg, role);
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
            // stop pinging
        }
        else if ((this.my_consumer_socket != null) &&
                 (socket.uuid == this.my_consumer_socket.uuid))
        {
            this.my_consumer_socket = null;
            this.my_consumer_role = null;
            this.my_consumer_ui.switchMode(
                this.my_consumer_ui.return_mode);
            this.buyer_ui.myConsumerDisconnected();
            // stop pinging
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
