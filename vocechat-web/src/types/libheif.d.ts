declare module "libheif-js/wasm-bundle" {
  const libheif: {
    HeifDecoder: new () => {
      decode(data: Uint8Array): Array<{
        get_width(): number;
        get_height(): number;
        display(imageData: ImageData, callback: (displayData: ImageData | null) => void): void;
      }>;
    };
  };
  export default libheif;
}
