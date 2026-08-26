import React, { useState } from "react";
import axios from "axios";

const Signup = () => {
  const [modal, setModal] = useState(true);
  const [credentials, setCredentials] = useState({
    name: "",
    password: "",
    email: "",
  });

  const handleonSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "https://webglass-backhend.vercel.app/api/signup",
        {
          name: credentials.name,
          email: credentials.email,
          password: credentials.password,
        },
      );
      if (response.data.success) {
        alert("User created Successfully");
        setCredentials({
          name: "",
          email: "",
          password: "",
        });
      } else {
        alert("Can't create the user");
      }
    } catch (error) {
      if (error.response?.status === 409) {
        alert("User already exists");
      }
      if (error.response?.status === 401) {
        alert("The citeria is not matched ");
      }

      console.log(error);
    }
  };
  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };
  return (
    <>
      <div className="min-h-200 flex items-center justify-center  overflow-y-auto ">
        <form
          onSubmit={handleonSubmit}
          className="w-full max-w-sm bg-amber-300 p-6 rounded shadow-md space-y-4"
        >
          <h2 className="text-2xl font-bold text-center">Sign Up</h2>

          <input
            type="text"
            name="name"
            placeholder="Name"
            className="w-full border p-2 rounded"
            value={credentials.name}
            onChange={handleChange}
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            className="w-full border p-2 rounded"
            value={credentials.email}
            onChange={handleChange}
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            className="w-full border p-2 rounded"
            value={credentials.password}
            onChange={handleChange}
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded"
          >
            Sign Up
          </button>
        </form>
      </div>
    </>
  );
};

export default Signup;
