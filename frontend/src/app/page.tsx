export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-emerald-500 text-white p-10">
      <h1 className="text-4xl font-black">SISTEMA ATUALIZADO - REDIRECIONANDO...</h1>
      <script dangerouslySetInnerHTML={{ __html: 'window.location.href = "/login"' }} />
    </div>
  );
}
