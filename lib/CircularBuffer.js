"use strict";

function CircularBuffer() {
  this._length = (1 << 15);
  this._buffer = new Uint8Array(this._length);
  this._currentPos = 0;
  this._insertPos = 0;
};

// get a slice of length n from the buffer
CircularBuffer.prototype.get = function(n) {
  if (!this.has(n)) {
    return null;
  }

  let ret = new Uint8Array(n);
  let realPos = this._currentPos % this._length;
  let maxElems = this.length - realPos;
  let nElems = 0;

  // wrap around
  if (n > maxElems) {
    ret.set(this._buffer.subarray(realPos, realPos + maxElems)); 
    nElems = maxElems;
    realPos = 0;
  }

  ret.set(this._buffer.subarray(realPos, realPos + n - nElems), nElems); 

  this._currentPos += n;
  return ret;
};


// are there at least n bytes to get?
CircularBuffer.prototype.has = function(n) {
  return this._insertPos - this._currentPos >= n;
};

// appends arr to the buffer
CircularBuffer.prototype.append = function(arr) {
  let realPos = this._insertPos % this._length;
  let maxElems = this._length - realPos;
  let nElems = 0;

  // need to wrap
  if (arr.length > maxElems) {
    this._buffer.set(arr.subarray(0, maxElems), realPos);
    nElems = maxElems;
    realPos = 0;
  }

  this._buffer.set(arr.subarray(nElems, arr.length - nElems), realPos);
  this._insertPos += arr.length;
};

exports.CircularBuffer = CircularBuffer;
