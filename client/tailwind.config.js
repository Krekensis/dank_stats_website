// tailwind.config.js
module.exports = {
  // ...
  theme: {
    extend: {
      fontFamily: {
        audiowide: ['"Audiowide"', 'monospace'],
      },
    },
  },
  plugins: [],
  variants: {
    extend: {
      stroke: ['peer-checked'],
    },
  },
}