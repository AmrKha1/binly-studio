import {Config} from '@remotion/cli/config';

Config.setEntryPoint('./src/index.ts');
// PNG frames: lossless before the single H.264 encode, so flat vector art stays clean (no JPEG ringing).
Config.setVideoImageFormat('png');
Config.setPixelFormat('yuv420p');
Config.setCodec('h264');
Config.setCrf(16);
Config.setChromiumOpenGlRenderer('swangle');
