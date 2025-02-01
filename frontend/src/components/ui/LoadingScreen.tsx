// components/LoadingScreen.tsx
export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-green-400 to-blue-500 text-white">
      <div className="animate-spin h-20 w-20 border-8 border-t-8 border-white rounded-full mb-6"></div>
      <p className="text-4xl font-bold text-center bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 drop-shadow-lg text-black">
        Loading ...
      </p>
    </div>
  );
}
