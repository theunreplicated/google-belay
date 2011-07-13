#!/bin/bash

# Copyright 2011 Google Inc. All Rights Reserved.
# 
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# 
#     http://www.apache.org/licenses/LICENSE-2.0
# 
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Necessary because of http://code.google.com/p/chromium/issues/detail?id=27185,
# we cannot symlink to these JS files from the extension.
# If the extension needs other lib files, this is the place to add them

# TODO(jpolitz): make this script more usable

cp ../belay/portQueue.js ./includes/
cp ../belay/caps.js ./includes/
