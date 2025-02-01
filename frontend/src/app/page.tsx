"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Loader from "@/components/ui/LoadingScreen";  // Import your loader component

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleNavigate = () => {
    setLoading(true);
    setTimeout(() => {
      router.push("/upload");
    }, 1000); // Add a 1-second delay to show the loader
  };

  return (
    <>
      {loading ? (
        <Loader />
      ) : (
        <div className="relative min-h-screen bg-gradient-to-br from-green-500 to-black text-white flex flex-col items-center justify-center p-6">
          {/* Gradient Circle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[300px] h-[300px] rounded-full bg-gradient-to-br from-green-500 to-black opacity-70"></div>
          </div>

          {/* Centered Image with Fade Effect */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full">
            <div className="relative w-full h-full">
              <Image
                src="/team-image.jpg" // Replace with actual image path
                alt="Team Image"
                width={1000}  // Adjust as needed
                height={300} // Adjust as needed
                className="object-cover w-full h-full"
              />
              {/* Overlay Fade */}
              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-50"></div>
            </div>
          </div>

          {/* Team Info at Bottom */}
          <div className="absolute text-center w-full px-4">
            <h1 className="text-5xl font-extrabold text-white drop-shadow-md leading-tight">
              Pickle Ricks
            </h1>
            <p className="text-lg mt-4 max-w-3xl mx-auto leading-relaxed">
              Our project converts research papers into engaging formats like podcasts, videos, and presentations.
            </p>
            <h2 className="text-3xl font-semibold mt-6 text-white">
              Team Members
            </h2>
            <p className="text-lg mt-2 text-white opacity-80">
              Manav Prajapati | Tirth Gohil | Shrey Vyas | Kavan Desai | Bhaumil Panchal
            </p>

            <Button
              className="mt-8 bg-white text-black font-bold py-3 px-6 rounded-lg hover:bg-gray-300 transition-all duration-200 ease-in-out"
              onClick={handleNavigate}
            >
              Get Started
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
