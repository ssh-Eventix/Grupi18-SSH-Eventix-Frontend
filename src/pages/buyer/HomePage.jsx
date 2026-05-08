import { useEffect, useState } from "react";
import api from "../../api/axios";

function HomePage() {

  const [message, setMessage] = useState("");

  useEffect(() => {

    api.get("/health")
      .then((response) => {
        console.log(response.data);
        setMessage(response.data.message);
      })
      .catch((error) => {
        console.error(error);
        setMessage("Backend not connected");
      });

  }, []);

  useEffect(() => {
  console.log("API URL:", import.meta.env.VITE_API_BASE_URL);

  api.get("/health")
    .then((response) => {
      console.log("SUCCESS:", response.data);
      setMessage(response.data.message);
    })
    .catch((error) => {
      console.error("ERROR:", error);
      setMessage("Backend not connected");
    });
}, []);

  return (
    <div>
      <h1>Home Page</h1>
      <p>{message}</p>
    </div>
  );
}

export default HomePage;