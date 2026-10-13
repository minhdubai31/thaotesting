import { useState } from "react";
import { PictureOutlined } from "@ant-design/icons";

// Product photo that falls back to a placeholder when there is no image or it fails to load.
export default function ProductImage({ src, alt = "", height = 200, preview = false }) {
  const [failed, setFailed] = useState(false);
  const padding = Math.max(4, Math.min(20, Math.round(height * 0.08)));

  if (!src || failed) {
    return (
      <div className="product-placeholder" style={{ height }}>
        <PictureOutlined />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className="product-image"
      style={{ height, padding, cursor: preview ? "zoom-in" : undefined }}
    />
  );
}
