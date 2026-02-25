export default function DocsLayout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="docs">
      <h1 className="font-sans text-2xl font-extrabold break-normal">{title}</h1>
      <hr className="mb-8 border-gray-300" />
      {children}
    </div>
  );
}
