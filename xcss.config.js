// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck - FIXME: Fix ekscss types
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-var-requires, import/no-extraneous-dependencies, strict */

'use strict';

const framework = require('@ekscss/framework/config');
const { extend, preloadApply } = require('@ekscss/framework/utils');
const { ctx, onBeforeBuild, xcss } = require('ekscss');

// Generate references so #apply can be used in any file
onBeforeBuild(preloadApply);

// Cheeky abuse of ekscss ctx to stop unwanted style imports
onBeforeBuild(() => {
  ctx.dependencies.push(
    require.resolve('@ekscss/framework/level2/a11y.xcss'),
    require.resolve('@ekscss/framework/level2/form.xcss'),
  );
});

const config = extend(framework, {
  globals: {
    color: {
      primary: (x) => x.color.rose4,
      background: (x) => x.color.black,
      text: (x) => x.color.light1,
      muted: (x) => x.color.gray2,
      linkHover: (x) => x.color.rose5,
    },

    input: {
      textColor: (x) => x.color.light2,
      backgroundColor: 'transparent',
      outlineSize: '2px',
      border: (x) => xcss`1px solid ${x.color.gray1}`,
      hoverBorderColor: (x) => x.color.gray4,
      disabledBackgroundColor: 'transparent',
      disabledBorder: (x) => x.color.dark3,
    },

    media: { ns: '', m: '', l: '' }, // not a responsive app
    textSize: '15px',
    fontStack: 'Literata, serif',

    app: {
      width: '600px',
    },
  },
});

// Remove @ekscss/plugin-prefix
// XXX: This may break when @ekscss/framework is updated!
config.plugins.pop();

module.exports = config;
