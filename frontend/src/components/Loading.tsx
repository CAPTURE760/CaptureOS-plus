export default function Loading({ text = '加载中...' }: { text?: string }) {
  return (
    <div className="text-center py-12">
      <div className="inline-block w-8 h-8 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-3 text-sm text-gray-500">{text}</p>
    </div>
  );
}
