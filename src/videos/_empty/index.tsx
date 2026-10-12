import React from 'react';
import {Stage} from '../../kit/stage';
import type {VideoModule} from '../../kit/video';

// Placeholder used when no video is active.
export const active: VideoModule = {
  meta: {slug: 'none', title: 'No active video', duration: 5},
  Video: () => <Stage />,
};
