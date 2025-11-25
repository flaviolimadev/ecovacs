import { motion } from "framer-motion";
import { TrendingUp, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useEffect, useRef } from "react";

interface FeedItem {
  id: number;
  username: string;
  package: string;
  earnings: number;
  timestamp: string;
}

interface RealtimeFeedProps {
  data: FeedItem[];
}

const RealtimeFeed = ({ data }: RealtimeFeedProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let scrollAmount = 0;
    const scroll = () => {
      scrollAmount += 1;
      if (scrollAmount >= scrollContainer.scrollWidth / 2) {
        scrollAmount = 0;
      }
      scrollContainer.scrollLeft = scrollAmount;
    };

    const interval = setInterval(scroll, 30);
    return () => clearInterval(interval);
  }, [data]);

  const duplicatedData = [...data, ...data];

  return (
    <section className="py-6" aria-label="Recent earnings feed">
      <div className="container px-4">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-success" aria-hidden="true" />
          <h2 className="text-lg font-bold text-foreground">Ganhos Recentes</h2>
        </div>

        <div 
          ref={scrollRef}
          className="flex gap-3 overflow-x-hidden"
          style={{ scrollBehavior: 'auto' }}
        >
          {duplicatedData.map((item, index) => (
            <motion.div
              key={`${item.id}-${index}`}
              className="flex-shrink-0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="w-64 overflow-hidden border-border bg-card shadow-sm">
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-5 w-5 text-primary" aria-hidden="true" />
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">
                        {item.username}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {item.package}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="text-base font-bold text-success">
                      +R$ {item.earnings.toFixed(2)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {item.timestamp}
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RealtimeFeed;

