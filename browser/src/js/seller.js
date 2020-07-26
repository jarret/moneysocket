// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const Connection = require("./connection.js").Connection;
const DomUtl = require('./domutl.js').DomUtl;
const WebsocketInterconnect = require('./moneysocket/socket/websocket.js').WebsocketInterconnect;
const WebsocketConnectUi = require('./moneysocket/socket/websocket_ui.js').WebsocketConnectUi;

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

    Draw(style) {
        this.my_div = document.createElement("div");
        this.my_div.setAttribute("class", style);

        this.opinion_div = DomUtl.EmptyDiv(this.my_div);
        this.UpdateCurrentOpinion(this.opinion);

        DomUtl.DrawBr(this.my_div);
        DomUtl.DrawBr(this.my_div);

        DomUtl.DrawButton(this.my_div, "Bullish",
            (function() {this.UpdateCurrentOpinion("Bullish")}).bind(this));
        DomUtl.DrawBr(this.my_div);
        DomUtl.DrawButton(this.my_div, "Bearish",
            (function() {this.UpdateCurrentOpinion("Bearish")}).bind(this));
        DomUtl.DrawBr(this.my_div);
        DomUtl.DrawButton(this.my_div, "ETH is Scaling",
            (function() {this.UpdateCurrentOpinion("ETH is Scaling")}).bind(this));
        DomUtl.DrawBr(this.my_div);
        DomUtl.DrawButton(this.my_div, "(Renege)",
            (function() {this.UpdateCurrentOpinion("(Renege)")}).bind(this));

        DomUtl.DrawBr(this.my_div);
        DomUtl.DrawBr(this.my_div);

        this.service_role_div = DomUtl.EmptyDiv(this.my_div);
        DomUtl.DrawText(this.service_role_div, "Service Role: ");
        DomUtl.DrawColoredText(this.service_role_div, "Not Connected", "red");

        DomUtl.DrawBr(this.my_div);

        this.wallet_role_div = DomUtl.EmptyDiv(this.my_div);
        DomUtl.DrawText(this.wallet_role_div, "Wallet Role: ");
        DomUtl.DrawColoredText(this.wallet_role_div, "Not Connected", "red");

        DomUtl.DrawBr(this.my_div);

        this.parent_div.appendChild(this.my_div);
    }

    UpdateCurrentOpinion(opinion) {
        this.opinion = opinion
        DomUtl.DeleteChildren(this.opinion_div)
        DomUtl.DrawText(this.opinion_div, "Current Opinion: ");
        DomUtl.DrawBr(this.opinion_div);
        DomUtl.DrawBigText(this.opinion_div, opinion);
    }

    UpdateWalletRoleConnected() {
        DomUtl.DeleteChildren(this.wallet_role_div)
        DomUtl.DrawText(this.wallet_role_div, "Wallet Role: ");
        DomUtl.DrawColoredText(this.wallet_role_div, "Connected", "green");
    }

    UpdateWalletRoleConnecting() {
        DomUtl.DeleteChildren(this.wallet_role_div)
        DomUtl.DrawText(this.wallet_role_div, "Wallet Role: ");
        DomUtl.DrawColoredText(this.wallet_role_div, "Connecting", "orange");
    }

    UpdateWalletRoleDisconnected() {
        DomUtl.DeleteChildren(this.wallet_role_div)
        DomUtl.DrawText(this.wallet_role_div, "Wallet Role: ");
        DomUtl.DrawColoredText(this.wallet_role_div, "Not Connected", "red");
    }

    UpdateServiceRoleConnected() {
        DomUtl.DeleteChildren(this.service_role_div)
        DomUtl.DrawText(this.service_role_div, "Service Role: ");
        DomUtl.DrawColoredText(this.service_role_div, "Connected", "green");
    }

    UpdateServiceRoleConnecting() {
        DomUtl.DeleteChildren(this.service_role_div)
        DomUtl.DrawText(this.service_role_div, "Service Role: ");
        DomUtl.DrawColoredText(this.service_role_div, "Connecting", "orange");
    }

    UpdateServiceRoleDisconnected() {
        DomUtl.DeleteChildren(this.service_role_div)
        DomUtl.DrawText(this.service_role_div, "Service Role: ");
        DomUtl.DrawColoredText(this.service_role_div, "Not Connected", "red");
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

        this.default_wallet_ws_url = "ws://127.0.0.1:11063";
        this.default_service_ws_url = "ws://127.0.0.1:11055";

        this.wi = new WebsocketInterconnect(this);
    }


    DrawSellerUi() {
        this.my_div = document.createElement("div");
        this.my_div.setAttribute("class", "bordered");
        DomUtl.DrawTitle(this.my_div, "Opinion Seller App", "h1");

        this.psu = new OpinionUi(this.my_div);
        this.psu.Draw("center");
        DomUtl.DrawBr(this.my_div);

        this.scu = new WebsocketConnectUi(this.my_div,
                                          "SERVICE Connect to External WALLET",
                                          this.default_service_ws_url, this,
                                          "service");
        this.scu.Draw("left");

        this.wcu = new WebsocketConnectUi(this.my_div,
                                          "WALLET Connect to Buyer SERVICE",
                                          this.default_wallet_ws_url, this,
                                          "wallet");
        this.wcu.Draw("right");
        DomUtl.DrawBr(this.my_div);

        DomUtl.DrawBr(this.my_div);

        this.parent_div.appendChild(this.my_div);
    }


    NewSocket(socket, cb_param) {
        console.log("got new socket: " + socket.ToString());
        console.log("cb_param: " + cb_param);
        if (cb_param == "wallet") {
            this.wallet_socket = socket;
            this.psu.UpdateWalletRoleConnected();
            this.wcu.DrawDisconnectButton();
            // TODO wallet role object,
        } else if (cb_param == "service") {
            this.service_socket = socket;
            this.psu.UpdateServiceRoleConnected();
            this.scu.DrawDisconnectButton();
            // TODO service role object,
        } else {
            console.log("unknown cb param");
        }
    }

    SocketClose(socket, cb_param) {
        console.log("got socket close: " + socket.ToString());
        console.log("cb_param: " + cb_param);
        if (cb_param == "wallet") {
            console.log("got wallet socket closed");
            this.wallet_socket = null;
            this.psu.UpdateWalletRoleDisconnected();
            this.wcu.DrawConnectButton();
            // TODO wallet role object
        } else if (cb_param == "service") {
            console.log("got service socket closed");
            this.service_socket = null;
            this.psu.UpdateServiceRoleDisconnected();
            this.scu.DrawConnectButton();
            // TODO service role object
        } else {
            console.log("got unknown socket closed");
        }
    }

    Connect(cb_param) {
        if (cb_param == "wallet") {
            var ws_url = this.wcu.GetWsUrl();
            console.log("connect wallet: " + ws_url);
            this.psu.UpdateWalletRoleConnecting();
            this.wcu.DrawConnecting();
            this.wi.Connect(ws_url, "wallet");
        } else if (cb_param == "service") {
            var ws_url = this.scu.GetWsUrl();
            console.log("connect service: " + ws_url);
            this.psu.UpdateServiceRoleConnecting();
            this.scu.DrawConnecting();
            this.wi.Connect(ws_url, "service");
        } else {
            console.log("unknown cb_param: " + cb_param);
        }
    }

    Disconnect(cb_param) {
        if (cb_param == "wallet") {
            console.log("disconnect wallet");
            if (this.wallet_socket != null) {
                this.wallet_socket.Close();
            }
        } else if (cb_param == "service") {
            console.log("disconnect service");
            if (this.service_socket != null) {
                this.service_socket.Close();
            }
        } else {
            console.log("unknown cb_param: " + cb_param);
        }
    }
}

window.app = new SellerApp();

function DrawFirstUi() {
    window.app.DrawSellerUi()
}

window.addEventListener("load", DrawFirstUi());
