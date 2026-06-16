'use client';

import { useState, useEffect } from 'react';

export default function BeijingTime() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    // 初始化时设置时间
    setTime(new Date());

    // 每秒更新
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!time) {
    return (
      <div className="text-center py-2">
        <div className="text-xs text-gray-400">北京时间</div>
        <div className="text-sm font-mono">--:--:--</div>
      </div>
    );
  }

  // 转换为北京时间 (UTC+8)
  const beijingTime = new Date(time.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
  const hours = beijingTime.getHours().toString().padStart(2, '0');
  const minutes = beijingTime.getMinutes().toString().padStart(2, '0');
  const seconds = beijingTime.getSeconds().toString().padStart(2, '0');

  const year = beijingTime.getFullYear();
  const month = (beijingTime.getMonth() + 1).toString().padStart(2, '0');
  const day = beijingTime.getDate().toString().padStart(2, '0');

  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekDay = weekDays[beijingTime.getDay()];

  return (
    <div className="text-center py-3 border-b border-gray-700">
      <div className="text-xs text-gray-400 mb-1">北京时间</div>
      <div className="text-xl font-mono font-bold text-green-400 tracking-wider">
        {hours}:{minutes}:{seconds}
      </div>
      <div className="text-xs text-gray-400 mt-1">
        {year}-{month}-{day} {weekDay}
      </div>
    </div>
  );
}
