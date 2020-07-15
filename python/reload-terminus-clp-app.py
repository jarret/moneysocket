#!/usr/bin/env python3
# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import os
import sys
import subprocess
import shutil

PLUGIN_DIR = os.path.join(os.path.expanduser("~"), ".lightning/plugins")

if not os.path.exists(PLUGIN_DIR):
    sys.exit("does not exist: %s" % PLUGIN_DIR)

print(PLUGIN_DIR)

PLUGIN_NAME = os.path.join(PLUGIN_DIR, "terminus-clp-app.py")

print(PLUGIN_NAME)

SRC_DIR = os.path.dirname(os.path.abspath(__file__))

print("src_dir: %s" % SRC_DIR)

r = subprocess.call(["lightning-cli", "plugin", "stop", PLUGIN_NAME])
print(r)

STUFF_TO_COPY = ["moneysocket", "terminus", "utl", "terminus-clp-app.py"]

for item in STUFF_TO_COPY:
    dst_path = os.path.join(PLUGIN_DIR, item)
    src_path = os.path.join(SRC_DIR, item)
    print("src: %s  dst: %s" % (src_path, dst_path))
    if os.path.isdir(src_path):
        if os.path.exists(dst_path):
            shutil.rmtree(dst_path)
        shutil.copytree(src_path, dst_path)
    else:
        if os.path.exists(dst_path):
            os.remove(dst_path)
        shutil.copyfile(src_path, dst_path)
        shutil.copymode(src_path, dst_path)

r = subprocess.call(["lightning-cli", "plugin", "start", PLUGIN_NAME])
print(r)
