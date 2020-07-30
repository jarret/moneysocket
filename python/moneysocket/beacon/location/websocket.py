# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

from moneysocket.utl.third_party.bolt.tlv import Tlv
from moneysocket.utl.third_party.bolt.namespace import Namespace
from moneysocket.utl.third_party.bolt.bigsize import BigSize


HOST_TLV_TYPE = 0
USE_TLS_TLV_TYPE = 1
USE_TLS_ENUM_VALUE = {0: False,
                      1: True}
PORT_TLV_TYPE = 2
DEFAULT_TLS_PORT = 443
DEFAULT_NO_TLS_PORT = 80

class WebsocketLocation():
    WEBSOCKET_LOCATION_TLV_TYPE = None

    def __init__(self, host, port=None, use_tls=True):
        self.use_tls = use_tls
        self.host = host
        self.port = port if port else (DEFAULT_TLS_PORT if use_tls else
                                       DEFAULT_NO_TLS_PORT)

    def __str__(self):
        return "%s://%s:%s" % ("wss" if self.use_tls else "ws", self.host,
                                self.port)

    def to_dict(self):
        return {'type':    "WebSocket",
                'host':    self.host,
                'port':    self.port,
                'use_tls': self.use_tls}


    @staticmethod
    def from_tlv(tlv):
        assert tlv.t == WebsocketLocation.WEBSOCKET_LOCATION_TLV_TYPE
        tlvs = {tlv.t: tlv for tlv in Namespace.iter_tlvs(tlv.v)}
        if HOST_TLV_TYPE not in tlvs.keys():
            return None, "no host tlv given"
        try:
            host = tlvs[HOST_TLV_TYPE].v.decode("utf8", errors="strict")
        except:
            return None, "error decoding host string"

        if USE_TLS_TLV_TYPE not in tlvs.keys():
            use_tls = True
        else:
            enum_value, remainder, err = BigSize.pop(tlvs[USE_TLS_TLV_TYPE].v)
            if err:
                return None, err
            if enum_value not in USE_TLS_ENUM_VALUE.keys():
                return None, "error decoding use_tls setting"
            use_tls = USE_TLS_ENUM_VALUE[enum_value]

        if PORT_TLV_TYPE not in tlvs.keys():
            port = DEFAULT_TLS_PORT if use_tls else DEFAULT_NO_TLS_PORT
        else:
            port, _, err = BigSize.pop(tlvs[PORT_TLV_TYPE].v)
            if err:
                return None, err
        return WebsocketLocation(host, port=port, use_tls=use_tls), None

    def encode_tlv(self):
        encoded = Tlv(HOST_TLV_TYPE, self.host.encode("utf8")).encode()
        if not self.use_tls:
            encoded += Tlv(USE_TLS_TLV_TYPE, BigSize.encode(0)).encode()
            if self.port != DEFAULT_NO_TLS_PORT:
                encoded += Tlv(PORT_TLV_TYPE,
                               BigSize.encode(self.port)).encode()
        else:
            if self.port != DEFAULT_TLS_PORT:
                encoded += Tlv(PORT_TLV_TYPE,
                               BigSize.encode(self.port)).encode()

        return Tlv(WebsocketLocation.WEBSOCKET_LOCATION_TLV_TYPE,
                   encoded).encode()
