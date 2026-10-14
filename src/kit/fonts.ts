// Local fonts (Fontsource, bundled by webpack — no network at render time).
import '@fontsource/fraunces/400.css';
import '@fontsource/fraunces/500.css';
import '@fontsource/fraunces/600.css';
import '@fontsource/fraunces/700.css';
import '@fontsource/fraunces/900.css';
import '@fontsource/fraunces/400-italic.css';
import '@fontsource/fraunces/600-italic.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import '@fontsource/caveat/500.css';
import '@fontsource/caveat/700.css';
import {continueRender, delayRender} from 'remotion';

const handle = delayRender('Loading fonts');
Promise.all(
  [
    '400 40px Fraunces', '500 40px Fraunces', '600 40px Fraunces', '700 40px Fraunces', '900 40px Fraunces',
    'italic 400 40px Fraunces', 'italic 600 40px Fraunces',
    '400 20px Inter', '500 20px Inter', '600 20px Inter', '700 20px Inter', '800 20px Inter',
    '500 40px Caveat', '700 40px Caveat',
  ].map((f) => document.fonts.load(f))
)
  .then(() => continueRender(handle))
  .catch(() => continueRender(handle));
