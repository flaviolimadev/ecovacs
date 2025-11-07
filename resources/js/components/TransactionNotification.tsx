import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Coins } from "lucide-react";

// Lista de nomes brasileiros realistas
const firstNames = [
  "Ana", "Carlos", "Maria", "João", "Fernanda", "Pedro", "Julia", "Lucas", 
  "Beatriz", "Rafael", "Camila", "Bruno", "Larissa", "Felipe", "Amanda",
  "Gabriel", "Mariana", "Thiago", "Juliana", "Rodrigo", "Patricia", "Diego",
  "Leticia", "Marcelo", "Vanessa", "André", "Priscila", "Renato", "Tatiana",
  "Fabio", "Adriana", "Leonardo", "Bruna", "Ricardo", "Claudia", "Gustavo",
  "Simone", "Vinicius", "Daniela", "Alexandre", "Monica", "Mauricio", "Paula",
  "Henrique", "Carla", "Fernando", "Roberta", "Leandro", "Luciana", "Sergio"
];

const lastInitials = [
  "S", "M", "O", "P", "R", "L", "F", "C", "A", "G", "T", "N", "B", "D", "V"
];

const transactionTypes = [
  { type: "deposit", label: "alugou" },
  { type: "profit", label: "lucrou" },
  { type: "withdraw", label: "sacou" }
];

// Função para gerar nome aleatório mascarado
const generateRandomUser = () => {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastInitial = lastInitials[Math.floor(Math.random() * lastInitials.length)];
  return `${firstName} ${lastInitial}***`;
};

// Função para gerar valor aleatório realista
const generateRandomAmount = (type: string) => {
  if (type === "deposit") {
    // Depósitos: R$ 50 - R$ 2500
    const ranges = [
      { min: 50, max: 150, weight: 40 },    // Mais comum
      { min: 150, max: 500, weight: 30 },   // Comum
      { min: 500, max: 1000, weight: 20 },  // Menos comum
      { min: 1000, max: 2500, weight: 10 }  // Raro
    ];
    
    const totalWeight = ranges.reduce((sum, range) => sum + range.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const range of ranges) {
      if (random < range.weight) {
        return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
      }
      random -= range.weight;
    }
  } else if (type === "profit") {
    // Lucros: R$ 5 - R$ 200
    const ranges = [
      { min: 5, max: 30, weight: 50 },     // Muito comum
      { min: 30, max: 80, weight: 30 },    // Comum
      { min: 80, max: 150, weight: 15 },   // Menos comum
      { min: 150, max: 200, weight: 5 }    // Raro
    ];
    
    const totalWeight = ranges.reduce((sum, range) => sum + range.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const range of ranges) {
      if (random < range.weight) {
        const value = Math.random() * (range.max - range.min) + range.min;
        return Math.round(value * 100) / 100; // 2 decimais
      }
      random -= range.weight;
    }
  } else {
    // Saques: R$ 50 - R$ 1500
    const ranges = [
      { min: 50, max: 200, weight: 40 },
      { min: 200, max: 500, weight: 35 },
      { min: 500, max: 1000, weight: 20 },
      { min: 1000, max: 1500, weight: 5 }
    ];
    
    const totalWeight = ranges.reduce((sum, range) => sum + range.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const range of ranges) {
      if (random < range.weight) {
        return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
      }
      random -= range.weight;
    }
  }
  return 100;
};

// Função para gerar transação aleatória
const generateTransaction = () => {
  // 50% depósitos, 40% lucros, 10% saques
  const rand = Math.random();
  let type: string;
  
  if (rand < 0.5) {
    type = "deposit";
  } else if (rand < 0.9) {
    type = "profit";
  } else {
    type = "withdraw";
  }
  
  const transaction = transactionTypes.find(t => t.type === type)!;
  
  return {
    type: transaction.type,
    label: transaction.label,
    user: generateRandomUser(),
    amount: generateRandomAmount(type),
  };
};

const TransactionNotification = () => {
  const [currentTransaction, setCurrentTransaction] = useState(generateTransaction());
  const [previousTransactions, setPreviousTransactions] = useState<string[]>([]);

  useEffect(() => {
    const getNextTransaction = () => {
      let newTransaction = generateTransaction();
      let attempts = 0;
      const maxAttempts = 10;
      
      // Evitar repetir as últimas 5 transações
      const transactionKey = `${newTransaction.user}-${newTransaction.amount}`;
      while (previousTransactions.includes(transactionKey) && attempts < maxAttempts) {
        newTransaction = generateTransaction();
        attempts++;
      }
      
      // Atualizar histórico
      setPreviousTransactions(prev => {
        const newHistory = [...prev, `${newTransaction.user}-${newTransaction.amount}`];
        return newHistory.slice(-5); // Manter apenas as últimas 5
      });
      
      return newTransaction;
    };

    // Tempo aleatório entre notificações: 3-7 segundos
    const randomInterval = () => Math.floor(Math.random() * 4000) + 3000;
    
    const scheduleNext = () => {
      const interval = randomInterval();
      return setTimeout(() => {
        setCurrentTransaction(getNextTransaction());
        scheduleNext();
      }, interval);
    };
    
    const timeoutId = scheduleNext();

    return () => clearTimeout(timeoutId);
  }, [previousTransactions]);

  const isDeposit = currentTransaction.type === "deposit";
  const isProfit = currentTransaction.type === "profit";
  const isWithdraw = currentTransaction.type === "withdraw";

  return (
    <div className="mx-4 mt-4 overflow-hidden">
      <div
        key={`${currentTransaction.user}-${currentTransaction.amount}`}
        className={`rounded-lg px-4 py-3 transition-all duration-500 animate-fade-in ${
          isDeposit 
            ? "bg-blue-500/10" 
            : isProfit 
            ? "bg-success/10" 
            : "bg-warning/10"
        }`}
      >
        <div className="flex items-center gap-2">
          {isDeposit ? (
            <TrendingUp className="h-4 w-4 text-blue-600" />
          ) : isProfit ? (
            <Coins className="h-4 w-4 text-success" />
          ) : (
            <TrendingDown className="h-4 w-4 text-warning" />
          )}
          <p className={`text-sm ${
            isDeposit 
              ? "text-blue-600" 
              : isProfit 
              ? "text-success" 
              : "text-warning"
          }`}>
            <span className="font-medium">{currentTransaction.user}</span>{" "}
            {currentTransaction.label}{" "}
            <span className="font-bold">
              R$ {currentTransaction.amount.toFixed(2)}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TransactionNotification;
