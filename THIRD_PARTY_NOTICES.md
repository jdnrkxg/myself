# Third-party notices

## SkyEngine

This release loads SkyEngine from jsDelivr at runtime:
- Project: https://github.com/drakkB/skyengine
- Engine: https://cdn.jsdelivr.net/gh/drakkB/skyengine@main/sky-engine.js
- Star data: https://cdn.jsdelivr.net/gh/drakkB/skyengine@main/sky-data.js
- License: MIT, copyright (c) 2026 drakkB. The star catalogue is derived from d3-celestial (BSD 3-Clause) and uses Yale Bright Star Catalogue and Hipparcos/Gaia catalogue sources.

MIT License

Copyright (c) 2026 drakkB

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

Star catalogue data in sky-data.js is derived from the d3-celestial project
(https://github.com/ofrohn/d3-celestial), licensed under the BSD 3-Clause
License, built on the Yale Bright Star Catalogue and the Hipparcos/Gaia
catalogues (ESA).

## Aladin Lite

This release loads Aladin Lite v3.9.4 at runtime from the official CDS Strasbourg endpoint:
- Script: https://aladin.cds.unistra.fr/AladinLite/api/v3/3.9.4/aladin.js
- Project and documentation: https://cds-astro.github.io/aladin-lite/
- License: GNU Lesser General Public License v3.0 or later (LGPL-3.0-or-later).
- Copyright and attribution remain with the Aladin Lite / CDS authors. The Aladin Lite logo/link is intentionally left visible in the viewer as required by the project's integration terms.

## HiPS astronomical survey imagery

The deep-sky explorer requests survey tiles from the upstream HiPS services selected by Aladin Lite:
- DSS2 color: `P/DSS2/color`
- Pan-STARRS DR1 color: `P/PanSTARRS/DR1/color-i-r-g`
- 2MASS color: `P/2MASS/color`
- AllWISE color: `P/allWISE/color`

HiPS is the Hierarchical Progressive Surveys format. Survey data and tile hosting are provided by the respective astronomical survey/data-center providers; Elseverse does not redistribute or bundle those image tiles. See https://aladin.cds.unistra.fr/hips/ and https://cds.unistra.fr/ for survey information and mirrors.
