import { Buffer } from 'buffer';

const bufferModule = require('buffer') as typeof import('buffer') & {
  SlowBuffer?: typeof Buffer;
};

if (!bufferModule.SlowBuffer) {
  bufferModule.SlowBuffer = Buffer;
}
