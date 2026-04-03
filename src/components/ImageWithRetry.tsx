import React, { useEffect, useRef } from 'react';

const ImageWithRetry = (props: any) => {
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // keep trying to load the image until it succeeds
    if (imgRef.current) {
      const timestamp = Date.now();

      // @ts-ignore
      imgRef.current.onerror = () => {
        if (Date.now() - timestamp < 10000) {
          setTimeout(() => {
            if (imgRef.current) {
              // @ts-ignore
              imgRef.current.src = props.src;
            }
          }, 1000);
        }
      };
      // @ts-ignore
      imgRef.current.onload = () => {};
      // @ts-ignore
      imgRef.current.src = props.src;
    }
  }, []);

  return (
    <img
      {...props}
      ref={imgRef}
      style={{
        display: 'none',
      }}
      onError={() => {
        // console.log("onError");
      }}
      onLoad={() => {
        // console.log("onLoad");
        // @ts-ignore
        imgRef.current.style.display = 'block';
      }}
    />
  );
};

export default ImageWithRetry;
