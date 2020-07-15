# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

from moneysocket.core.role import Role


class Service(Role):
    """ LN SERVICE role """
    def __init__(self, name):
        super().__init__(name)

