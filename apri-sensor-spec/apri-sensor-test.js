/*
** Module: apri-sensor-test
**
**
**
*/

"use strict"; // This is for your code to comply with the ECMAScript 5 standard.

var buff = new Buffer.from("40100000000000004014000000000000", "hex");
var ab = new ArrayBuffer(buff.length);

//return

function stringToArrayBuffer(string) {
  const arrayBuffer = new ArrayBuffer(string.length);
  const arrayBufferView = new Uint8Array(arrayBuffer);
  for (let i = 0; i < string.length; i++) {
    arrayBufferView[i] = string.charCodeAt(i);
  }
  return arrayBuffer;
}

function arrayBufferToString(buffer) {
  return String.fromCharCode.apply(null, new Uint8Array(buffer));
}

const helloWorld = stringToArrayBuffer('Hello, World!'); // "ArrayBuffer" (Uint8Array)
const encodedString = new Buffer.from(helloWorld).toString('base64'); // "string"
const decodedBuffer = Buffer.from(encodedString, 'base64'); // "Buffer"
const decodedArrayBuffer = new Uint8Array(decodedBuffer).buffer; // "ArrayBuffer" (Uint8Array)

console.log(arrayBufferToString(decodedArrayBuffer)); // prints "Hello, World!"
