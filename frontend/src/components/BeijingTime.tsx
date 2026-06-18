'use client';

import { useEffect, useRef } from 'react';

export default function BeijingTime() {
  const timeRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const beijingTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
      const h = beijingTime.getHours().toString().padStart(2, '0');
      const m = beijingTime.getMinutes().toString().padStart(2, '0');
      const s = beijingTime.getSeconds().toString().padStart(2, '0');
      if (timeRef.current) timeRef.current.textContent = `${h}:${m}:${s}`;

      const year = beijingTime.getFullYear();
      const month = (beijingTime.getMonth() + 1).toString().padStart(2, '0');
      const day = beijingTime.getDate().toString().padStart(2, '0');
      const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      if (dateRef.current) dateRef.current.textContent = `${year}-${month}-${day} ${weekDays[beijingTime.getDay()]}`;
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-center py-3 border-b border-gray-700">
      <div className="text-xs text-gray-400 mb-1">北京时间</div>
      <div ref={timeRef} className="text-xl font-mono font-bold text-green-400 tracking-wider">
        --:--:--
      </div>
      <div ref={dateRef} className="text-xs text-gray-400 mt-1">
        ----/--/-- ---
      </div>
    </div>
  );
}
