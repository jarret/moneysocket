// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const DomUtl = require('./domutl.js').DomUtl;
const WebsocketInterconnect = require(
    './moneysocket/socket/websocket.js').WebsocketInterconnect;
const BeaconUi = require('./beacon_ui.js').BeaconUi;

class OpinionUi {
    constructor(div) {
        this.parent_div = div;
        this.my_div = null;
        this.wallet_role_div = null;
        this.service_role_div = null;
        this.wallet_counterpart_div = null;
        this.opinion = "Bullish"
        this.opinion_1_div = null;
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

        this.service_role_div = DomUtl.emptyDiv(this.my_div);
        DomUtl.drawText(this.service_role_div, "Service Role: ");
        DomUtl.drawColoredText(this.service_role_div, "Not Connected", "red");

        DomUtl.drawBr(this.my_div);

        this.wallet_role_div = DomUtl.emptyDiv(this.my_div);
        DomUtl.drawText(this.wallet_role_div, "Wallet Role: ");
        DomUtl.drawColoredText(this.wallet_role_div, "Not Connected", "red");

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
}

class SellerApp {
    constructor() {
        this.parent_div = document.getElementById("ui");
        this.my_div = null;
        this.psu = null;
        this.wcu = null;
        this.scu = null;

        this.wallet_socket = null;
        this.service_socket = null;


        this.wi = new WebsocketInterconnect(this);
    }


    drawSellerUi() {
        this.my_div = document.createElement("div");
        this.my_div.setAttribute("class", "bordered");
        DomUtl.drawTitle(this.my_div, "Opinion Seller App", "h1");

        this.psu = new OpinionUi(this.my_div);
        this.psu.draw("center");
        DomUtl.drawBr(this.my_div);

        this.scu = new BeaconUi(this.my_div,
                                "SERVICE Connect to External WALLET",
                                this, "service");
        this.scu.draw("left");

        this.wcu = new BeaconUi(this.my_div, "WALLET Connect to Buyer SERVICE",
                                this, "wallet");
        this.wcu.draw("right");
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
            this.wcu.drawDisconnectButton();
            // TODO wallet role object,
        } else if (cb_param == "service") {
            this.service_socket = socket;
            this.psu.updateServiceRoleConnected();
            this.scu.drawDisconnectButton();
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
            this.wcu.drawConnectButton();
            // TODO wallet role object
        } else if (cb_param == "service") {
            console.log("got service socket closed");
            this.service_socket = null;
            this.psu.updateServiceRoleDisconnected();
            this.scu.drawConnectButton();
            // TODO service role object
        } else {
            console.log("got unknown socket closed");
        }
    }

    connect(cb_param) {
        if (cb_param == "wallet") {
            var ws_url = this.wcu.getWsUrl();
            console.log("connect wallet: " + ws_url);
            this.psu.updateWalletRoleConnecting();
            this.wcu.drawConnecting();
            this.wi.connect(ws_url, "wallet");
        } else if (cb_param == "service") {
            var ws_url = this.scu.getWsUrl();
            console.log("connect service: " + ws_url);
            this.psu.updateServiceRoleConnecting();
            this.scu.drawConnecting();
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

window.app = new SellerApp();

function drawFirstUi() {
    window.app.drawSellerUi()
}

window.addEventListener("load", drawFirstUi());
