import { useEffect, useState } from "react";

const Test = () => {
  const [backendMessage, setBackendMessage] = useState("Connecting...");

  useEffect(() => {
    fetch("http://localhost:5000/")
      .then((res) => res.text())
      .then((data) => setBackendMessage(data))
      .catch((err) => {
        console.error("Error:", err);
        setBackendMessage("Failed to connect to backend.");
      });
  }, []);

  return (
    <div>
      <h1>Connection test</h1>
      <p>{backendMessage}</p>
    </div>
  );
};

export default Test;
