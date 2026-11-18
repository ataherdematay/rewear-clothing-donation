/* Flat garment drawings in one graphic language: a filled silhouette plus one
   darker detail layer. 100 x 100 viewBox, drawn to sit on a swing tag. */
(function () {
  'use strict';
  var P = {
    tee: ['M30 16 L42 12 Q50 21 58 12 L70 16 L90 32 L80 46 L70 39 L70 88 L30 88 L30 39 L20 46 L10 32 Z', 'M42 12 Q50 21 58 12 L56 11 Q50 17 44 11 Z'],
    polo: ['M30 16 L42 12 L50 20 L58 12 L70 16 L90 32 L80 46 L70 39 L70 88 L30 88 L30 39 L20 46 L10 32 Z', 'M42 12 L50 20 L58 12 L54 24 L50 21 L46 24 Z M49 20 h2 v14 h-2 Z'],
    shirt: ['M32 14 L43 10 L50 18 L57 10 L68 14 L84 28 L92 76 L81 78 L72 42 L70 90 L30 90 L28 42 L19 78 L8 76 L16 28 Z', 'M43 10 L50 18 L57 10 L55 20 L50 22 L45 20 Z M49 22 h2 v68 h-2 Z'],
    blouse: ['M34 14 L44 11 Q50 26 56 11 L66 14 L84 30 L76 44 L68 36 L72 88 L28 88 L32 36 L24 44 L16 30 Z', 'M44 11 Q50 26 56 11 L54 11 Q50 22 46 11 Z M30 60 Q50 66 70 60 L70 63 Q50 69 30 63 Z'],
    sweater: ['M32 14 L42 10 Q50 16 58 10 L68 14 L84 28 L92 78 L80 80 L72 44 L71 84 L29 84 L28 44 L20 80 L8 78 L16 28 Z', 'M29 80 h42 v8 h-42 Z M8 76 l12 2 l-1 6 l-12 -2 Z M92 76 l-12 2 l1 6 l12 -2 Z M42 10 Q50 16 58 10 L58 14 Q50 20 42 14 Z'],
    dress: ['M40 8 L44 8 L46 18 L54 18 L56 8 L60 8 L63 30 L58 40 L82 92 L18 92 L42 40 L37 30 Z', 'M42 38 h16 v4 h-16 Z'],
    skirt: ['M33 20 L67 20 L84 84 L16 84 Z', 'M33 20 L67 20 L68 27 L32 27 Z M44 27 L40 84 L37 84 Z M56 27 L60 84 L63 84 Z'],
    jeans: ['M28 10 L72 10 L76 92 L57 92 L50 36 L43 92 L24 92 Z', 'M28 10 L72 10 L72 17 L28 17 Z M50 17 L50 34 Z M49 17 h2 v18 h-2 Z M31 22 Q38 28 42 20 L42 22 Q37 31 31 25 Z'],
    coat: ['M34 10 L44 8 L50 20 L56 8 L66 10 L80 22 L90 80 L79 82 L72 44 L76 94 L24 94 L28 44 L21 82 L10 80 L20 22 Z', 'M44 8 L50 20 L56 8 L60 24 L50 32 L40 24 Z M49 32 h2 v62 h-2 Z M28 56 h44 v6 h-44 Z'],
    jacket: ['M32 14 L43 10 L50 18 L57 10 L68 14 L84 28 L90 72 L79 74 L72 42 L71 78 L29 78 L28 42 L21 74 L10 72 L16 28 Z', 'M49 18 h2 v60 h-2 Z M29 72 h42 v6 h-42 Z M35 48 h9 v3 h-9 Z M56 48 h9 v3 h-9 Z'],
    blazer: ['M32 12 L43 9 L50 30 L57 9 L68 12 L84 26 L90 78 L79 80 L72 42 L71 88 L29 88 L28 42 L21 80 L10 78 L16 26 Z', 'M43 9 L50 30 L57 9 L52 44 L50 46 L48 44 Z M34 58 h10 v3 h-10 Z M57 30 h8 v8 h-8 Z'],
    scarf: ['M28 8 L72 8 L72 20 L58 22 L60 88 L46 90 L44 24 L28 20 Z', 'M46 76 h14 v3 h-14 Z M46 82 h14 v3 h-14 Z M28 12 h44 v3 h-44 Z'],
    beanie: ['M24 72 Q22 28 50 24 Q78 28 76 72 Z', 'M20 64 h60 v18 h-60 Z M50 12 a8 8 0 1 0 0.1 0 Z'],
    shoes: ['M10 58 L14 40 L30 40 Q36 50 50 52 L82 58 Q92 60 92 70 L92 74 L10 74 Z', 'M10 70 h82 v6 h-82 Z M32 44 l4 4 M36 46 h2 v8 h-2 Z M42 48 h2 v6 h-2 Z']
  };
  function dark(hex) {
    var n = parseInt(hex.slice(1), 16);
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    var f = 0.72;
    return 'rgb(' + Math.round(r * f) + ',' + Math.round(g * f) + ',' + Math.round(b * f) + ')';
  }
  var CUT = { coat: 'cut-coat', blazer: 'cut-uniform', dress: 'cut-dress', jeans: 'cut-denim-scarf', scarf: 'cut-denim-scarf' };
  /* a photographed garment for the kinds we have a cut-out of */
  window.RWcutout = function (type, label) {
    return CUT[type] ? '<img class="glyph cut" src="assets/img/' + CUT[type] + '.png" alt="' + (label || type) + '" width="800" height="800">' : null;
  };
  window.RWglyph = function (type, colour, label) {
    var p = P[type] || P.tee;
    colour = colour || '#f4d96c';
    return '<svg class="glyph" viewBox="0 0 100 100" role="img" aria-label="' + (label || type) + '">' +
      '<path d="' + p[0] + '" fill="' + colour + '"/>' +
      '<path d="' + p[1] + '" fill="' + dark(colour) + '"/></svg>';
  };
})();
