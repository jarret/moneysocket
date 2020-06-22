const Utils = require('./utils.js').Utils;

class Connection {
    constructor(div, title, defaultWsUri, div_class) {
        this.div = div;
        this.title = title;
        this.defaultWsUri = defaultWsUri;
        this.input = null;
        this.ws = null;
        this.ui_div = null;
        this.connect_div = null;
        this.balance_div = null;
        this.connected = false;
        this.div_class = div_class;
    }

    DrawConnectUi() {
        const title = this.title;
        this.ui_div = document.createElement("div");
        this.ui_div.setAttribute("class", this.div_class);
        Utils.DrawTitle(this.ui_div, this.title);
        Utils.DrawBr(this.ui_div);
        this.input = Utils.DrawTextInput(this.ui_div, this.defaultWsUri);
        this.connect_button = Utils.DrawButton(this.ui_div, "Connect",
            function() {window.app.ConnectSocket(title)});
        this.disconnect_button = Utils.DrawButton(this.ui_div, "Disconnect",
            function() {window.app.DisconnectSocket(title)});
        Utils.DrawBr(this.ui_div);
        Utils.DrawBr(this.ui_div);
        this.connect_div = Utils.EmptyDiv(this.ui_div);
        Utils.DrawText(this.connect_div, "Disconnected");
        Utils.DrawBr(this.ui_div);
        this.balance_div = Utils.EmptyDiv(this.ui_div);
        this.push_button_div = Utils.EmptyDiv(this.ui_div);
        this.pull_button_div = Utils.EmptyDiv(this.ui_div);
        this.div.appendChild(this.ui_div);
    }

    UpdateBalance(msats) {
        Utils.DeleteChildren(this.balance_div);
        Utils.DrawBalance(this.balance_div, msats);
        Utils.DrawBr(this.balance_div);
    }

    SetDisconnect() {
        Utils.DeleteChildren(this.connect_div);
        Utils.DeleteChildren(this.balance_div);
        Utils.DeleteChildren(this.push_button_div);
        Utils.DeleteChildren(this.pull_button_div);
        Utils.DrawText(this.connect_div, "Disconnected");
    }

    SetConnect() {
        const title = this.title;
        Utils.DeleteChildren(this.connect_div);
        Utils.DrawText(this.connect_div, "Connected");
        Utils.DrawBalance(this.balance_div, 0.0);
        Utils.DrawBr(this.balance_div);
        this.push_button = Utils.DrawButton(this.push_button_div, "Push 1 sat",
            function() {window.app.PushSat(title)});
        this.pull_button = Utils.DrawButton(this.pull_button_div, "Pull 1 sat",
            function() {window.app.PullSat(title)});
        Utils.DrawBr(this.pull_button_div);
        Utils.DrawBr(this.pull_button_div);
    }

    ConnectSocket() {
        if (this.connected) {
            console.log("already connected");
            return;
        }
        const title = this.title;
        console.log(this.input.value);
        this.ws = new WebSocket(this.input.value);
        this.ws.onmessage = function (event) {
            console.log("ws recv: " +  event.data);
            window.app.WsIncomingEvent(title, event.data);
        }
        this.connected = true;
        this.SetConnect();
    }

    DisconnectSocket() {
        if (! this.connected) {
            console.log("already disconnected");
            return;
        }
        console.log(this.input.value);
        this.ws.close();
        this.connected = false;
        this.SetDisconnect();
    }


    SendTextRequest(dict) {
        if (! this.connected) {
            console.log("cannot send when disconnected");
            return;
        }
        this.ws.send(JSON.stringify(dict));
    }
}


exports.Connection = Connection;
