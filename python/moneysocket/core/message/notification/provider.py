# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import string
import json

from moneysocket.core.message.notification.notification import (
    MoneysocketNotification)

class NotifyProvider(MoneysocketNotification):
    MUST_BE_CLEARTEXT = False

    def __init__(self, provider_uuid, request_reference_uuid=None, payer=False,
                 payee=False, msats=None):
        super().__init__("NOTIFY_PROVIDER",
                         request_reference_uuid=request_reference_uuid)
        self['provider_uuid'] = str(provider_uuid)
        # will this provider pay outgoing invoices
        self['payer'] = payer
        # will this provider generate invoices for incoming payments
        self['payee'] = payee
        # balance to advertize as being available
        self['msats'] = msats

    @staticmethod
    def cast_class(msg_dict):
        c = NotifyProvider(msg_dict['provider_uuid'],
            request_reference_uuid=msg_dict['request_reference_uuid'],
            payer=msg_dict['payer'], payee=msg_dict['payee'],
            msats=msg_dict['msats'])
        c.update(msg_dict)
        return c

    @staticmethod
    def check_valid_msg_dict(msg_dict):
        if 'provider_uuid' not in msg_dict.keys():
            return "no provider_uuid included"
        if type(msg_dict['provider_uuid']) != str:
            return "unknown provider_uuid type"
        try:
            _ = uuid.UUID(msg_dict['provider_uuid'])
        except:
            return "invalid provider_uuid"

        if type(msg_dict['payee']) != bool:
            return "payee must be True or False"
        if type(msg_dict['payer']) != bool:
            return "payer must be True or False"
        if msg_dict['msats'] != None:
            if type(msg_dict['msats']) != int:
                return "msats must be an integer"
            if msg_dict['msats'] < 0:
                return "msats must be a positive value"
        return None


MoneysocketNotification.NOTIFICATION_SUBCLASSES['NOTIFY_PROVIDER'] = (
    NotifyProvider)
