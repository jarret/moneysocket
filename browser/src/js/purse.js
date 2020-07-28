// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const DomUtl = require('./domutl.js').DomUtl;
const WebsocketInterconnect = require(
    './moneysocket/socket/websocket.js').WebsocketInterconnect;
const BeaconUi = require('./beacon_ui.js').BeaconUi;

const MoneysocketMessage = require(
    './moneysocket/core/message/message.js').MoneysocketMessage;

let MESSAGE_SUBCLASSES = require(
    './moneysocket/core/message/message.js').MESSAGE_SUBCLASSES;

const  MoneysocketRequest = require(
    './moneysocket/core/message/request/request.js').MoneysocketRequest;

const  RequestRendezvous = require(
    './moneysocket/core/message/request/rendezvous.js').RequestRendezvous;

class PurseStatusUi {
    constructor(div) {
        this.parent_div = div;
        this.my_div = null;
        this.spendable_div = null;
        this.wallet_role_div = null;
        this.service_role_div = null;
        this.wallet_counterpart_div = null;
    }

    draw(style) {
        this.my_div = document.createElement("div");
        this.my_div.setAttribute("class", style);

        this.spendable_div = DomUtl.emptyDiv(this.my_div);
        DomUtl.drawBigBalance(this.spendable_div, 0.0);
        DomUtl.drawBr(this.my_div);

        this.wallet_role_div = DomUtl.emptyDiv(this.my_div);
        DomUtl.drawText(this.wallet_role_div, "Wallet Role: ");
        DomUtl.drawColoredText(this.wallet_role_div, "Not Connected", "red");

        DomUtl.drawBr(this.my_div);

        this.service_role_div = DomUtl.emptyDiv(this.my_div);
        DomUtl.drawText(this.service_role_div, "Service Role: ");
        DomUtl.drawColoredText(this.service_role_div, "Not Connected", "red");

        DomUtl.drawBr(this.my_div);

        this.wallet_counterpart_div = DomUtl.emptyDiv(this.my_div);
        DomUtl.drawText(this.wallet_counterpart_div,
                      "Wallet Counterpart Balance: N/A");

        DomUtl.drawBr(this.my_div);

        this.parent_div.appendChild(this.my_div);
    }

    updateSpendable(new_spendable) {
        DomUtl.deleteChildren(this.spendable_div)
        DomUtl.drawBigBalance(this.spendable_div, 0.0);
    }

    updateWalletRoleConnected() {
        DomUtl.deleteChildren(this.wallet_role_div)
        DomUtl.drawText(this.wallet_role_div, "Wallet Role: ");
        DomUtl.drawColoredText(this.wallet_role_div, "Connected", "green");
    }

    updateWalletRoleConnecting() {
        DomUtl.deleteChildren(this.wallet_role_div)
        DomUtl.drawText(this.wallet_role_div, "Wallet Role: ");
        DomUtl.drawColoredText(this.wallet_role_div, "Connecting", "orange");
    }

    updateWalletRoleDisconnected() {
        DomUtl.deleteChildren(this.wallet_role_div)
        DomUtl.drawText(this.wallet_role_div, "Wallet Role: ");
        DomUtl.drawColoredText(this.wallet_role_div, "Not Connected", "red");
    }

    updateServiceRoleConnected() {
        DomUtl.deleteChildren(this.service_role_div)
        DomUtl.drawText(this.service_role_div, "Service Role: ");
        DomUtl.drawColoredText(this.service_role_div, "Connected", "green");
    }

    updateServiceRoleConnecting() {
        DomUtl.deleteChildren(this.service_role_div)
        DomUtl.drawText(this.service_role_div, "Service Role: ");
        DomUtl.drawColoredText(this.service_role_div, "Connecting", "orange");
    }

    updateServiceRoleDisconnected() {
        DomUtl.deleteChildren(this.service_role_div)
        DomUtl.drawText(this.service_role_div, "Service Role: ");
        DomUtl.drawColoredText(this.service_role_div, "Not Connected", "red");
    }

    updateWalletCounterpartBalance(msats) {
        DomUtl.deleteChildren(this.wallet_counterpart_div)
        DomUtl.drawText(this.wallet_counterpart_div,
            "Wallet Counterpart Balance: " + DomUtl.balanceFmt(msats));
    }

}

class PurseApp {
    constructor() {
        this.parent_div = document.getElementById("ui");
        this.my_div = null;
        this.psu = null;
        this.wbu = null;
        this.sbu = null;

        this.wallet_socket = null;
        this.service_socket = null;

        this.wi = new WebsocketInterconnect(this);
    }


    drawPurseUi() {
        this.my_div = document.createElement("div");
        this.my_div.setAttribute("class", "bordered");
        DomUtl.drawTitle(this.my_div, "Purse App", "h1");

        this.psu = new PurseStatusUi(this.my_div);
        this.psu.draw("center");

        DomUtl.drawBr(this.my_div);
        var wtitle = "💸 WALLET Connect to External SERVICE";
        this.wbu = new BeaconUi(this.my_div, wtitle, this, "wallet");
        this.wbu.draw("left");

        var stitle = "💸 SERVICE Connect to External WALLET";
        this.sbu = new BeaconUi(this.my_div, stitle, this, "service");
        this.sbu.draw("right");
        DomUtl.drawBr(this.my_div);
        DomUtl.drawBr(this.my_div);

        this.parent_div.appendChild(this.my_div);
    }


    newSocket(socket, cb_param) {
        console.log("got new socket: " + socket.toString());
        console.log("cb_param: " + cb_param);
        if (cb_param == "wallet") {
            this.wallet_socket = socket;
            this.psu.updateWalletRoleConnected();
            this.wbu.drawDisconnectButton();
            // TODO wallet role object,
        } else if (cb_param == "service") {
            this.service_socket = socket;
            this.psu.updateServiceRoleConnected();
            this.sbu.drawDisconnectButton();
            // TODO service role object,
        } else {
            console.log("unknown cb param");
        }
    }

    socketClose(socket, cb_param) {
        console.log("got socket close: " + socket.toString());
        console.log("cb_param: " + cb_param);
        if (cb_param == "wallet") {
            console.log("got wallet socket closed");
            this.wallet_socket = null;
            this.psu.updateWalletRoleDisconnected();
            this.wbu.drawConnectButton();
            // TODO wallet role object
        } else if (cb_param == "service") {
            console.log("got service socket closed");
            this.service_socket = null;
            this.psu.updateServiceRoleDisconnected();
            this.sbu.drawConnectButton();
            // TODO service role object
        } else {
            console.log("got unknown socket closed");
        }
    }

    connect(cb_param) {
        if (cb_param == "wallet") {
            var ws_url = this.wbu.getWsUrl();
            console.log("connect wallet: " + ws_url);
            this.psu.updateWalletRoleConnecting();
            this.wbu.drawConnecting();
            this.wi.connect(ws_url, "wallet");
        } else if (cb_param == "service") {
            var ws_url = this.sbu.getWsUrl();
            console.log("connect service: " + ws_url);
            this.psu.updateServiceRoleConnecting();
            this.sbu.drawConnecting();
            this.wi.connect(ws_url, "service");
        } else {
            console.log("unknown cb_param: " + cb_param);
        }
    }

    disconnect(cb_param) {
        if (cb_param == "wallet") {
            console.log("disconnect wallet");
            if (this.wallet_socket != null) {
                this.wallet_socket.close();
            }
        } else if (cb_param == "service") {
            console.log("disconnect service");
            if (this.service_socket != null) {
                this.service_socket.close();
            }
        } else {
            console.log("unknown cb_param: " + cb_param);
        }
    }
}

window.app = new PurseApp();

function drawFirstUi() {
    window.app.drawPurseUi()
    var mm = new MoneysocketMessage("REQUEST");
    console.log("mm: " + mm.toJson());
    var mr = new MoneysocketRequest("PING");
    console.log("mr: " + mr.toJson());
    console.log("subclasses: " + Object.keys(MESSAGE_SUBCLASSES));
    var rr = new RequestRendezvous("abc123");
    console.log("rr: " + rr.toJson());
}

window.addEventListener("load", drawFirstUi());
