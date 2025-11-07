import { MessageCircle } from "lucide-react";

const FloatingMessageButton = () => {
  return (
    <button className="fixed bottom-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-danger shadow-2xl transition-transform hover:scale-110 active:scale-95">
      <MessageCircle className="h-7 w-7 text-white" fill="white" />
      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-warning text-xs font-bold text-white">
        3
      </span>
    </button>
  );
};

export default FloatingMessageButton;
