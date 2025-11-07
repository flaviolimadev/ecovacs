import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

const transactions = [
  {
    type: "deposit",
    user: "Fernanda R***",
    amount: 350.00,
  },
  {
    type: "withdraw",
    user: "Carlos M***",
    amount: 125.50,
  },
  {
    type: "deposit",
    user: "Ana P***",
    amount: 500.00,
  },
  {
    type: "withdraw",
    user: "João S***",
    amount: 280.00,
  },
  {
    type: "deposit",
    user: "Maria L***",
    amount: 750.00,
  },
  {
    type: "withdraw",
    user: "Pedro O***",
    amount: 420.00,
  },
];

const TransactionNotification = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % transactions.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const current = transactions[currentIndex];
  const isDeposit = current.type === "deposit";

  return (
    <div className="mx-4 mt-4 overflow-hidden">
      <div
        key={currentIndex}
        className={`rounded-lg px-4 py-3 transition-all duration-500 animate-fade-in ${
          isDeposit ? "bg-success/10" : "bg-warning/10"
        }`}
      >
        <div className="flex items-center gap-2">
          {isDeposit ? (
            <TrendingUp className="h-4 w-4 text-success" />
          ) : (
            <TrendingDown className="h-4 w-4 text-warning" />
          )}
          <p className={`text-sm ${isDeposit ? "text-success" : "text-warning"}`}>
            <span className="font-medium">{current.user}</span>{" "}
            {isDeposit ? "depositou" : "sacou"}{" "}
            <span className="font-bold">
              R$ {current.amount.toFixed(2)}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TransactionNotification;
