# Tesseract MRZ model

`mrz.traineddata.gz` is `tessdata_fast/mrz.traineddata` from
[DoubangoTelecom/tesseractMRZ](https://github.com/DoubangoTelecom/tesseractMRZ) at commit
`1e7adfecda5f3c9ae1fb12cf6b4b8c3958c63e46` (gzipped; sha256 of the original file
`ece2a54f125a73792f9cec74e6f8e62f6e5e00c7f19153ba865af689be5b5f01`), under the BSD 3-Clause
license in `LICENSE`.

It's an LSTM model trained on passport machine-readable zones (OCR-B, `A-Z 0-9 <`). The integer
"fast" build is used because Tesseract.js's WebAssembly engine can't run the float "best" build.
`scripts/copy-ocr-assets.mjs` copies it to `public/ocr/lang/` next to the English model.
