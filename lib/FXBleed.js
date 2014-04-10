const { Cc, Ci } = require('chrome');
const TCPSocket = Cc["@mozilla.org/tcp-socket;1"]
                      .createInstance(Ci.nsIDOMTCPSocket);

let { uuid } = require('sdk/util/uuid');
//
// account to for type + len + 16 byte padding due to fragmentation at 2^14
const HBLENGTH = (1 << 14) - 19;

const CIPHER_SUITES = [
  0xc014, // TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA
  0xc00a, // TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA
  0xc022, // TLS_SRP_SHA_DSS_WITH_AES_256_CBC_SHA
  0xc021, // TLS_SRP_SHA_RSA_WITH_AES_256_CBC_SHA
  0x0039, // TLS_DHE_RSA_WITH_AES_256_CBC_SHA
  0x0038, // TLS_DHE_DSS_WITH_AES_256_CBC_SHA
  0x0088, // TLS_DHE_RSA_WITH_CAMELLIA_256_CBC_SHA
  0x0087, // TLS_DHE_DSS_WITH_CAMELLIA_256_CBC_SHA
  0x0087, // TLS_ECDH_RSA_WITH_AES_256_CBC_SHA
  0xc00f, // TLS_ECDH_ECDSA_WITH_AES_256_CBC_SHA
  0x0035, // TLS_RSA_WITH_AES_256_CBC_SHA
  0x0084, // TLS_RSA_WITH_CAMELLIA_256_CBC_SHA
  0xc012, // TLS_ECDHE_RSA_WITH_3DES_EDE_CBC_SHA
  0xc008, // TLS_ECDHE_ECDSA_WITH_3DES_EDE_CBC_SHA
  0xc01c, // TLS_SRP_SHA_DSS_WITH_3DES_EDE_CBC_SHA
  0xc01b, // TLS_SRP_SHA_RSA_WITH_3DES_EDE_CBC_SHA
  0x0016, // TLS_DHE_RSA_WITH_3DES_EDE_CBC_SHA
  0x0013, // TLS_DHE_DSS_WITH_3DES_EDE_CBC_SHA
  0xc00d, // TLS_ECDH_RSA_WITH_3DES_EDE_CBC_SHA
  0xc003, // TLS_ECDH_ECDSA_WITH_3DES_EDE_CBC_SHA
  0x000a, // TLS_RSA_WITH_3DES_EDE_CBC_SHA
  0xc013, // TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA
  0xc009, // TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA
  0xc01f, // TLS_SRP_SHA_DSS_WITH_AES_128_CBC_SHA
  0xc01e, // TLS_SRP_SHA_RSA_WITH_AES_128_CBC_SHA
  0x0033, // TLS_DHE_RSA_WITH_AES_128_CBC_SHA
  0x0032, // TLS_DHE_DSS_WITH_AES_128_CBC_SHA
  0x009a, // TLS_DHE_RSA_WITH_SEED_CBC_SHA
  0x0099, // TLS_DHE_DSS_WITH_SEED_CBC_SHA
  0x0045, // TLS_DHE_RSA_WITH_CAMELLIA_128_CBC_SHA
  0x0044, // TLS_DHE_DSS_WITH_CAMELLIA_128_CBC_SHA
  0xc00e, // TLS_ECDH_RSA_WITH_AES_128_CBC_SHA
  0xc004, // TLS_ECDH_ECDSA_WITH_AES_128_CBC_SHA
  0x002f, // TLS_RSA_WITH_AES_128_CBC_SHA
  0x0096, // TLS_RSA_WITH_SEED_CBC_SHA
  0x0041, // TLS_RSA_WITH_CAMELLIA_128_CBC_SHA
  0xc011, // TLS_ECDHE_RSA_WITH_RC4_128_SHA
  0xc007, // TLS_ECDHE_ECDSA_WITH_RC4_128_SHA
  0xc00c, // TLS_ECDH_RSA_WITH_RC4_128_SHA
  0xc002, // TLS_ECDH_ECDSA_WITH_RC4_128_SHA
  0x0005, // TLS_RSA_WITH_RC4_128_SHA
  0x0004, // TLS_RSA_WITH_RC4_128_MD5
  0x0015, // TLS_DHE_RSA_WITH_DES_CBC_SHA
  0x0012, // TLS_DHE_DSS_WITH_DES_CBC_SHA
  0x0009, // TLS_RSA_WITH_DES_CBC_SHA
  0x0014, // TLS_DHE_RSA_EXPORT_WITH_DES40_CBC_SHA
  0x0011, // TLS_DHE_DSS_EXPORT_WITH_DES40_CBC_SHA
  0x0008, // TLS_RSA_EXPORT_WITH_DES40_CBC_SHA
  0x0006, // TLS_RSA_EXPORT_WITH_RC2_CBC_40_MD5
  0x0003, // TLS_RSA_EXPORT_WITH_RC4_40_MD5
  0x00ff // Unknown
]

const HANDSHAKE_RECORD_TYPE = 0x16
const HEARTBEAT_RECORD_TYPE = 0x18
const ALERT_RECORD_TYPE = 0x15
const TLS_VERSION = {
  '1.0': 0x0301,
  '1.1': 0x0302,
  '1.2': 0x0303
}

// hardcode version for now
const VERSION = TLS_VERSION['1.1'];

function heartbeat() {
  var payload = new Uint8Array(3);
  payload[0] = 0x01;
  payload[1] = (HBLENGTH >> 8) & 0xFF;
  payload[2] = (HBLENGTH >> 0) & 0xFF;
  
  return ssl_record(HEARTBEAT_RECORD_TYPE, payload);
}

function client_hello() {
  var pos = 0;
  var hello_data = new Uint8Array(1024);
  
  //version
  hello_data[pos++] = (VERSION >> 8) & 0xFF;
  hello_data[pos++] = (VERSION >> 0) & 0xFF;

  // time
  var time_epoch = parseInt(new Date().getTime());
  hello_data[pos++] = (time_epoch >> 24) & 0xFF;
  hello_data[pos++] = (time_epoch >> 16) & 0xFF;
  hello_data[pos++] = (time_epoch >> 8) & 0xFF;
  hello_data[pos++] = (time_epoch >> 0) & 0xFF;

  // random data
  var rand = uuid()['number'].substring(0, 28); 
  for (var i = 0; i < rand.length; i++) {
    hello_data[pos++] = rand[i];
  }

  // session ID length
  hello_data[pos++] = 0x00;

  // Cipher suite length
  var c_length = CIPHER_SUITES.length * 2;
  hello_data[pos++] = (c_length >> 8) & 0xFF;
  hello_data[pos++] = (c_length >> 0) & 0xFF;
  
  // Cipher Suites
  for (var i = 0; i < CIPHER_SUITES.length; i++) {
    hello_data[pos++] = (CIPHER_SUITES[i] >> 8) & 0xFF;
    hello_data[pos++] = (CIPHER_SUITES[i] >> 0) & 0xFF;
  }

  hello_data[pos++] = 0x01; // Compression methods length
  hello_data[pos++] = 0x00; // Compression method: null

  hello_data[pos++] = 0x00; // extension data length
  hello_data[pos++] = 0x05; 

  hello_data[pos++] = 0x00; // Extension type (Heartbeat) 
  hello_data[pos++] = 0x0F; 
  hello_data[pos++] = 0x00; // Extension length 
  hello_data[pos++] = 0x01; 
  hello_data[pos++] = 0x01; // Extension data 


  console.log("ADDED " + pos + " " + (4 + pos));

  var data = new Uint8Array(4 + pos);
  data[0] = 0x01;           // Handshake Type: Client Hello 
  data[1] = 0x00;  
  data[2] = (pos >> 8) & 0xFF; // Length
  data[3] = (pos >> 0) & 0xFF;
  data.set(hello_data.subarray(0, pos), 4);

  return ssl_record(HANDSHAKE_RECORD_TYPE, data);
}

function ssl_record(type, data) {
  var record = new Uint8Array(5 + data.byteLength);
  record[0] = type;
  record[1] = (VERSION >> 8) & 0xFF;
  record[2] = (VERSION >> 0) & 0xFF;
  record[3] = (data.byteLength >> 8) & 0xFF;
  record[4] = (data.byteLength >> 0) & 0xFF;
  record.set(data, 5);
  return record.buffer;
}

function connect(server, port, opt) {
  
  try {
    var sock = TCPSocket.open(server, port, {binaryType: "arraybuffer"});

    var sent = false;
    sock.ondata = function (evt) {
      var view = new Uint8Array(evt.data);
      switch (view[0]) {
        // handshake
        case 0x16:
          if (!sent) {
            sent = true;
            console.log("Sending HB");
            sock.send(heartbeat());
          }
          break;
        // Heartbeat
        case 0x18:
          console.log("Received a HB response!");
          break;
        // alert
        case 0x15:
        default:
          console.log("Unhandled record type: " + view[0]);
          break;
      }
    }

    sock.onerror = function (evt) {
      console.log("ERROR: " + evt.data);
    }

    sock.ondrain = function () {
      console.log("drain called");
    }

    sock.onopen = function () {
      console.log('sending ClientHello');
      sock.send(client_hello());
    }
  } catch (e) {
    console.log(e.name);
  }
}

exports.connect = connect;
