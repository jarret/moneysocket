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

const NotifyProvider = require(
    "./moneysocket/core/message/notification/provider.js").NotifyProvider;
const NotifyProviderBecomingReady = require(
    "./moneysocket/core/message/notification/provider_becoming_ready.js"
    ).NotifyProviderBecomingReady;
const NotifyInvoice = require(
    "./moneysocket/core/message/notification/invoice.js").NotifyInvoice;
const NotifyPreimage = require(
    "./moneysocket/core/message/notification/preimage.js").NotifyPreimage;


///////////////////////////////////////////////////////////////////////////////

const MODES = new Set(["PROVIDER_DISCONNECTED",
                       "MAIN",
                       "SEND",
                       "RECEIVE",
                      ]);


class WalletUi {
    constructor(div, app) {
        this.parent_div = div;
        this.app = app;
        this.my_div = null;
        this.spendable_div = null;
        this.provider_role_div = null;
        this.consumer_role_div = null;
        this.provider_counterpart_div = null;
        this.mode = null;

        this.upstream_ui = null;
        this.downstream_ui = null;

        this.provider_msats = 0;
        this.provide_msats = 0;


        this.balance_div = null;
        this.slider_input = null;
        this.slider_val = 100;

        this.send_input_div = null;
        this.receive_div = null;
        this.bolt11 = "";

    }

    draw(style) {
        this.my_div = document.createElement("div");
        this.my_div.setAttribute("class", style);

        this.wallet_mode_div = DomUtl.emptyDiv(this.my_div);
        this.wallet_mode_div.setAttribute("class", "app-mode-output");

        DomUtl.drawBr(this.my_div);
        this.upstream_ui = new UpstreamStatusUi(this.my_div, "Upstream");
        this.upstream_ui.draw("upstream-status-left");
        this.downstream_ui = new DownstreamStatusUi(this.my_div, "Downstream");
        this.downstream_ui.draw("downstream-status-right");

        this.switchMode("PROVIDER_DISCONNECTED");

        this.parent_div.appendChild(this.my_div);
    }

    switchMode(new_mode) {
        console.assert(MODES.has(new_mode));
        this.mode = new_mode;
        DomUtl.deleteChildren(this.wallet_mode_div);

        if (new_mode == "PROVIDER_DISCONNECTED") {
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
            var s = DomUtl.drawSlider(this.wallet_mode_div, this.slider_val);
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
            DomUtl.drawButton(this.wallet_mode_div, "Pay Bolt11",
                (function() {
                    this.payBolt11();
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

            this.receive_div = DomUtl.emptyDiv(this.wallet_mode_div);

            var t = DomUtl.drawText(this.receive_div, "Request sats:");
            t.setAttribute("style", "padding:5px;");
            this.input_div = DomUtl.drawTextInput(this.receive_div, "10");
            this.input_div.firstChild.setAttribute("size", "8");
            DomUtl.drawBr(this.receive_div);
            DomUtl.drawButton(this.receive_div, "Request Bolt11",
                (function() {
                    this.requestBolt11();
                }).bind(this));

            DomUtl.drawBr(this.wallet_mode_div);
            DomUtl.drawButton(this.wallet_mode_div, "Back",
                (function() {
                    this.switchMode("MAIN");
                }).bind(this));
        }
    }

    updateProvideMsats() {
        this.slider_val = this.slider_input.value;
        this.provide_msats = this.provider_msats * (this.slider_val / 100);
        DomUtl.deleteChildren(this.balance_div);
        DomUtl.drawBigBalance(this.balance_div, this.provide_msats);
        this.app.doUpstreamNotifyProvider();
    }

    ///////////////////////////////////////////////////////////////////////////

    drawBolt11(bolt11){
        this.bolt11 = bolt11;
        DomUtl.deleteChildren(this.receive_div);
        DomUtl.qrCode(this.receive_div, bolt11);
        DomUtl.drawBr(this.receive_div);
        DomUtl.drawButton(this.receive_div, "Copy Bolt11",
            (function() {
                navigator.clipboard.writeText(this.bolt11);
                var t = DomUtl.drawText(this.receive_div, "Copied Bolt11")
                t.setAttribute("style", "padding:10px;");
            }).bind(this));
    }

    notifyInvoice(bolt11) {
        console.log("got bolt11: " + bolt11);
        this.drawBolt11(bolt11);
    }

    ///////////////////////////////////////////////////////////////////////////

    payBolt11() {
        console.log("pay bolt11 stub")
        var bolt11 = this.input_div.firstChild.value
        // TODO - validate bolt11 parses
        var msg = new RequestPay(bolt11);
        this.app.consumer_role.socket.write(msg);
    }

    requestBolt11() {
        console.log("request bolt11 stub")
        var msats = parseInt(this.input_div.firstChild.value) * 1000;
        var msg = new RequestInvoice(msats);
        this.app.consumer_role.socket.write(msg);
    }

    ///////////////////////////////////////////////////////////////////////////

    updateProviderPing(ping_time) {
        this.downstream_ui.updatePingTime(ping_time);
    }

    updateProviderMsats(msats) {
        // TODO - msats might be null
        this.provider_msats = msats;
        this.updateProvideMsats();
        this.downstream_ui.updateProviderMsats(msats);
    }

    getProvideMsats(msats) {
        return this.provide_msats;
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
        this.switchMode("MAIN");
    }
    consumerDisconnected() {
        this.downstream_ui.updateDisconnected();
        this.switchMode("PROVIDER_DISCONNECTED");
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

        this.forward_references = {};
    }

    drawWalletAppUi() {
        this.my_div = document.createElement("div");
        this.my_div.setAttribute("class", "bordered");
        DomUtl.drawTitle(this.my_div, "Moneysocket Web Wallet", "h2");

        this.wallet_ui = new WalletUi(this.my_div, this);
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

    doUpstreamNotifyProvider() {
        // bail if provider not connected
        if (this.provider_role == null) {
            console.log("no provider role");
            return;
        }
        if (this.provider_socket == null) {
            console.log("no provider socket");
            return;
        }
        // shouldn't have UI if consumer not connected
        if (this.consumer_role == null) {
            console.error("no consumer?");
            return;
        }
        if (this.consumer_socket == null) {
            console.error("no consumer socket?");
            return;
        }
        var uuid = this.provider_role.uuid;
        var msats = this.wallet_ui.getProvideMsats();
        var msg = new NotifyProvider(uuid, null, true, true, msats);
        this.provider_socket.write(msg);
    }

    //////////////////////////////////////////////////////////////////////////

    sendPing() {
        //console.log("ping");
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
        console.log("attempt ping starting");
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
        this.ping_interval = null;
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

            if ((this.provider_role != null) &&
                (this.provider_role.state == "ROLE_OPERATE"))
            {
                this.provider_role.setState("PROVIDER_SETUP");
                this.provider_ui.switchMode("WAITING_FOR_DOWNSTREAM");
                this.wallet_ui.providerDisconnected();
                this.provider_socket.write(
                    new NotifyProviderBecomingReady(null));
            }

        } else {
            console.log("unknown cb param");
        }
    }

    notifyRendezvousHook(msg, role) {
        if (role.name == "provider") {
            this.provider_ui.switchMode("WAITING_FOR_CONSUMER");
        } else if (role.name == "consumer") {
            this.consumer_ui.switchMode("REQUESTING_PROVIDER");
            role.socket.write(new RequestProvider());
        } else {
            console.log("unknown cb param");
        }
    }

    notifyProviderBecomingReadyHook(msg, role) {
        if (role.name == "provider") {
            console.error("unexpected notification");
            return;
        } else if (role.name == "consumer") {
            this.consumer_ui.switchMode("WAITING_FOR_PROVIDER");
            this.wallet_ui.consumerDisconnected();
            this.stopPinging()
            role.setState("PROVIDER_SETUP")

            if ((this.provider_role != null) &&
                (this.provider_role.state == "ROLE_OPERATE"))
            {
                this.provider_role.setState("PROVIDER_SETUP");
                this.provider_ui.switchMode("WAITING_FOR_DOWNSTREAM");
                this.wallet_ui.providerDisconnected();
                this.provider_socket.write(
                    new NotifyProviderBecomingReady(null));
            }

        } else {
            console.log("unknown cb param");
        }
    }

    notifyProviderHook(msg, role) {
        if (role.name == "provider") {
            console.error("unexpected notification");
            return;
        } else if (role.name == "consumer") {
            this.consumer_ui.switchMode("CONNECTED");
            this.wallet_ui.consumerConnected();
            this.wallet_ui.updateProviderMsats(msg['msats']);
            // TODO - what about providers that can't send or can't receive?
            this.startPinging();

            if ((this.provider_role != null) &&
                (this.provider_role.state == "PROVIDER_SETUP"))
            {
                // TODO - I think there is a race here
                var uuid = this.provider_role.uuid;
                var msats = this.wallet_ui.getProvideMsats();
                var msg = new NotifyProvider(uuid, null, true, true, msats);
                this.provider_role.setState("ROLE_OPERATE");
                this.provider_socket.write(msg);
                this.provider_ui.switchMode("CONNECTED");
                this.wallet_ui.providerConnected();
            }
        } else {
            console.log("unknown role");
        }
    }

    notifyInvoiceHook(msg, role) {
        var req_ref_uuid = msg['request_reference_uuid'];
        console.log("notify invoice stub");
        if (role.name == 'provider') {
            console.error("unexpected notification");
            return;
        } else if (role.name == 'consumer') {
            if (req_ref_uuid in this.forward_references) {
                var fwd_req_ref_uuid = this.forward_references[req_ref_uuid];
                delete this.forward_references[req_ref_uuid];
                if ((this.provider_role == null) ||
                    (this.provider_role.state != "ROLE_OPERATE"))
                {
                    console.error("requesting provider gone offline?");
                    return
                }
                // TODO save payment_hash -> fwd_req_ref_uuid association
                var fwd_msg = new NotifyInvoice(msg['bolt11'],
                                                fwd_req_ref_uuid);
                this.provider_role.socket.write(fwd_msg);

            } else {
                this.wallet_ui.notifyInvoice(msg['bolt11']);
            }
        } else {
            console.log("unknown role");
        }
    }

    notifyPreimageHook(msg, role) {
        var req_ref_uuid = msg['request_reference_uuid'];
        if (role.name == 'provider') {
            console.error("unexpected notification");
            return;
        } else if (role.name == 'consumer') {
            if ((this.provider_role == null) ||
                (this.provider_role.state != "ROLE_OPERATE"))
            {
                // no provider
                return
            }
            // TODO calc payment hash - if has upstream assoction, set ref req
            // uuid. If not, check if matches wallet GUI preimage and refresh?
            var fwd_msg = new NotifyPreimage(msg['preimage'], msg['ext'],
                                             null);
            this.provider_role.socket.write(fwd_msg);
        } else {
            console.log("unknown role");
        }
    }

    requestProviderHook(msg, role) {
        var req_ref_uuid = msg['request_uuid'];
        if (role.name == "provider") {
            // if consumer is connected, notify ourselves as provider
            if ((this.consumer_role != null) &&
                (this.consumer_role.state == "ROLE_OPERATE"))
            {
                var uuid = this.provider_role.uuid;
                var msats = this.wallet_ui.getProvideMsats();
                this.provider_ui.switchMode("CONNECTED");
                this.wallet_ui.providerConnected();
                return new NotifyProvider(uuid, req_ref_uuid,
                                          true, true, msats);
            }
            return new NotifyProviderBecomingReady(req_ref_uuid);
        } else if (role.name == "consumer") {
            return NotifyError("no provider here", req_ref_uuid);
        }
    }

    requestInvoiceHook(msg, role) {
        var req_ref_uuid = msg['request_uuid'];
        if (role.name == "provider") {
            if ((this.consumer_role == null) ||
                (this.consumer_role.state != "ROLE_OPERATE"))
            {
                console.error("request race?");
                return
            }
            var fwd_msg = new RequestInvoice(msg['msats']);
            var fwd_req_ref_uuid = fwd_msg['request_uuid'];
            this.forward_references[fwd_req_ref_uuid] = req_ref_uuid;
            this.consumer_role.socket.write(fwd_msg);
            return null;
        } else if (role.name == "consumer") {
            return NotifyError("no provider here", req_ref_uuid);
        }
    }

    requestPayHook(msg, role) {
        var req_ref_uuid = msg['request_uuid'];
        if (role.name == "provider") {
            if ((this.consumer_role == null) ||
                (this.consumer_role.state != "ROLE_OPERATE"))
            {
                console.error("request race?");
                return
            }
            var fwd_msg = new RequestPay(msg['bolt11']);
            var fwd_req_ref_uuid = fwd_msg['request_uuid'];
            this.forward_references[fwd_req_ref_uuid] = req_ref_uuid;
            this.consumer_role.socket.write(fwd_msg);
            return null;
        } else if (role.name == "consumer") {
            return NotifyError("no provider here", req_ref_uuid);
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
                this.notifyInvoiceHook(msg, role);
            }.bind(this),
            'NOTIFY_PREIMAGE': function (msg) {
                this.notifyPreimageHook(msg, role);
            }.bind(this),
            'REQUEST_PROVIDER': function (msg) {
                return this.requestProviderHook(msg, role);
            }.bind(this),
            'REQUEST_INVOICE': function (msg) {
                return this.requestInvoiceHook(msg, role);
            }.bind(this),
            'REQUEST_PAY': function (msg) {
                return this.requestPayHook(msg, role);
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
        }
        else if ((this.consumer_socket != null) &&
                 (socket.uuid == this.consumer_socket.uuid))
        {
            this.consumer_socket = null;
            this.consumer_role = null;
            this.consumer_ui.switchMode(this.consumer_ui.return_mode);
            this.wallet_ui.consumerDisconnected();
            this.stopPinging()

            // degrade the provider
            if ((this.provider_role != null) &&
                (this.provider_role.state == "ROLE_OPERATE"))
            {
                this.provider_role.setState("PROVIDER_SETUP");
                this.provider_ui.switchMode("WAITING_FOR_DOWNSTREAM");
                this.wallet_ui.providerDisconnected();
                this.provider_socket.write(
                    new NotifyProviderBecomingReady(null));
            }
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
