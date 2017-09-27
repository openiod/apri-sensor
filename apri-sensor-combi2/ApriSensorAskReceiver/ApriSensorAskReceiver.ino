
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
//#include <AES.h>

// this application can act like a reciever (base station reciever) or extender for extend the range of wireless transmit.

const bool extender = false;  // true=receive and re-transmit; false=recieve only and send to connected base station   

const byte channelId4b = 7;  // 1-15 left 4 bits for channel identification, xxxx .... -> 1111 0000 = channel 15. NOT ZERO!
const byte extenderId2b = 2; // 1-7 (0 is for sensor, base reciever can be anything) left most 2 bits of right most 4 bits for extender identification, .... xx.. = extender 3 of channel 15 
// extender skips messages sent by the same extender by checking extenderId bits. Retransmitted messages get +1 until rightmost two bits = 11 
// when extending a message, the channelId will ++ (plus one) until max '11b' = 3
// sensor sends ccccxx00. first extender: ccccxx01, second ccccxx10, third and last try: ccccxx11
// extender fills in its own extenderid when extending a message.
const bool debug = true;  //true for extra log messages

#include "ApriSensorAskReceiver.h"

 
void setup()
{
  Serial.begin(9600);	// Debugging only
  Serial.print("I@Receiver init succeeded");
  Serial.print("\r\n");
}

void loop()
{
  Serial.println("I@RF receiver init");
  aprisensor_ns::Receiver myReceiver;
  myReceiver.init();
//  if (myReceiver.isActive() ) {
    Serial.print("I@RF receiver is ready to receive data");
    Serial.print("\r\n");
//  }

  while (1) {
//    if (myReceiver.isActive() ) {
      myReceiver.receiveData();
//    }
  }

}

