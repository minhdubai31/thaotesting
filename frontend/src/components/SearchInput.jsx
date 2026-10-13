import { useEffect, useState } from "react";
import { Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";

// One search field with no attached button. Applies the text after the user pauses typing,
// or straight away on Enter. `value` is the applied search (for example from the URL).
export default function SearchInput({ value = "", onSearch, placeholder, width = 260, style }) {
  const [text, setText] = useState(value);

  useEffect(() => {
    setText(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = text.trim();
      if (next !== (value || "").trim()) onSearch(next);
    }, 400);
    return () => clearTimeout(timer);
  }, [text]);

  return (
    <Input
      prefix={<SearchOutlined style={{ color: "rgba(0, 0, 0, 0.45)" }} />}
      allowClear
      placeholder={placeholder}
      value={text}
      onChange={(event) => setText(event.target.value)}
      onPressEnter={() => onSearch(text.trim())}
      style={{ width, ...style }}
    />
  );
}
