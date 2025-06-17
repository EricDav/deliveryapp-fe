"use client";

import React, { useEffect, useRef, useState } from "react";
import * as echarts from "echarts/core";
import { GridComponent } from "echarts/components";
import { BarChart } from "echarts/charts";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([GridComponent, BarChart, CanvasRenderer]);

const monthData = {
  January: [120, 200, 150, 80, 70, 110, 130],
  February: [100, 180, 140, 90, 60, 100, 120],
  March: [90, 170, 130, 100, 50, 90, 110],
  April: [80, 160, 120, 110, 40, 80, 100],
  May: [70, 150, 110, 120, 30, 70, 90],
  June: [60, 140, 100, 130, 20, 60, 80],
  July: [50, 130, 90, 140, 10, 50, 70],
  August: [40, 120, 80, 150, 20, 60, 80],
  September: [30, 110, 70, 160, 30, 70, 90],
  October: [20, 100, 60, 170, 40, 80, 100],
  November: [10, 90, 50, 180, 50, 90, 110],
  December: [130, 210, 160, 90, 80, 120, 140],
};

const BarChartComponent: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [selectedMonth, setSelectedMonth] = useState<keyof typeof monthData>("January");

  useEffect(() => {
    if (!chartRef.current) return;

    const myChart = echarts.init(chartRef.current);
    const option = {
      xAxis: {
        type: "category",
        data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      },
      yAxis: {
        type: "value",
      },
      series: [
        {
          data: monthData[selectedMonth],
          type: "bar",
          showBackground: true,
          backgroundStyle: {
            color: "rgba(180, 180, 180, 0.2)",
          },
          itemStyle: {
            color: "#4F46E5", // Custom bar color
          },
        },
      ],
    };

    myChart.setOption(option);

    return () => {
      myChart.dispose();
    };
  }, [selectedMonth]); // Re-run the effect when selectedMonth changes

  return (
    <div>
      {/* Dropdown for Month Selection */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-3">Select Month:</label>
        <select
          className="p-2 border rounded-md w-2/4 cursor-pointer"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value as keyof typeof monthData)}
        >
          {Object.keys(monthData).map((month) => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </select>
      </div>

      {/* Chart */}
      <div ref={chartRef} style={{ width: "100%", height: "300px", minHeight: "300px" }} />
    </div>
  );
};

export default BarChartComponent;
