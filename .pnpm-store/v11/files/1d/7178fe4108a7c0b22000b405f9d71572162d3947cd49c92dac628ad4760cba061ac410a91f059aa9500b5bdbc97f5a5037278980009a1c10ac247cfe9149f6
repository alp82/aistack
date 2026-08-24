import ImageData = require('@canvas/image-data')

declare interface Hotspot {
  x: number
  y: number
}

declare interface BmpData extends ImageData {
  bpp: number
  hotspot: Hotspot | null
  type: 'bmp'
}

declare interface PngData {
  bpp: number
  data: Uint8Array
  height: number
  hotspot: Hotspot | null
  type: 'png'
  width: number
}

declare function decodeIco (source: ArrayBuffer | Int8Array | Uint8Array | Uint8ClampedArray): (BmpData | PngData)[]

export = decodeIco
