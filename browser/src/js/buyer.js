// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const Connection = require("./connection.js").Connection;
const Utils = require('./utils.js').Utils;
const WebsocketInterconnect = require('./moneysocket/socket/websocket.js').WebsocketInterconnect;
const WebsocketConnectUi = require('./moneysocket/socket/websocket_ui.js').WebsocketConnectUi;

class BuyerUi {
    constructor(div) {
        this.parent_div = div;
        this.my_div = null;
        this.my_seller_role_div = null;
        this.seller_service_role_div = null;
        this.wallet_counterpart_div = null;
        this.opinion = "N/A";
    }

    Draw(style) {
        this.my_div = document.createElement("div");
        this.my_div.setAttribute("class", style);

        this.opinion_div = Utils.EmptyDiv(this.my_div);
        this.UpdateCurrentOpinion(this.opinion);

        Utils.DrawBr(this.my_div);
        Utils.DrawBr(this.my_div);

        Utils.DrawButton(this.my_div, "Start",
            (function() {this.StartBuying()}).bind(this));
        Utils.DrawBr(this.my_div);
        Utils.DrawButton(this.my_div, "Stop",
            (function() {this.StopBuying()}).bind(this));

        Utils.DrawBr(this.my_div);
        Utils.DrawBr(this.my_div);

        this.seller_service_role_div = Utils.EmptyDiv(this.my_div);
        Utils.DrawText(this.seller_service_role_div, "Seller Service Role: ");
        Utils.DrawColoredText(this.seller_service_role_div, "Not Connected", "red");

        Utils.DrawBr(this.my_div);

        this.my_service_role_div = Utils.EmptyDiv(this.my_div);
        Utils.DrawText(this.my_service_role_div, "My Service Role: ");
        Utils.DrawColoredText(this.my_service_role_div, "Not Connected", "red");

        Utils.DrawBr(this.my_div);

        this.parent_div.appendChild(this.my_div);
    }

    StartBuyingOpinions(opinion) {
        console.log("starting");
    }

    StopBuyingOpinions(opinion) {
        console.log("stopping");
    }

    UpdateCurrentOpinion(opinion) {
        this.opinion = opinion
        Utils.DeleteChildren(this.opinion_div)
        Utils.DrawText(this.opinion_div, "Purchased Opinion: ");
        Utils.DrawBr(this.opinion_div);
        Utils.DrawBigText(this.opinion_div, opinion);
    }

    UpdateMyServiceRoleConnected() {
        Utils.DeleteChildren(this.my_service_role_div)
        Utils.DrawText(this.my_service_role_div, "My Service Role: ");
        Utils.DrawColoredText(this.my_service_role_div, "Connected", "green");
    }

    UpdateMyServiceRoleConnecting() {
        Utils.DeleteChildren(this.my_service_role_div)
        Utils.DrawText(this.my_service_role_div, "My Service Role: ");
        Utils.DrawColoredText(this.my_service_role_div, "Connecting", "orange");
    }

    UpdateMyServiceRoleDisconnected() {
        Utils.DeleteChildren(this.my_service_role_div)
        Utils.DrawText(this.my_service_role_div, "My Service Role: ");
        Utils.DrawColoredText(this.my_service_role_div, "Not Connected", "red");
    }

    UpdateSellerServiceRoleConnected() {
        Utils.DeleteChildren(this.seller_service_role_div)
        Utils.DrawText(this.seller_service_role_div, "Seller Service Role: ");
        Utils.DrawColoredText(this.seller_service_role_div, "Connected", "green");
    }

    UpdateSellerServiceRoleConnecting() {
        Utils.DeleteChildren(this.seller_service_role_div)
        Utils.DrawText(this.seller_service_role_div, "Seller Service Role: ");
        Utils.DrawColoredText(this.seller_service_role_div, "Connecting", "orange");
    }

    UpdateSellerServiceRoleDisconnected() {
        Utils.DeleteChildren(this.seller_service_role_div)
        Utils.DrawText(this.seller_service_role_div, "Seller Service Role: ");
        Utils.DrawColoredText(this.seller_service_role_div, "Not Connected", "red");
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

        this.default_my_service_ws_url = "ws://127.0.0.1:11064";
        this.default_seller_service_ws_url = "ws://127.0.0.1:11065";

        this.wi = new WebsocketInterconnect(this);
    }


    DrawBuyerUi() {
        this.my_div = document.createElement("div");
        this.my_div.setAttribute("class", "bordered");
        Utils.DrawTitle(this.my_div, "Opinion Buyer App", "h1");

        this.psu = new BuyerUi(this.my_div);
        this.psu.Draw("center");
        Utils.DrawBr(this.my_div);

        this.sscu = new WebsocketConnectUi(this.my_div,
                                           "SERVICE Connect to Seller WALLET",
                                           this.default_seller_service_ws_url, this,
                                           "seller_service");
        this.sscu.Draw("left");

        this.mscu = new WebsocketConnectUi(this.my_div,
                                           "SERVICE Connect to My WALLET",
                                           this.default_my_service_ws_url, this,
                                           "my_service");
        this.mscu.Draw("right");
        Utils.DrawBr(this.my_div);

        Utils.DrawBr(this.my_div);

        this.parent_div.appendChild(this.my_div);
    }


    NewSocket(socket, cb_param) {
        console.log("got new socket: " + socket.ToString());
        console.log("cb_param: " + cb_param);
        if (cb_param == "seller_service") {
            this.seller_service_socket = socket;
            this.psu.UpdateSellerServiceRoleConnected();
            this.sscu.DrawDisconnectButton();
            // TODO wallet role object,
        } else if (cb_param == "my_service") {
            this.my_service_socket = socket;
            this.psu.UpdateMyServiceRoleConnected();
            this.mscu.DrawDisconnectButton();
            // TODO service role object,
        } else {
            console.log("unknown cb param");
        }
    }

    SocketClose(socket, cb_param) {
        console.log("got socket close: " + socket.ToString());
        console.log("cb_param: " + cb_param);
        if (cb_param == "seller_service") {
            console.log("got seller servce socket closed");
            this.seller_service_socket = null;
            this.psu.UpdateSellerServiceRoleDisconnected();
            this.sscu.DrawConnectButton();
            // TODO wallet role object
        } else if (cb_param == "my_service") {
            console.log("got my service socket closed");
            this.my_service_socket = null;
            this.psu.UpdateMyServiceRoleDisconnected();
            this.mscu.DrawConnectButton();
            // TODO service role object
        } else {
            console.log("got unknown socket closed");
        }
    }

    Connect(cb_param) {
        if (cb_param == "seller_service") {
            var ws_url = this.sscu.GetWsUrl();
            console.log("connect seller service: " + ws_url);
            this.psu.UpdateSellerServiceRoleConnecting();
            this.sscu.DrawConnecting();
            this.wi.Connect(ws_url, "seller_service");
        } else if (cb_param == "my_service") {
            var ws_url = this.mscu.GetWsUrl();
            console.log("connect my service: " + ws_url);
            this.psu.UpdateMyServiceRoleConnecting();
            this.mscu.DrawConnecting();
            this.wi.Connect(ws_url, "my_service");
        } else {
            console.log("unknown cb_param: " + cb_param);
        }
    }

    Disconnect(cb_param) {
        if (cb_param == "seller_service") {
            console.log("disconnect wallet");
            if (this.seller_service_socket != null) {
                this.seller_service_socket.Close();
            }
        } else if (cb_param == "my_service") {
            console.log("disconnect service");
            if (this.my_service_socket != null) {
                this.my_service_socket.Close();
            }
        } else {
            console.log("unknown cb_param: " + cb_param);
        }
    }
}

window.app = new BuyerApp();

function DrawFirstUi() {
    window.app.DrawBuyerUi()
}

window.addEventListener("load", DrawFirstUi());
