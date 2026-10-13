import { useState } from "react";

// Shows the product image, or a placeholder when there is no image or it fails to load.
export default function ProductImage({ src, large = false }) {
  const [failed, setFailed] = useState(false);
  const className = `thumb${large ? " big" : ""}`;

  if (!src || failed) {
    return <div className={`${className} placeholder`}>No image</div>;
  }

  return <img className={className} src={src} alt="" loading="lazy" onError={() => setFailed(true)} />;
}
