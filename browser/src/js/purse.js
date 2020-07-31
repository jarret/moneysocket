// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const DomUtl = require('./domutl.js').DomUtl;
const WebsocketInterconnect = require(
    './moneysocket/socket/websocket.js').WebsocketInterconnect;

const WebsocketLocation = require(
    './moneysocket/beacon/location/websocket.js').WebsocketLocation;

const BeaconUi = require('./beacon_ui.js').BeaconUi;
const ConnectProgress = require('./connect_progress.js').ConnectProgress;
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

const Role = require('./moneysocket/core/role.js').Role;


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

        this.drawRoleConnectionState(this.wallet_role_div, "Wallet Role",
                                     "DISCONNECTED");

        DomUtl.drawBr(this.my_div);

        this.service_role_div = DomUtl.emptyDiv(this.my_div);
        this.drawRoleConnectionState(this.service_role_div, "Service Role",
                                     "DISCONNECTED");

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

    //////////////////////////////////////////////////////////////////////////

    drawRoleConnectionState(role_div, role_title, state) {
        DomUtl.deleteChildren(role_div)
        DomUtl.drawText(role_div, role_title);
        var p = new ConnectProgress(role_div);
        p.draw(state);
    }

    updateWalletConnectionState(state) {
        this.drawRoleConnectionState(this.wallet_role_div, "Wallet Role",
                                     state);
    }

    updateServiceConnectionState(state) {
        this.drawRoleConnectionState(this.service_role_div, "Service Role",
                                     state);
    }

    //////////////////////////////////////////////////////////////////////////

/*
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
*/

    updateWalletCounterpartBalance(msats) {
        DomUtl.deleteChildren(this.wallet_counterpart_div)
        DomUtl.drawText(this.wallet_counterpart_div,
            "Wallet Provider Balance: " + DomUtl.balanceFmt(msats));
    }

}

class PurseApp {
    constructor() {
        this.parent_div = document.getElementById("ui");
        this.my_div = null;
        this.purse_ui = null;
        this.wallet_ui = null;
        this.service_ui = null;

        this.wallet_role = null;
        this.service_role = null;

        this.wallet_socket = null;
        this.service_socket = null;

        this.wi = new WebsocketInterconnect(this);
    }


    drawPurseUi() {
        this.my_div = document.createElement("div");
        this.my_div.setAttribute("class", "bordered");
        DomUtl.drawTitle(this.my_div, "Purse App", "h1");

        this.purse_ui = new PurseStatusUi(this.my_div);
        this.purse_ui.draw("center");

        DomUtl.drawBr(this.my_div);
        var wtitle = "Provide WALLET for external consumer";
        this.wallet_ui = new BeaconUi(this.my_div, wtitle, this, "wallet");
        this.wallet_ui.draw("left");

        var stitle = "Consume external WALLET provider";
        this.service_ui = new BeaconUi(this.my_div, stitle, this, "service");
        this.service_ui.draw("right");
        DomUtl.drawBr(this.my_div);
        DomUtl.drawBr(this.my_div);

        this.parent_div.appendChild(this.my_div);
    }

    //////////////////////////////////////////////////////////////////////////
    // WebsocketInterconnect callbacks:
    //////////////////////////////////////////////////////////////////////////

    newSocket(socket, cb_param) {
        // interconnect announcing new socket
        console.log("got new socket: " + socket.toString());
        console.log("cb_param: " + cb_param);

        var role_info = cb_param;

        if (role_info['role'] == "wallet") {
            this.wallet_socket = socket;
            this.wallet_role = new Role("wallet");

            this.purse_ui.updateWalletConnectionState(
                "REQUESTING_RENDEZVOUS");
            this.wallet_ui.switchMode("REQUESTING_RENDEZVOUS");

            //this.wallet_role.startRendezvous();

        } else if (role_info['role'] == "service") {
            this.service_socket = socket;
            this.purse_ui.updateServiceRoleConnected();
            this.service_ui.drawDisconnectButton();

            this.purse_ui.updateServiceConnectionState(
                "REQUESTING_RENDEZVOUS");
            this.service_ui.switchMode("REQUESTING_RENDEZVOUS");

            this.service_role = new Role("service");

            //this.service_role.startRendezvous();

        } else {
            console.log("unknown cb param");
        }
    }

    socketClose(socket, cb_param) {
        // interconnect announcing socket cloesed
        console.log("got socket close: " + socket.toString());
        console.log("cb_param: " + cb_param);
        if (cb_param == "wallet") {
            console.log("got wallet socket closed");
            this.wallet_socket = null;
            this.wallet_role = null;

            this.purse_ui.updateWalletConnectionState("DISCONNECTED");
            this.wallet_ui.switchMode("ENTER_BEACON");


        } else if (cb_param == "service") {
            console.log("got service socket closed");
            this.service_socket = null;
            this.service_role = null;

            this.purse_ui.updateServiceConnectionState("DISCONNECTED");
            this.service_ui.switchMode("ENTER_BEACON");
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
        if (cb_param == "wallet") {
            if (! (location instanceof WebsocketLocation)) {
                this.purse_ui.updateWalletConnectionState("CONNECTION_FAILED");
                this.wallet_ui.switchMode("CONNECTION_FAILED");
                return;
            }
            var url = location.toWsUrl();
            var role_info = {'role':   'wallet',
                             'beacon': beacon};
            console.log("connect wallet: " + url);
            this.purse_ui.updateWalletConnectionState("CONNECTING_WEBSOCKET");
            this.wallet_ui.switchMode("CONNECTING_WEBSOCKET");
            this.wi.connect(url, role_info);
        } else if (cb_param == "service") {
            if (! (location instanceof WebsocketLocation)) {
                this.purse_ui.updateWalletConnectionState("CONNECTION_FAILED");
                this.service_ui.switchMode("CONNECTION_FAILED");
                return;
            }
            var url = location.toWsUrl();
            var role_info = {'role':   'service',
                             'beacon': beacon};
            console.log("connect service: " + url);
            this.purse_ui.updateServiceConnectionState("CONNECTING_WEBSOCKET");
            this.service_ui.switchMode("CONNECTING_WEBSOCKET");
            this.wi.connect(url, role_info);
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
            this.purse_ui.updateWalletConnectionState("DISCONNECTED");
        } else if (cb_param == "service") {
            console.log("disconnect service");
            if (this.service_socket != null) {
                this.service_socket.close();
            }
            this.purse_ui.updateServiceConnectionState("DISCONNECTED");
        } else {
            console.log("unknown cb_param: " + cb_param);
        }
    }
}

window.app = new PurseApp();


//////////////////////////////////////////////////////////////////////////
// some random test stuff:
//////////////////////////////////////////////////////////////////////////

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



    //var encoded = MoneysocketCrypt.wireEncode(rr, ss);
    //console.log("rr encoded: " + BinUtl.b2h(encoded));

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
    window.app.drawPurseUi()

    //smokeTest();
}

window.addEventListener("load", drawFirstUi());
