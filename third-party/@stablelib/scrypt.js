"use strict";
// Copyright (C) 2016 Dmitry Chestnykh
// MIT License. See LICENSE file for details.
Object.defineProperty(exports, "__esModule", { value: true });
var pbkdf2_1 = require("@stablelib/pbkdf2");
var sha256_1 = require("@stablelib/sha256");
var int_1 = require("@stablelib/int");
var binary_1 = require("@stablelib/binary");
var wipe_1 = require("@stablelib/wipe");
var Scrypt = (function () {
    function Scrypt(N, r, p) {
        // Check parallelization parameter.
        if (p <= 0) {
            throw new Error("scrypt: incorrect p");
        }
        // Check r parameter.
        if (r <= 0) {
            throw new Error("scrypt: incorrect r");
        }
        // Check that N is within supported range.
        if (N < 1 || N > Math.pow(2, 31)) {
            throw new Error('scrypt: N must be between 2 and 2^31');
        }
        // Check that N is a power of two.
        if (!int_1.isInteger(N) || (N & (N - 1)) !== 0) {
            throw new Error("scrypt: N must be a power of 2");
        }
        var MAX_INT = (1 << 31) >>> 0;
        if (r * p >= 1 << 30 || r > MAX_INT / 128 / p || r > MAX_INT / 256 || N > MAX_INT / 128 / r) {
            throw new Error("scrypt: parameters are too large");
        }
        // XXX we can use Uint32Array, but Int32Array is faster, especially in Safari.
        this._V = new Int32Array(32 * (N + 2) * r);
        this._XY = this._V.subarray(32 * N * r);
        this.N = N;
        this.r = r;
        this.p = p;
    }
    Scrypt.prototype.deriveKey = function (password, salt, dkLen) {
        var B = pbkdf2_1.deriveKey(sha256_1.SHA256, password, salt, 1, this.p * 128 * this.r);
        for (var i = 0; i < this.p; i++) {
            smix(B.subarray(i * 128 * this.r), this.r, this.N, this._V, this._XY);
        }
        var result = pbkdf2_1.deriveKey(sha256_1.SHA256, password, B, 1, dkLen);
        wipe_1.wipe(B);
        return result;
    };
    Scrypt.prototype.clean = function () {
        wipe_1.wipe(this._V);
    };
    return Scrypt;
}());
exports.Scrypt = Scrypt;
function smix(B, r, N, V, XY) {
    var xi = 0;
    var yi = 32 * r;
    var tmp = new Int32Array(16);
    for (var i = 0; i < 32 * r; i++) {
        V[i] = binary_1.readUint32LE(B, i * 4);
    }
    for (var i = 0; i < N; i++) {
        blockMix(tmp, V, i * (32 * r), (i + 1) * (32 * r), r);
    }
    for (var i = 0; i < N; i += 2) {
        var j = integerify(XY, xi, r) & (N - 1);
        blockXOR(XY, xi, V, j * (32 * r), 32 * r);
        blockMix(tmp, XY, xi, yi, r);
        j = integerify(XY, yi, r) & (N - 1);
        blockXOR(XY, yi, V, j * (32 * r), 32 * r);
        blockMix(tmp, XY, yi, xi, r);
    }
    for (var i = 0; i < 32 * r; i++) {
        binary_1.writeUint32LE(XY[xi + i], B, i * 4);
    }
    wipe_1.wipe(tmp);
}
function salsaXOR(tmp, B, bin, bout) {
    var j0 = tmp[0] ^ B[bin++], j1 = tmp[1] ^ B[bin++], j2 = tmp[2] ^ B[bin++], j3 = tmp[3] ^ B[bin++], j4 = tmp[4] ^ B[bin++], j5 = tmp[5] ^ B[bin++], j6 = tmp[6] ^ B[bin++], j7 = tmp[7] ^ B[bin++], j8 = tmp[8] ^ B[bin++], j9 = tmp[9] ^ B[bin++], j10 = tmp[10] ^ B[bin++], j11 = tmp[11] ^ B[bin++], j12 = tmp[12] ^ B[bin++], j13 = tmp[13] ^ B[bin++], j14 = tmp[14] ^ B[bin++], j15 = tmp[15] ^ B[bin++];
    var x0 = j0, x1 = j1, x2 = j2, x3 = j3, x4 = j4, x5 = j5, x6 = j6, x7 = j7, x8 = j8, x9 = j9, x10 = j10, x11 = j11, x12 = j12, x13 = j13, x14 = j14, x15 = j15;
    var u;
    for (var i = 0; i < 8; i += 2) {
        u = x0 + x12;
        x4 ^= u << 7 | u >>> (32 - 7);
        u = x4 + x0;
        x8 ^= u << 9 | u >>> (32 - 9);
        u = x8 + x4;
        x12 ^= u << 13 | u >>> (32 - 13);
        u = x12 + x8;
        x0 ^= u << 18 | u >>> (32 - 18);
        u = x5 + x1;
        x9 ^= u << 7 | u >>> (32 - 7);
        u = x9 + x5;
        x13 ^= u << 9 | u >>> (32 - 9);
        u = x13 + x9;
        x1 ^= u << 13 | u >>> (32 - 13);
        u = x1 + x13;
        x5 ^= u << 18 | u >>> (32 - 18);
        u = x10 + x6;
        x14 ^= u << 7 | u >>> (32 - 7);
        u = x14 + x10;
        x2 ^= u << 9 | u >>> (32 - 9);
        u = x2 + x14;
        x6 ^= u << 13 | u >>> (32 - 13);
        u = x6 + x2;
        x10 ^= u << 18 | u >>> (32 - 18);
        u = x15 + x11;
        x3 ^= u << 7 | u >>> (32 - 7);
        u = x3 + x15;
        x7 ^= u << 9 | u >>> (32 - 9);
        u = x7 + x3;
        x11 ^= u << 13 | u >>> (32 - 13);
        u = x11 + x7;
        x15 ^= u << 18 | u >>> (32 - 18);
        u = x0 + x3;
        x1 ^= u << 7 | u >>> (32 - 7);
        u = x1 + x0;
        x2 ^= u << 9 | u >>> (32 - 9);
        u = x2 + x1;
        x3 ^= u << 13 | u >>> (32 - 13);
        u = x3 + x2;
        x0 ^= u << 18 | u >>> (32 - 18);
        u = x5 + x4;
        x6 ^= u << 7 | u >>> (32 - 7);
        u = x6 + x5;
        x7 ^= u << 9 | u >>> (32 - 9);
        u = x7 + x6;
        x4 ^= u << 13 | u >>> (32 - 13);
        u = x4 + x7;
        x5 ^= u << 18 | u >>> (32 - 18);
        u = x10 + x9;
        x11 ^= u << 7 | u >>> (32 - 7);
        u = x11 + x10;
        x8 ^= u << 9 | u >>> (32 - 9);
        u = x8 + x11;
        x9 ^= u << 13 | u >>> (32 - 13);
        u = x9 + x8;
        x10 ^= u << 18 | u >>> (32 - 18);
        u = x15 + x14;
        x12 ^= u << 7 | u >>> (32 - 7);
        u = x12 + x15;
        x13 ^= u << 9 | u >>> (32 - 9);
        u = x13 + x12;
        x14 ^= u << 13 | u >>> (32 - 13);
        u = x14 + x13;
        x15 ^= u << 18 | u >>> (32 - 18);
    }
    B[bout++] = tmp[0] = (x0 + j0) | 0;
    B[bout++] = tmp[1] = (x1 + j1) | 0;
    B[bout++] = tmp[2] = (x2 + j2) | 0;
    B[bout++] = tmp[3] = (x3 + j3) | 0;
    B[bout++] = tmp[4] = (x4 + j4) | 0;
    B[bout++] = tmp[5] = (x5 + j5) | 0;
    B[bout++] = tmp[6] = (x6 + j6) | 0;
    B[bout++] = tmp[7] = (x7 + j7) | 0;
    B[bout++] = tmp[8] = (x8 + j8) | 0;
    B[bout++] = tmp[9] = (x9 + j9) | 0;
    B[bout++] = tmp[10] = (x10 + j10) | 0;
    B[bout++] = tmp[11] = (x11 + j11) | 0;
    B[bout++] = tmp[12] = (x12 + j12) | 0;
    B[bout++] = tmp[13] = (x13 + j13) | 0;
    B[bout++] = tmp[14] = (x14 + j14) | 0;
    B[bout++] = tmp[15] = (x15 + j15) | 0;
}
function blockCopy(dst, di, src, si, len) {
    while (len--) {
        dst[di++] = src[si++];
    }
}
function blockXOR(dst, di, src, si, len) {
    while (len--) {
        dst[di++] ^= src[si++];
    }
}
function blockMix(tmp, B, bin, bout, r) {
    blockCopy(tmp, 0, B, bin + (2 * r - 1) * 16, 16);
    for (var i = 0; i < 2 * r; i += 2) {
        salsaXOR(tmp, B, bin + i * 16, bout + i * 8);
        salsaXOR(tmp, B, bin + i * 16 + 16, bout + i * 8 + r * 16);
    }
}
function integerify(B, bi, r) {
    return B[bi + (2 * r - 1) * 16];
}
//# sourceMappingURL=scrypt.js.map