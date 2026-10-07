export default function LoginLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto" />
        <p className="mt-4 text-white/60">Loading...</p>
      </div>
    </div>
  );
}
