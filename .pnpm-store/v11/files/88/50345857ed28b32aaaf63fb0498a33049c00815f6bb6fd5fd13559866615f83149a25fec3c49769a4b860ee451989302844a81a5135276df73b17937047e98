# Decode BMP

Decode `.bmp` images

## Installation

```sh
npm install --save decode-bmp
```

## Usage

```js
const decodeBmp = require('decode-bmp')
const fs = require('fs')

const source = fs.readFileSync('foobar.bmp')
const image = decodeBmp(source)

console.log(image)
//=> { width: 32, height: 32, data: Uint8ClampedArray(...), colorDepth: 32 }
```

## API

### `decodeBmp(source: ArrayBuffer | Buffer) => ImageData`

Decodes the `.bmp` file in the given buffer, and returns an image.

The image has the following properties:

- `width: number` - The width of the image, in pixels
- `height: number` - The height of the image, in pixels
- `data: Uint8ClampedArray` - The data of the image, in the `RGBA` format
- `colorDepth: number` - The color depth of the image as the number of bits used per pixel
