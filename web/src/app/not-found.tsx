import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="porta" id="conteudo">
      <div className="cartao-conta">
        <h1>Página não encontrada</h1>
        <p className="lead">Confira o endereço ou volte à página inicial do Confia.</p>
        <Link className="btn btn--calmo" href="/">Voltar ao início</Link>
      </div>
    </main>
  );
}
