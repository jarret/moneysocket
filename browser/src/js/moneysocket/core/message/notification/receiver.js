// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php



/* we need to require all the classes so they rgister to the REQUEST_SUBCLASSES
 * dictionary */

const NotifyError = require('./error.js').NotifyError;
const NotifyPong = require('./pong.js').NotifyPong;
const NotifyRendezvous = require('./rendezvous.js').NotifyRendezvous;
const NotifyRendezvousBecomingReady = require(
    './rendezvous_becoming_ready.js').NotifyRendezvousBecomingReady;

class NotificationReceiver {
}

exports.NotificationReceiver = NotificationReceiver;
