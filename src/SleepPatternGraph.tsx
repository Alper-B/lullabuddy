// src/SleepPatternChart.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "./components/ui/card";
import { cn } from "./lib/utils";

const BASE_URL = import.meta.env.PROD 
  ? "https://theta.proto.aalto.fi" 
  : "";

interface Pattern {
  timestamp: string;               // ISO8601
  patternType: "sleep" | "awake";
}

interface DailySleep {
  date: string;                    // e.g. "2025-10-11"
  hours: number;
}

const SleepPatternChart = ({ className }: { className?: string }) => {
  const [data, setData] = useState<DailySleep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem("token");
        const deviceId = localStorage.getItem("deviceId") ;
        if (!token) throw new Error("Not authenticated");

        // 1) Fetch raw patterns
        const res = await axios.get<Pattern[]>(
          `${BASE_URL}/api/devices/${deviceId}/patterns`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const patterns = res.data;

        // 2) Skip leading "awake"
        let i = 0;
        while (i < patterns.length && patterns[i].patternType === "awake") {
          i++;
        }

        // 3) Walk and compute segments
        const segments: Array<{ start: number; end: number }> = [];
        let initial = "awake" as "awake" | "sleep";
        let lastTimestamp = 0;

        for (; i < patterns.length; i++) {
          const { patternType, timestamp } = patterns[i];
          const t = new Date(timestamp).getTime();

          if (patternType === initial) {
            // ignore runs of same type
            continue;
          }

          if (initial === "awake") {
            // transition: awake → sleep
            lastTimestamp = t;        // remember sleep start
          } else {
            // transition: sleep → awake
            segments.push({ start: lastTimestamp, end: t });
          }

          initial = patternType;
          lastTimestamp = t;
        }

        // 4) Aggregate by day
        const dailyMap: Record<string, number> = {};
        segments.forEach(({ start, end }) => {
          const day = new Date(start).toISOString().split("T")[0];
          const hours = (end - start) / 3600000;
          dailyMap[day] = (dailyMap[day] || 0) + hours;
        });

        // 5) Build chart array
        const chartData = Object.entries(dailyMap)
          .map(([date, hours]) => ({ date, hours: +hours.toFixed(2) }))
          .sort((a, b) => a.date.localeCompare(b.date));

        setData(chartData);
      } catch (err: any) {
        console.error("Failed to load sleep patterns:", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div className={cn("flex flex-col items-center gap-6 p-6", className)}>
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Baby Sleep Patterns</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-gray-500">Loading sleep data...</p>
          ) : data.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => new Date(d).toLocaleDateString()}
                />
                <YAxis
                  label={{
                    value: "Hours Slept",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip formatter={(v: number) => `${v} h`} />
                <Line
                  type="monotone"
                  dataKey="hours"
                  name="Hours Slept"
                  stroke="#836EED"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500">
              No sleep data available.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SleepPatternChart;