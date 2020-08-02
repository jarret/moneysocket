// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const DomUtl = require('./ui/domutl.js').DomUtl;
const WebsocketInterconnect = require(
    './moneysocket/socket/websocket.js').WebsocketInterconnect;
const BeaconUi = require('./ui/beacon.js').BeaconUi;

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

        this.seller_service_role_div = DomUtl.emptyDiv(this.my_div);
        DomUtl.drawText(this.seller_service_role_div, "Seller Service Role: ");
        DomUtl.drawColoredText(this.seller_service_role_div, "Not Connected",
                               "red");

        DomUtl.drawBr(this.my_div);

        this.my_service_role_div = DomUtl.emptyDiv(this.my_div);
        DomUtl.drawText(this.my_service_role_div, "My Service Role: ");
        DomUtl.drawColoredText(this.my_service_role_div, "Not Connected",
                               "red");

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

    updateMyServiceRoleConnected() {
        DomUtl.deleteChildren(this.my_service_role_div)
        DomUtl.drawText(this.my_service_role_div, "My Service Role: ");
        DomUtl.drawColoredText(this.my_service_role_div, "Connected", "green");
    }

    updateMyServiceRoleConnecting() {
        DomUtl.deleteChildren(this.my_service_role_div)
        DomUtl.drawText(this.my_service_role_div, "My Service Role: ");
        DomUtl.drawColoredText(this.my_service_role_div,
                               "Connecting", "orange");
    }

    updateMyServiceRoleDisconnected() {
        DomUtl.deleteChildren(this.my_service_role_div)
        DomUtl.drawText(this.my_service_role_div, "My Service Role: ");
        DomUtl.drawColoredText(this.my_service_role_div, "Not Connected", "red");
    }

    updateSellerServiceRoleConnected() {
        DomUtl.deleteChildren(this.seller_service_role_div)
        DomUtl.drawText(this.seller_service_role_div, "Seller Service Role: ");
        DomUtl.drawColoredText(this.seller_service_role_div,
                               "Connected", "green");
    }

    updateSellerServiceRoleConnecting() {
        DomUtl.deleteChildren(this.seller_service_role_div)
        DomUtl.drawText(this.seller_service_role_div, "Seller Service Role: ");
        DomUtl.drawColoredText(this.seller_service_role_div,
                               "Connecting", "orange");
    }

    updateSellerServiceRoleDisconnected() {
        DomUtl.deleteChildren(this.seller_service_role_div)
        DomUtl.drawText(this.seller_service_role_div, "Seller Service Role: ");
        DomUtl.drawColoredText(this.seller_service_role_div, "Not Connected",
                               "red");
    }
}

class BuyerApp {
    constructor() {
        this.parent_div = document.getElementById("ui");
        this.my_div = null;
        this.psu = null;
        this.mscu = null;
        this.sscu = null;

        this.my_service_socket = null;
        this.seller_service_socket = null;

        this.wi = new WebsocketInterconnect(this);
    }


    drawBuyerUi() {
        this.my_div = document.createElement("div");
        this.my_div.setAttribute("class", "bordered");
        DomUtl.drawTitle(this.my_div, "Opinion Buyer App", "h1");

        this.psu = new BuyerUi(this.my_div);
        this.psu.draw("center");
        DomUtl.drawBr(this.my_div);

        this.sscu = new BeaconUi(this.my_div,
                                 "SERVICE Connect to Seller WALLET",
                                 this, "seller_service");
        this.sscu.draw("left");

        this.mscu = new BeaconUi(this.my_div, "SERVICE Connect to My WALLET",
                                 this, "my_service");
        this.mscu.draw("right");
        DomUtl.drawBr(this.my_div);

        DomUtl.drawBr(this.my_div);

        this.parent_div.appendChild(this.my_div);
    }


    newSocket(socket, cb_param) {
        console.log("got new socket: " + socket.toString());
        console.log("cb_param: " + cb_param);
        if (cb_param == "seller_service") {
            this.seller_service_socket = socket;
            this.psu.updateSellerServiceRoleConnected();
            this.sscu.drawDisconnectButton();
            // TODO wallet role object,
        } else if (cb_param == "my_service") {
            this.my_service_socket = socket;
            this.psu.updateMyServiceRoleConnected();
            this.mscu.drawDisconnectButton();
            // TODO service role object,
        } else {
            console.log("unknown cb param");
        }
    }

    socketClose(socket, cb_param) {
        console.log("got socket close: " + socket.toString());
        console.log("cb_param: " + cb_param);
        if (cb_param == "seller_service") {
            console.log("got seller servce socket closed");
            this.seller_service_socket = null;
            this.psu.updateSellerServiceRoleDisconnected();
            this.sscu.drawConnectButton();
            // TODO wallet role object
        } else if (cb_param == "my_service") {
            console.log("got my service socket closed");
            this.my_service_socket = null;
            this.psu.updateMyServiceRoleDisconnected();
            this.mscu.drawConnectButton();
            // TODO service role object
        } else {
            console.log("got unknown socket closed");
        }
    }

    connect(cb_param) {
        if (cb_param == "seller_service") {
            var ws_url = this.sscu.getWsUrl();
            console.log("connect seller service: " + ws_url);
            this.psu.updateSellerServiceRoleConnecting();
            this.sscu.drawConnecting();
            this.wi.connect(ws_url, "seller_service");
        } else if (cb_param == "my_service") {
            var ws_url = this.mscu.getWsUrl();
            console.log("connect my service: " + ws_url);
            this.psu.updateMyServiceRoleConnecting();
            this.mscu.drawConnecting();
            this.wi.connect(ws_url, "my_service");
        } else {
            console.log("unknown cb_param: " + cb_param);
        }
    }

    disconnect(cb_param) {
        if (cb_param == "seller_service") {
            console.log("disconnect wallet");
            if (this.seller_service_socket != null) {
                this.seller_service_socket.close();
            }
        } else if (cb_param == "my_service") {
            console.log("disconnect service");
            if (this.my_service_socket != null) {
                this.my_service_socket.close();
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
