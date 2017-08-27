
/*------------------------------------------------------------------------------

  Application for receiving sensor data from one or more sensor units

  RF433 ASK receiver RadioHead, Implements a simplex (one-way) receiver with an Rx-B1 module

*/
/*

  Copyright 2017 Scapeler

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

*/

//-----------------------------------------------------------------------------
#include "ApriSensorAskReceiver.h"
//#include <AES.h>

void setup()
{
  Serial.begin(9600);	// Debugging only
  Serial.println("Receiver init succeeded");
}

void loop()
{
  Serial.println("RF receiver init");
  aprisensorRns::Receiver myReceiver;
  myReceiver.setState('On');
  myReceiver.init();
  //  myReceiver.setUnitId(UNIT_ID);
  if (myReceiver.isActive() ) {
    Serial.println("RF receiver is ready to receive data");
  }

  while (1) {
    if (myReceiver.isActive() ) {
      myReceiver.receiveData();
    }
  }

}

