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

const NotifyProvider = require(
    "./moneysocket/core/message/notification/provider.js").NotifyProvider;
const NotifyProviderBecomingReady = require(
    "./moneysocket/core/message/notification/provider_becoming_ready.js"
    ).NotifyProviderBecomingReady;

class SellerUi {
    constructor(div) {
        this.parent_div = div;
        this.my_div = null;
        this.opinion = "Bullish"
        this.provider_msats = 0;
    }

    draw(style) {
        this.my_div = document.createElement("div");
        this.my_div.setAttribute("class", style);

        this.opinion_div = DomUtl.emptyDiv(this.my_div);
        this.updateCurrentOpinion(this.opinion);

        DomUtl.drawBr(this.my_div);
        DomUtl.drawBr(this.my_div);

        DomUtl.drawButton(this.my_div, "Bullish",
            (function() {this.updateCurrentOpinion("Bullish")}
            ).bind(this));
        DomUtl.drawBr(this.my_div);
        DomUtl.drawButton(this.my_div, "Bearish",
            (function() {this.updateCurrentOpinion("Bearish")}).bind(this));
        DomUtl.drawBr(this.my_div);
        DomUtl.drawButton(this.my_div, "ETH is Scaling",
            (function() {this.updateCurrentOpinion("ETH is Scaling")}
            ).bind(this));
        DomUtl.drawBr(this.my_div);
        DomUtl.drawButton(this.my_div, "(Renege)",
            (function() {this.updateCurrentOpinion("(Renege)")}).bind(this));

        DomUtl.drawBr(this.my_div);
        DomUtl.drawBr(this.my_div);

        this.downstream_ui = new DownstreamStatusUi(this.my_div, "Downstream");
        this.downstream_ui.draw("downstream-status-left");

        this.upstream_ui = new UpstreamStatusUi(this.my_div, "Buyer");
        this.upstream_ui.draw("upstream-status-right");

        DomUtl.drawBr(this.my_div);

        this.parent_div.appendChild(this.my_div);
    }

    updateCurrentOpinion(opinion) {
        this.opinion = opinion
        DomUtl.deleteChildren(this.opinion_div)
        DomUtl.drawText(this.opinion_div, "Current Opinion: ");
        DomUtl.drawBr(this.opinion_div);
        DomUtl.drawBigText(this.opinion_div, opinion);
    }

    updateProviderPing(ping_time) {
        this.downstream_ui.updatePingTime(ping_time);
    }

    updateProviderMsats(msats) {
        this.provider_msats = msats;
        this.downstream_ui.updateProviderMsats(msats);
    }

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

class SellerApp {
    constructor() {
        this.parent_div = document.getElementById("ui");
        this.my_div = null;

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


    drawSellerUi() {
        this.my_div = document.createElement("div");
        this.my_div.setAttribute("class", "bordered");
        DomUtl.drawTitle(this.my_div, "Opinion Seller App", "h2");

        this.seller_ui = new SellerUi(this.my_div);
        this.seller_ui.draw("center");
        DomUtl.drawBr(this.my_div);

        this.consumer_ui = new BeaconUi(this.my_div,
            "Connect to Downstream Moneysocket Provider", this, "consumer");
        this.consumer_ui.draw("left");

        this.provider_ui = new BeaconUi(this.my_div,
            "Connect to Upstream Opinion Buyer", this, "provider");
        this.provider_ui.draw("right");

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
        this.seller_ui.updateProviderPing(Math.round(ping_time));
    }

    startPinging() {
        if (this.ping_interval != null) {
            return;
        }
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
        if (role.name == "consumer") {
            this.consumer_ui.switchMode("WAITING_FOR_RENDEZVOUS");
            this.seller_ui.consumerDisconnected();
            this.stopPinging()


            if ((this.provider_role != null) &&
                (this.provider_role.state == "ROLE_OPERATE"))
            {
                this.provider_role.setState("PROVIDER_SETUP");
                this.provider_ui.switchMode("WAITING_FOR_DOWNSTREAM");
                this.seller_ui.providerDisconnected();
                this.provider_socket.write(
                    new NotifyProviderBecomingReady(null));
            }

        } else if (role.name == "provider") {
            this.provider_ui.switchMode("WAITING_FOR_RENDEZVOUS");
            this.seller_ui.providerDisconnected();
        } else {
            console.log("unknown cb param");
        }
    }

    notifyRendezvousHook(msg, role) {
        if (role.name == "consumer") {
            this.consumer_ui.switchMode("REQUESTING_PROVIDER");
            role.socket.write(new RequestProvider());
        } else if (role.name == "provider") {
            this.provider_ui.switchMode("WAITING_FOR_CONSUMER");
        } else {
            console.log("unknown cb param");
        }
    }

    notifyProviderHook(msg, role) {
        if (role.name == "consumer") {
            this.consumer_ui.switchMode("CONNECTED");
            this.seller_ui.consumerConnected();
            this.seller_ui.updateProviderMsats(msg['msats']);
            this.startPinging();

            if ((this.provider_role != null) &&
                (this.provider_role.state == "PROVIDER_SETUP"))
            {
                // TODO - I think there is a race here
                var uuid = this.provider_role.uuid;
                var msg = new NotifyProvider(uuid, null, false, true, null);
                this.provider_role.setState("ROLE_OPERATE");
                this.provider_socket.write(msg);
                this.provider_ui.switchMode("CONNECTED");
                this.seller_ui.providerConnected();
            }
        } else if (role.name == "provider") {
            console.error("unexpected notification");
            return;
        } else {
            console.log("unknown cb param");
        }
    }

    notifyProviderBecomingReadyHook(msg, role) {
        if (role.name == "consumer") {
            this.consumer_ui.switchMode("WAITING_FOR_PROVIDER");
            this.seller_ui.consumerDisconnected();
            this.stopPinging()
            role.setState("PROVIDER_SETUP")

            if ((this.provider_role != null) &&
                (this.provider_role.state == "ROLE_OPERATE"))
            {
                this.provider_role.setState("PROVIDER_SETUP");
                this.provider_ui.switchMode("WAITING_FOR_DOWNSTREAM");
                this.seller_ui.providerDisconnected();
                this.provider_socket.write(
                    new NotifyProviderBecomingReady(null));
            }
        } else if (role.name == "provider") {
            console.error("unexpected notification");
            return;
        } else {
            console.log("unknown cb param");
        }
    }

    requestProviderHook(msg, role) {
        if (role.name == "consumer") {
            return NotifyError("no provider here", req_ref_uuid);
        } else if (role.name == "provider") {
            // if consumer is connected, notify ourselves as provider
            var req_ref_uuid = msg['request_uuid'];
            if ((this.consumer_role != null) &&
                (this.consumer_role.state == "ROLE_OPERATE"))
            {
                var uuid = this.provider_role.uuid;
                this.provider_ui.switchMode("CONNECTED");
                this.seller_ui.providerConnected();
                return new NotifyProvider(uuid, req_ref_uuid, false, true,
                                          null);
            }
            // else notifiy becoming ready
            return new NotifyProviderBecomingReady(req_ref_uuid);
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
                return this.requestProviderHook(msg, role);
            }.bind(this),
        }
        role.registerAppHooks(hooks);
    }

    //////////////////////////////////////////////////////////////////////////
    // WebsocketInterconnect callbacks:
    //////////////////////////////////////////////////////////////////////////

    newSocket(socket, cb_param) {
        console.log("got new socket: " + socket.toString());
        console.log("cb_param: " + cb_param);

        var role_info = cb_param;
        var beacon = role_info['beacon']
        var rid = beacon.shared_seed.deriveRendezvousId();
        socket.registerSharedSeed(beacon.shared_seed);

        if (role_info['role'] == "consumer") {
            this.consumer_socket = socket;
            this.consumer_ui.switchMode("REQUESTING_RENDEZVOUS");
            this.consumer_role = new Role("consumer");
            this.consumer_role.addSocket(socket);
            this.registerHooks(this.consumer_role);
            this.consumer_role.startRendezvous(rid);
        } else if (role_info['role'] == "provider") {
            this.provider_socket = socket;
            this.provider_ui.switchMode("REQUESTING_RENDEZVOUS");
            this.provider_role = new Role("provider");
            this.provider_role.addSocket(socket);
            this.registerHooks(this.provider_role);
            this.provider_role.startRendezvous(rid);
        } else {
            console.log("unknown cb param");
        }
    }

    socketClose(socket) {
        console.log("got socket close: " + socket.toString());
        if ((this.consumer_socket != null) &&
            (socket.uuid == this.consumer_socket.uuid))
        {
            this.consumer_socket = null;
            this.consumer_role = null;
            this.consumer_ui.switchMode(this.consumer_ui.return_mode);
            this.seller_ui.consumerDisconnected();
            this.stopPinging()

            // degrade the provider
            if ((this.provider_role != null) &&
                (this.provider_role.state == "ROLE_OPERATE"))
            {
                this.provider_role.setState("PROVIDER_SETUP");
                this.provider_ui.switchMode("WAITING_FOR_DOWNSTREAM");
                this.seller_ui.providerDisconnected();
                this.provider_socket.write(
                    new NotifyProviderBecomingReady(null));
            }


        } else if ((this.provider_socket != null) &&
            (socket.uuid == this.provider_socket.uuid))
        {
            this.provider_socket = null;
            this.provider_role = null;
            this.provider_ui.switchMode(this.provider_ui.return_mode);
            this.seller_ui.providerDisconnected();
        } else {
            console.log("got unknown socket closed");
        }
    }

    //////////////////////////////////////////////////////////////////////////
    // BeaconUI callbacks:
    //////////////////////////////////////////////////////////////////////////

    connect(beacon, cb_param) {
        var location = beacon.locations[0];
        if (cb_param == "consumer") {
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

        } else if (cb_param == "provider") {
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
        } else {
            console.log("unknown cb_param: " + cb_param);
        }
    }

    disconnect(cb_param) {
        if (cb_param == "consumer") {
            console.log("disconnect consumer");
            if (this.consumer_socket != null) {
                this.consumer_socket.close();
            }
        } else if (cb_param == "provider") {
            console.log("disconnect provider");
            if (this.provider_socket != null) {
                this.provider_socket.close();
            }
        } else {
            console.log("unknown cb_param: " + cb_param);
        }
    }
}

window.app = new SellerApp();

function drawFirstUi() {
    window.app.drawSellerUi()
}

window.addEventListener("load", drawFirstUi());
